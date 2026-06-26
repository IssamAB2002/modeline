"""
Full two-way sync between ZR Express territories and local Wilaya / Baladia records.

ZR Express is treated as the source of truth:
  • Name matches ZR  → keep, only update zr_territory_id if missing
  • Name differs     → update DB name to match ZR
  • In ZR, not in DB → create new record
  • In DB, not in ZR → delete from DB

Wilayas are matched by code (1–58).
Baladias are matched by zr_territory_id first (re-runs), then Arabic name, then French name.

Usage:
  python manage.py sync_zr_territories            # live run
  python manage.py sync_zr_territories --dry-run  # preview only, no DB writes
"""

from collections import defaultdict

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.shop.models import Baladia, Wilaya


class Command(BaseCommand):
    help = 'Full sync of ZR Express territories into Wilaya and Baladia records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without writing to the database',
        )

    def handle(self, *args, **options):
        dry = options['dry_run']
        if dry:
            self.stdout.write(self.style.WARNING('DRY RUN — no database changes will be made\n'))

        secret_key = settings.ZR_SECRET_KEY
        tenant_id = settings.ZR_TENANT_ID

        if not secret_key or not tenant_id:
            self.stderr.write(self.style.ERROR(
                'ZR_SECRET_KEY and ZR_TENANT_ID must be set in .env'
            ))
            return

        headers = {
            'X-Tenant': tenant_id,
            'X-Api-Key': secret_key,
            'Content-Type': 'application/json',
        }
        self.stdout.write('Fetching territories from ZR Express…')
        items = []
        page = 1
        while True:
            payload = {'pageNumber': page, 'pageSize': 1000, 'orderBy': ['code asc']}
            try:
                response = requests.post(
                    'https://api.zrexpress.app/api/v1.0/territories/search',
                    json=payload,
                    headers=headers,
                    timeout=30,
                )
                response.raise_for_status()
            except requests.RequestException as exc:
                self.stderr.write(self.style.ERROR(f'Request failed on page {page}: {exc}'))
                return

            data = response.json()
            page_items = data.get('items', [])
            items.extend(page_items)
            total_pages = data.get('totalPages', 1)
            self.stdout.write(f'  Page {page}/{total_pages}: {len(page_items)} entries')
            if page >= total_pages:
                break
            page += 1

        self.stdout.write(f'Received {len(items)} territory entries total.\n')

        zr_wilayas = [t for t in items if t.get('level') == 'wilaya']
        zr_communes = [t for t in items if t.get('level') == 'commune']

        # ── WILAYAS ──────────────────────────────────────────────────────────
        self.stdout.write('── Syncing Wilayas ──')

        zr_wilaya_codes = {t['code'] for t in zr_wilayas if isinstance(t.get('code'), int)}
        zr_id_to_wilaya: dict = {}  # zr UUID → Wilaya (used by commune pass)

        w_updated = w_created = w_deleted = w_unchanged = 0

        wilayas_by_code = {w.code: w for w in Wilaya.objects.all()}

        for t in zr_wilayas:
            code = t.get('code')
            if not isinstance(code, int):
                continue

            name_ar = (t.get('nameArabic') or '').strip()
            name_fr = (t.get('name') or '').strip()

            wilaya = wilayas_by_code.get(code)

            if wilaya is None:
                self.stdout.write(f'  + Create Wilaya {code} – {name_fr}')
                if not dry:
                    wilaya = Wilaya.objects.create(
                        code=code,
                        name_ar=name_ar,
                        name_fr=name_fr,
                        zr_territory_id=t['id'],
                    )
                    wilayas_by_code[code] = wilaya
                w_created += 1
            else:
                changed_fields = []
                if str(wilaya.zr_territory_id) != str(t['id']):
                    wilaya.zr_territory_id = t['id']
                    changed_fields.append('zr_territory_id')
                if name_ar and wilaya.name_ar != name_ar:
                    self.stdout.write(f'  ~ Wilaya {code} name_ar: "{wilaya.name_ar}" → "{name_ar}"')
                    wilaya.name_ar = name_ar
                    changed_fields.append('name_ar')
                if name_fr and wilaya.name_fr != name_fr:
                    self.stdout.write(f'  ~ Wilaya {code} name_fr: "{wilaya.name_fr}" → "{name_fr}"')
                    wilaya.name_fr = name_fr
                    changed_fields.append('name_fr')

                if changed_fields:
                    if not dry:
                        wilaya.save(update_fields=changed_fields)
                    w_updated += 1
                else:
                    w_unchanged += 1

            if wilaya is not None:
                zr_id_to_wilaya[t['id']] = wilaya

        # Delete DB wilayas absent from ZR Express
        for code, wilaya in list(wilayas_by_code.items()):
            if code not in zr_wilaya_codes:
                self.stdout.write(self.style.WARNING(
                    f'  - Delete Wilaya {code} – {wilaya.name_fr} (not in ZR Express)'
                ))
                if not dry:
                    wilaya.delete()
                w_deleted += 1

        self.stdout.write(self.style.SUCCESS(
            f'Wilayas — updated: {w_updated}, created: {w_created}, '
            f'deleted: {w_deleted}, unchanged: {w_unchanged}\n'
        ))

        # ── COMMUNES (BALADIAS) ───────────────────────────────────────────────
        self.stdout.write('── Syncing Communes (Baladias) ──')

        c_updated = c_created = c_deleted = c_unchanged = 0

        # Group ZR communes by parent wilaya UUID
        zr_communes_by_parent: dict = defaultdict(list)
        for t in zr_communes:
            parent_id = t.get('parentId')
            if parent_id:
                zr_communes_by_parent[parent_id].append(t)

        for zr_wilaya_id, wilaya in zr_id_to_wilaya.items():
            zr_commune_list = zr_communes_by_parent.get(zr_wilaya_id, [])

            db_baladias = list(Baladia.objects.filter(wilaya=wilaya))

            # Lookup maps for matching
            db_by_zr_id  = {str(b.zr_territory_id): b for b in db_baladias if b.zr_territory_id}
            db_by_name_ar = {b.name_ar: b for b in db_baladias}
            db_by_name_fr = {b.name_fr.lower(): b for b in db_baladias}

            matched_db_ids: set = set()

            for t in zr_commune_list:
                zr_id  = t['id']
                name_ar = (t.get('nameArabic') or '').strip()
                name_fr = (t.get('name') or '').strip()

                # Match priority: existing zr_territory_id → Arabic name → French name
                baladia = (
                    db_by_zr_id.get(zr_id)
                    or db_by_name_ar.get(name_ar)
                    or db_by_name_fr.get(name_fr.lower())
                )

                if baladia is not None:
                    matched_db_ids.add(baladia.id)

                    changed_fields = []
                    if str(baladia.zr_territory_id) != zr_id:
                        baladia.zr_territory_id = zr_id
                        changed_fields.append('zr_territory_id')
                    if name_ar and baladia.name_ar != name_ar:
                        self.stdout.write(
                            f'  ~ Baladia name_ar in {wilaya}: "{baladia.name_ar}" → "{name_ar}"'
                        )
                        baladia.name_ar = name_ar
                        changed_fields.append('name_ar')
                    if name_fr and baladia.name_fr != name_fr:
                        self.stdout.write(
                            f'  ~ Baladia name_fr in {wilaya}: "{baladia.name_fr}" → "{name_fr}"'
                        )
                        baladia.name_fr = name_fr
                        changed_fields.append('name_fr')

                    if changed_fields:
                        if not dry:
                            baladia.save(update_fields=changed_fields)
                        c_updated += 1
                    else:
                        c_unchanged += 1

                else:
                    # Not in DB — create it
                    self.stdout.write(f'  + Create Baladia "{name_fr}" in {wilaya}')
                    if not dry:
                        Baladia.objects.create(
                            wilaya=wilaya,
                            name_ar=name_ar,
                            name_fr=name_fr,
                            zr_territory_id=zr_id,
                        )
                    c_created += 1

            # Delete DB baladias that have no match in ZR Express for this wilaya
            for baladia in db_baladias:
                if baladia.id not in matched_db_ids:
                    self.stdout.write(self.style.WARNING(
                        f'  - Delete Baladia "{baladia.name_fr}" in {wilaya} (not in ZR Express)'
                    ))
                    if not dry:
                        baladia.delete()
                    c_deleted += 1

        self.stdout.write(self.style.SUCCESS(
            f'Communes — updated: {c_updated}, created: {c_created}, '
            f'deleted: {c_deleted}, unchanged: {c_unchanged}'
        ))
        self.stdout.write(self.style.SUCCESS('\nsync_zr_territories complete.'))
