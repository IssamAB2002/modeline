from django.urls import path

from .views import (
    BaladiaListView,
    CategoryListView,
    OGProductView,
    ProductDetailView,
    ProductListView,
    ProductReviewListCreateView,
    WilayaListView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("products/<int:product_pk>/reviews/", ProductReviewListCreateView.as_view(), name="product-reviews"),
    path("og/<int:pk>/", OGProductView.as_view(), name="product-og"),
    path("wilayas/", WilayaListView.as_view(), name="wilaya-list"),
    path("baladias/", BaladiaListView.as_view(), name="baladia-list"),
]
