"""
Full sync of ZR Express hubs (pickup points / stopdesks) into local Hub records.

ZR Express is treated as the source of truth:
  • Matched by zr_hub_id → update fields if changed
  • In ZR, not in DB      → create new record
  • In DB, not in ZR      → delete from DB

Hubs are linked to Wilaya via address.cityTerritoryId == Wilaya.zr_territory_id
(same territory UUID space verified for both wilayas and hubs). Hubs whose
cityTerritoryId has no matching Wilaya are skipped with a warning.

Usage:
  python manage.py sync_zr_hubs            # live run
  python manage.py sync_zr_hubs --dry-run  # preview only, no DB writes
"""

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.shop.models import Hub, Wilaya


class Command(BaseCommand):
    help = 'Full sync of ZR Express hubs into Hub records'

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

        self.stdout.write('Fetching hubs from ZR Express…')
        items = []
        page = 1
        while True:
            payload = {'pageNumber': page, 'pageSize': 1000}
            try:
                response = requests.post(
                    'https://api.zrexpress.app/api/v1/hubs/search',
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

        self.stdout.write(f'Received {len(items)} hub entries total.\n')

        wilayas_by_zr_id = {
            str(w.zr_territory_id): w
            for w in Wilaya.objects.exclude(zr_territory_id__isnull=True)
        }

        db_hubs_by_zr_id = {str(h.zr_hub_id): h for h in Hub.objects.all()}
        zr_hub_ids = set()

        updated = created = deleted = unchanged = skipped = 0

        for item in items:
            zr_id = item.get('id')
            if not zr_id:
                continue

            address = item.get('address') or {}
            city_territory_id = address.get('cityTerritoryId')
            wilaya = wilayas_by_zr_id.get(str(city_territory_id))

            if wilaya is None:
                self.stdout.write(self.style.WARNING(
                    f'  ! Skip hub "{item.get("name")}" — no matching Wilaya for '
                    f'cityTerritoryId {city_territory_id}'
                ))
                skipped += 1
                continue

            zr_hub_ids.add(zr_id)

            phone = (item.get('phone') or {}).get('number1', '')
            coordinates = address.get('coordinates') or {}

            field_values = dict(
                name=item.get('name', ''),
                type=item.get('type', Hub.HubType.HUB),
                is_pickup_point=bool(item.get('isPickupPoint', False)),
                is_visible=bool(item.get('isVisible', False)),
                is_return_center=bool(item.get('isReturnCenter', False)),
                wilaya=wilaya,
                street=address.get('street') or '',
                district=address.get('district') or '',
                postal_code=address.get('postalCode') or '',
                phone=phone or '',
                lat=coordinates.get('lat'),
                lng=coordinates.get('lng'),
            )

            hub = db_hubs_by_zr_id.get(zr_id)

            if hub is None:
                self.stdout.write(f'  + Create Hub "{field_values["name"]}" ({wilaya.name_fr})')
                if not dry:
                    Hub.objects.create(zr_hub_id=zr_id, **field_values)
                created += 1
            else:
                changed_fields = []
                for field, value in field_values.items():
                    if getattr(hub, field if field != 'wilaya' else 'wilaya_id') != (
                        value.id if field == 'wilaya' else value
                    ):
                        setattr(hub, field, value)
                        changed_fields.append(field)

                if changed_fields:
                    self.stdout.write(f'  ~ Update Hub "{hub.name}": {", ".join(changed_fields)}')
                    if not dry:
                        hub.save(update_fields=changed_fields)
                    updated += 1
                else:
                    unchanged += 1

        for zr_id, hub in list(db_hubs_by_zr_id.items()):
            if zr_id not in zr_hub_ids:
                self.stdout.write(self.style.WARNING(
                    f'  - Delete Hub "{hub.name}" (not in ZR Express)'
                ))
                if not dry:
                    hub.delete()
                deleted += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nHubs — created: {created}, updated: {updated}, deleted: {deleted}, '
            f'unchanged: {unchanged}, skipped (no wilaya match): {skipped}'
        ))
        self.stdout.write(self.style.SUCCESS('sync_zr_hubs complete.'))
