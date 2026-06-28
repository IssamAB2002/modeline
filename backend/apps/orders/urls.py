from django.urls import path

from .views import OrderCreateView, OrderDetailView, ThanksMessageView

urlpatterns = [
    path("", OrderCreateView.as_view(), name="order-create"),
    path("thanks-message/", ThanksMessageView.as_view(), name="thanks-message"),
    path("<str:order_number>/", OrderDetailView.as_view(), name="order-detail"),
]
