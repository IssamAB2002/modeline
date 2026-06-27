import json
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.views import View
from rest_framework import generics
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination

_vite_assets_cache = None


def _get_vite_assets():
    """Return hashed JS/CSS entry filenames from the Vite build manifest."""
    global _vite_assets_cache
    if _vite_assets_cache is not None and not settings.DEBUG:
        return _vite_assets_cache
    manifest_path = getattr(settings, 'VITE_MANIFEST_PATH', '')
    try:
        manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
        entry = manifest.get('src/main.jsx', {})
        js_file = entry.get('file', '')
        css_files = entry.get('css', [])
        result = {'js': js_file, 'css': css_files[0] if css_files else ''}
    except (OSError, json.JSONDecodeError, KeyError, TypeError, IndexError):
        result = {'js': '', 'css': ''}
    if not settings.DEBUG:
        _vite_assets_cache = result
    return result

from .models import Baladia, Category, Product, ProductReview, Wilaya
from .serializers import (
    BaladiaSerializer,
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


class BaladiaListView(ListAPIView):
    """GET /api/shop/baladias/?wilaya_id=<id> — list baladias, optionally filtered by wilaya."""

    serializer_class = BaladiaSerializer

    def get_queryset(self):
        qs = Baladia.objects.filter(is_active=True)
        wilaya_id = self.request.query_params.get("wilaya_id")
        if wilaya_id:
            qs = qs.filter(wilaya_id=wilaya_id)
        return qs


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


class OGProductView(View):
    """Serves /product/<pk>/ with full SSR HTML for every visitor — bots and humans alike.

    Every response includes correct OG/Twitter meta tags and server-rendered product
    content, plus the React bundle which mounts and takes over for interactive use.
    No bot detection needed.
    """

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk, is_active=True)

        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        canonical_url = f"{frontend_url}/product/{product.pk}"

        if product.image:
            og_image = request.build_absolute_uri(product.image.url)
        elif product.image_url:
            og_image = product.image_url
        else:
            og_image = ""

        serializer = ProductDetailSerializer(product, context={"request": request})
        assets = _get_vite_assets()

        html = render_to_string("shop/og_product.html", {
            "product": product,
            "og_image": og_image,
            "og_url": canonical_url,
            "product_data": serializer.data,
            "js_file": assets["js"],
            "css_file": assets["css"],
        })
        return HttpResponse(html, content_type="text/html; charset=utf-8")
