import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.shop.models import Wilaya


class Command(BaseCommand):
    help = 'Sync ZR Express delivery rates into Wilaya shipping price fields'

    def handle(self, *args, **options):
        secret_key = settings.ZR_SECRET_KEY
        tenant_id = settings.ZR_TENANT_ID

        if not secret_key or not tenant_id:
            self.stderr.write(self.style.ERROR(
                'ZR_SECRET_KEY and ZR_TENANT_ID must be set in .env'
            ))
            return

        headers = {
            'X-Api-Key': secret_key,
            'X-Tenant': tenant_id,
            'Content-Type': 'application/json',
        }

        self.stdout.write('Fetching delivery rates from ZR Express…')
        try:
            response = requests.get(
                'https://api.zrexpress.app/api/v1/delivery-pricing/rates',
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            self.stderr.write(self.style.ERROR(f'Request failed: {exc}'))
            return

        rates = response.json().get('rates', [])
        self.stdout.write(f'Received {len(rates)} rate entries.')

        # Build lookup: zr_territory_id UUID (as str) → Wilaya
        wilayas_by_zr_id = {
            str(w.zr_territory_id): w
            for w in Wilaya.objects.exclude(zr_territory_id__isnull=True)
        }

        synced = 0
        skipped = 0

        for rate in rates:
            # Only process wilaya-level destination entries
            if rate.get('toTerritoryLevel') != 'wilaya':
                continue
            # Skip unsupported/unknown territories
            if rate.get('toTerritoryName') == 'Unknown':
                continue

            territory_id = str(rate.get('toTerritoryId', ''))
            wilaya = wilayas_by_zr_id.get(territory_id)
            if wilaya is None:
                skipped += 1
                continue

            updated_fields = []
            home_price = None
            desk_price = None
            for price_entry in rate.get('deliveryPrices', []):
                raw_price = price_entry.get('discountedPrice') or price_entry.get('price', 0)
                delivery_type = price_entry.get('deliveryType')

                if delivery_type == 'home':
                    wilaya.shipping_price_home_da = raw_price
                    updated_fields.append('shipping_price_home_da')
                    home_price = raw_price
                elif delivery_type == 'pickup-point':
                    wilaya.shipping_price_desk_da = raw_price
                    updated_fields.append('shipping_price_desk_da')
                    desk_price = raw_price

            # shipping_price_da = home price, falling back to desk price
            fallback = home_price if home_price is not None else desk_price
            if fallback is not None:
                wilaya.shipping_price_da = fallback
                updated_fields.append('shipping_price_da')

            if updated_fields:
                wilaya.save(update_fields=updated_fields)
                synced += 1

        self.stdout.write(self.style.SUCCESS(f'Wilayas updated: {synced}  (no match: {skipped})'))
        self.stdout.write(self.style.SUCCESS('sync_zr_rates complete.'))
