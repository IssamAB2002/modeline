"""
ZR Express parcel posting service.

Usage:
    from apps.orders.zr_service import post_parcel, ZRServiceError
    try:
        post_parcel(order)
    except ZRServiceError as e:
        ...
"""

import re
import urllib.request
import json
from datetime import datetime, timezone

from django.conf import settings


ZR_PARCELS_URL = "https://api.zrexpress.app/api/v1/parcels"


class ZRServiceError(Exception):
    pass


def _format_phone(raw: str) -> str:
    """Convert local Algerian phone to +213 international format."""
    digits = re.sub(r"\D", "", raw)
    if not re.match(r"^0[567]\d{8}$", digits):
        raise ZRServiceError(
            f"رقم الهاتف غير صالح: '{raw}' — يجب أن يبدأ بـ 05، 06، أو 07 ويتكون من 10 أرقام"
        )
    return "+213" + digits[1:]


def _build_payload(order) -> dict:
    """Build the ZR Express parcel payload from an Order instance."""
    if not order.wilaya_ref or not order.wilaya_ref.zr_territory_id:
        raise ZRServiceError(
            f"الطلب {order.order_number}: الولاية لا تحتوي على معرّف ZR — شغّل أمر sync_zr_territories أولاً"
        )

    is_home = order.shipping_type == "home"

    if is_home and (not order.baladia_ref or not order.baladia_ref.zr_territory_id):
        raise ZRServiceError(
            f"الطلب {order.order_number}: التوصيل للبيت يتطلب بلدية بمعرّف ZR — شغّل أمر sync_zr_territories أولاً"
        )

    delivery_address = {
        "cityTerritoryId": str(order.wilaya_ref.zr_territory_id),
        "city": order.wilaya_ref.name_fr,
    }
    if is_home:
        delivery_address["districtTerritoryId"] = str(order.baladia_ref.zr_territory_id)
        delivery_address["district"] = order.baladia_ref.name_fr
        if order.address_line:
            delivery_address["street"] = order.address_line

    ordered_products = [
        {
            "productName": item.product_name_snapshot_ar,
            "unitPrice": int(item.unit_price_da_snapshot),
            "quantity": item.quantity,
            "stockType": "none",
        }
        for item in order.items.all()
    ]

    description = order.notes or ", ".join(
        f"{item.quantity}× {item.product_name_snapshot_ar}" for item in order.items.all()
    )

    return {
        "customer": {
            "name": order.full_name,
            "phone": {"number1": _format_phone(order.phone)},
        },
        "deliveryAddress": delivery_address,
        "deliveryType": "home" if is_home else "pickup-point",
        "amount": int(order.grand_total_da),
        "description": description[:500],
        "orderedProducts": ordered_products,
    }


def post_parcel(order) -> dict:
    """
    Post a single Order as a parcel to ZR Express.
    Saves zr_parcel_id, zr_tracking_number, zr_posted_at on success.
    Raises ZRServiceError on any failure.
    """
    secret_key = settings.ZR_SECRET_KEY
    tenant_id = settings.ZR_TENANT_ID

    if not secret_key or not tenant_id:
        raise ZRServiceError(
            "ZR_SECRET_KEY و ZR_TENANT_ID غير مضبوطَين في ملف .env"
        )

    if order.zr_submitted or order.zr_parcel_id:
        raise ZRServiceError(
            f"الطلب {order.order_number} مرسَل مسبقاً (معرّف ZR: {order.zr_parcel_id})"
        )

    payload = _build_payload(order)
    body = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        ZR_PARCELS_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {secret_key}",
            "X-Api-Key": secret_key,
            "X-Tenant": tenant_id,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            response_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise ZRServiceError(
            f"خطأ ZR HTTP {exc.code}: {error_body[:300]}"
        ) from exc
    except urllib.error.URLError as exc:
        raise ZRServiceError(f"خطأ الاتصال بـ ZR: {exc.reason}") from exc

    parcel_id = response_data.get("id")
    tracking = response_data.get("trackingNumber", "")

    if not parcel_id:
        raise ZRServiceError(
            f"استجابة ZR لا تحتوي على 'id': {str(response_data)[:200]}"
        )

    order.zr_submitted = True
    order.zr_parcel_id = parcel_id
    order.zr_tracking_number = tracking or ""
    order.zr_posted_at = datetime.now(tz=timezone.utc)
    order.status = "processing"
    order.save(update_fields=["zr_submitted", "zr_parcel_id", "zr_tracking_number", "zr_posted_at", "status"])

    return response_data
