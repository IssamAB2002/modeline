from rest_framework import status
from rest_framework.generics import DestroyAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.models import Product

from .models import Cart, CartItem
from .serializers import CartItemAddSerializer, CartItemSerializer, CartSerializer


class CartCreateView(APIView):
    """POST /api/cart/ → create a new active cart and return it with its id."""

    def post(self, request):
        session_key = request.data.get("session_key") or None
        cart = Cart.objects.create(session_key=session_key)
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)


class CartDetailView(RetrieveAPIView):
    """GET /api/cart/<id>/ → return cart with all items."""

    serializer_class = CartSerializer
    queryset = Cart.objects.prefetch_related("items__product")


class CartItemAddView(APIView):
    """
    POST /api/cart/<cart_id>/items/
    Add a product to the cart.  If an identical line (product + size + color)
    already exists the quantity is incremented instead of creating a duplicate.
    """

    def post(self, request, cart_id):
        try:
            cart = Cart.objects.get(pk=cart_id, status=Cart.Status.ACTIVE)
        except Cart.DoesNotExist:
            return Response({"detail": "Cart not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CartItemAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            product = Product.objects.get(pk=data["product_id"])
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        size = data.get("selected_size") or None
        color = data.get("selected_color") or None

        existing = CartItem.objects.filter(
            cart=cart,
            product=product,
            selected_size=size,
            selected_color=color,
        ).first()

        if existing:
            existing.quantity += data["quantity"]
            existing.save(update_fields=["quantity"])
            return Response(CartItemSerializer(existing).data, status=status.HTTP_200_OK)

        item = CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=data["quantity"],
            selected_size=size,
            selected_color=color,
            unit_price_da_snapshot=product.price,
            product_name_snapshot_ar=product.name,
            product_name_snapshot_en=product.name,
            sku_snapshot=product.sku,
        )
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


class CartItemUpdateView(UpdateAPIView):
    """PATCH /api/cart/items/<item_id>/ → update quantity."""

    serializer_class = CartItemSerializer
    queryset = CartItem.objects.all()
    http_method_names = ["patch"]

    def get_serializer(self, *args, **kwargs):
        kwargs.setdefault("partial", True)
        return super().get_serializer(*args, **kwargs)


class CartItemDestroyView(DestroyAPIView):
    """DELETE /api/cart/items/<item_id>/ → remove item from cart."""

    queryset = CartItem.objects.all()
