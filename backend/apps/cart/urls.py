from django.urls import path

from .views import (
    CartCreateView,
    CartDetailView,
    CartItemAddView,
    CartItemDestroyView,
    CartItemUpdateView,
)

urlpatterns = [
    path("", CartCreateView.as_view(), name="cart-create"),
    path("<int:pk>/", CartDetailView.as_view(), name="cart-detail"),
    path("<int:cart_id>/items/", CartItemAddView.as_view(), name="cart-item-add"),
    path("items/<int:pk>/", CartItemUpdateView.as_view(), name="cart-item-update"),
    path("items/<int:pk>/delete/", CartItemDestroyView.as_view(), name="cart-item-delete"),
]
