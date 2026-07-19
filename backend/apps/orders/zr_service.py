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
ZR_CUSTOMERS_URL = "https://api.zrexpress.app/api/v1/customers/individual"


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


def _check_delivery_refs(order) -> bool:
    """Validate the delivery refs needed for both the customer and parcel payloads.

    Returns True if the order is a home delivery, False for pickup-point.
    """
    if not order.wilaya_ref or not order.wilaya_ref.zr_territory_id:
        raise ZRServiceError(
            f"الطلب {order.order_number}: الولاية لا تحتوي على معرّف ZR — شغّل أمر sync_zr_territories أولاً"
        )

    is_home = order.shipping_type == "home"

    if is_home and (not order.baladia_ref or not order.baladia_ref.zr_territory_id):
        raise ZRServiceError(
            f"الطلب {order.order_number}: التوصيل للبيت يتطلب بلدية بمعرّف ZR — شغّل أمر sync_zr_territories أولاً"
        )

    if not is_home and not order.hub_ref:
        raise ZRServiceError(
            f"الطلب {order.order_number}: التوصيل لمكتب يتطلب اختيار مكتب — لا يوجد hub_ref لهذا الطلب"
        )

    return is_home


def _zr_request(url: str, method: str, secret_key: str, tenant_id: str, body: dict | None = None):
    """Issue an authenticated request to the ZR API and return the parsed JSON body (or None)."""
    headers = {
        "X-Api-Key": secret_key,
        "X-Tenant": tenant_id,
        "Accept": "application/json",
    }
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Authorization"] = f"Bearer {secret_key}"
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, method=method, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return json.loads(raw.decode("utf-8")) if raw else None
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise ZRServiceError(f"خطأ ZR HTTP {exc.code}: {error_body[:300]}") from exc
    except urllib.error.URLError as exc:
        raise ZRServiceError(
            "تعذر الاتصال بخوادم ZR Express — يبدو أنها تعاني من ضغط زائد حالياً. "
            f"يُرجى إعادة المحاولة بعد قليل. (تفاصيل: {exc.reason})"
        ) from exc


def _build_customer_payload(order) -> dict:
    """Build the ZR Express customer payload from an Order instance."""
    is_home = _check_delivery_refs(order)

    address = {
        "city": order.wilaya_ref.name_fr,
        "cityTerritoryId": str(order.wilaya_ref.zr_territory_id),
        "country": "algeria",
        "isPrimary": True,
    }
    if is_home:
        address["street"] = order.address_line
        address["district"] = order.baladia_ref.name_fr
        address["districtTerritoryId"] = str(order.baladia_ref.zr_territory_id)
    else:
        hub = order.hub_ref
        address["district"] = hub.district or hub.name
        if hub.street:
            address["street"] = hub.street

    return {
        "name": order.full_name,
        "phone": {"number1": _format_phone(order.phone)},
        "timeSlot": "morning",
        "instruction": "",
        "deliveryPreference": "home" if is_home else "pickup-point",
        "addresses": [address],
    }


def _get_or_create_customer_id(order, secret_key: str, tenant_id: str) -> str:
    """Return a ZR customerId for this order's phone, creating one in ZR if needed."""
    if order.zr_customer_id:
        return str(order.zr_customer_id)

    from .models import Order  # local import to avoid a module-level circular import

    sibling = (
        Order.objects.filter(phone=order.phone, zr_customer_id__isnull=False)
        .exclude(pk=order.pk)
        .order_by("-created_at")
        .first()
    )
    if sibling:
        order.zr_customer_id = sibling.zr_customer_id
        order.save(update_fields=["zr_customer_id"])
        return str(order.zr_customer_id)

    payload = _build_customer_payload(order)
    response_data = _zr_request(ZR_CUSTOMERS_URL, "POST", secret_key, tenant_id, body=payload)

    customer_id = response_data.get("id") if response_data else None
    if not customer_id:
        raise ZRServiceError(
            f"استجابة ZR لا تحتوي على معرّف عميل 'id': {str(response_data)[:200]}"
        )

    order.zr_customer_id = customer_id
    order.save(update_fields=["zr_customer_id"])
    return str(customer_id)


def _build_payload(order, customer_id: str) -> dict:
    """Build the ZR Express parcel payload from an Order instance."""
    is_home = _check_delivery_refs(order)

    delivery_address = {
        "cityTerritoryId": str(order.wilaya_ref.zr_territory_id),
        "city": order.wilaya_ref.name_fr,
    }
    if is_home:
        delivery_address["districtTerritoryId"] = str(order.baladia_ref.zr_territory_id)
        delivery_address["district"] = order.baladia_ref.name_fr
        if order.address_line:
            delivery_address["street"] = order.address_line
    else:
        delivery_address["hubId"] = str(order.hub_ref.zr_hub_id)
        delivery_address["hubName"] = order.hub_ref.name

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

    payload = {
        "customer": {
            "customerId": customer_id,
            "name": order.full_name,
            "phone": {"number1": _format_phone(order.phone)},
        },
        "deliveryAddress": delivery_address,
        "deliveryType": "home" if is_home else "pickup-point",
        "amount": int(order.grand_total_da),
        "description": description[:500],
        "orderedProducts": ordered_products,
    }

    if not is_home:
        hub = order.hub_ref
        payload["hubId"] = str(hub.zr_hub_id)
        stopdesk_address = ", ".join(filter(None, [hub.street, hub.wilaya.name_fr]))
        payload["pickupPoint"] = {
            "stopdesk_id": str(hub.zr_hub_id),
            "stopdesk_name": hub.name,
            "stopdesk_cityTerritoryId": str(hub.wilaya.zr_territory_id),
            "stopdesk_address": stopdesk_address,
            "stopdesk_phone": hub.phone,
        }

    return payload


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

    customer_id = _get_or_create_customer_id(order, secret_key, tenant_id)
    payload = _build_payload(order, customer_id)
    response_data = _zr_request(ZR_PARCELS_URL, "POST", secret_key, tenant_id, body=payload)

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
    order.save(update_fields=["zr_submitted", "zr_parcel_id", "zr_tracking_number", "zr_posted_at"])

    return response_data


def delete_parcel(order) -> None:
    """
    Delete an Order's parcel from ZR Express (e.g. to fix a mistaken submission).
    Clears zr_submitted / zr_parcel_id / zr_tracking_number / zr_posted_at on success
    so the order can be corrected and resubmitted.
    Raises ZRServiceError on any failure.
    """
    secret_key = settings.ZR_SECRET_KEY
    tenant_id = settings.ZR_TENANT_ID

    if not secret_key or not tenant_id:
        raise ZRServiceError(
            "ZR_SECRET_KEY و ZR_TENANT_ID غير مضبوطَين في ملف .env"
        )

    if not order.zr_parcel_id:
        raise ZRServiceError(
            f"الطلب {order.order_number} غير مرسَل لـ ZR — لا يوجد معرّف طرد لحذفه"
        )

    _zr_request(f"{ZR_PARCELS_URL}/{order.zr_parcel_id}", "DELETE", secret_key, tenant_id)

    order.zr_submitted = False
    order.zr_parcel_id = None
    order.zr_tracking_number = ""
    order.zr_posted_at = None
    order.save(update_fields=["zr_submitted", "zr_parcel_id", "zr_tracking_number", "zr_posted_at"])
