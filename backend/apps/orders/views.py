from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart

from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderCreateView(APIView):
    """
    POST /api/orders/
    Creates an Order from an active cart.  Snapshots all line items,
    computes totals, and marks the source cart as converted.
    """

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            cart = Cart.objects.prefetch_related("items__product").get(
                pk=data["cart_id"], status=Cart.Status.ACTIVE
            )
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Active cart not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cart_items = list(cart.items.all())
        if not cart_items:
            return Response(
                {"detail": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subtotal = sum(item.line_total for item in cart_items)
        shipping = data.get("shipping_da", 0)
        grand_total = subtotal + shipping

        order = Order.objects.create(
            cart=cart,
            subtotal_da=subtotal,
            shipping_da=shipping,
            grand_total_da=grand_total,
            shipping_type=data.get("shipping_type", Order.ShippingType.HOME),
            full_name=data["full_name"],
            phone=data["phone"],
            city=data.get("city", ""),
            address_line=data.get("address_line", ""),
            notes=data.get("notes", ""),
        )

        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                product=item.product,
                quantity=item.quantity,
                unit_price_da_snapshot=item.unit_price_da_snapshot,
                sku_snapshot=item.sku_snapshot,
                product_name_snapshot_ar=item.product_name_snapshot_ar,
                selected_size_snapshot=item.selected_size or "",
                selected_color_snapshot=item.selected_color or "",
            )
            for item in cart_items
        ])

        cart.status = Cart.Status.CONVERTED
        cart.save(update_fields=["status"])

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(RetrieveAPIView):
    """GET /api/orders/<order_number>/ → return order with all items."""

    serializer_class = OrderSerializer
    queryset = Order.objects.prefetch_related("items__product")
    lookup_field = "order_number"
