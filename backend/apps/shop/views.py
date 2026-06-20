from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination

from .models import Category, Product, ProductReview, Wilaya
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductReviewSerializer,
    WilayaSerializer,
)


class ProductPagePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 48


class CategoryListView(ListAPIView):
    """GET /api/shop/categories/ — list all active categories."""

    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)


class ProductListView(ListAPIView):
    """GET /api/shop/products/ — list active products with optional filters.

    Query params:
      ?category=<slug>   — filter by category
      ?featured=true     — only featured products
      ?page=N            — paginated results (12 per page)
      ?page_size=N       — override page size (max 48)
    """

    serializer_class = ProductListSerializer
    pagination_class = ProductPagePagination

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category")
        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        if self.request.query_params.get("featured", "").lower() == "true":
            qs = qs.filter(is_featured=True)
        if self.request.query_params.get("is_new", "").lower() == "true":
            qs = qs.filter(is_new=True)
        return qs


class ProductDetailView(RetrieveAPIView):
    """GET /api/shop/products/<id>/ — single product with full detail."""

    serializer_class = ProductDetailSerializer
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")


class WilayaListView(ListAPIView):
    """GET /api/shop/wilayas/ — list all active wilayas with shipping prices."""

    serializer_class = WilayaSerializer
    queryset = Wilaya.objects.filter(is_active=True)


class ProductReviewListCreateView(generics.ListCreateAPIView):
    """GET  /api/shop/products/<pk>/reviews/ — approved reviews for a product.
    POST /api/shop/products/<pk>/reviews/ — submit a new review (pending approval).
    """

    serializer_class = ProductReviewSerializer

    def get_queryset(self):
        return ProductReview.objects.filter(
            product_id=self.kwargs["product_pk"],
            is_approved=True,
        )

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs["product_pk"])
        serializer.save(product=product, is_approved=False)
