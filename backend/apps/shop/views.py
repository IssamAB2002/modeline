import json
import re
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.views import View
from rest_framework import generics
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination

# (cached_mtime, cached_result) — invalidated when the manifest file changes on disk
_vite_assets_cache = (None, None)


def _get_vite_assets():
    """Return hashed JS/CSS entry filenames from the Vite build manifest.

    Falls back to parsing dist/index.html when the manifest doesn't exist
    (e.g. built without manifest:true or deployed before that option was added).
    Re-reads the manifest automatically after each frontend rebuild (mtime check).
    """
    global _vite_assets_cache
    manifest_path = getattr(settings, 'VITE_MANIFEST_PATH', '')
    result = {'js': '', 'css': ''}

    try:
        mtime = Path(manifest_path).stat().st_mtime
        if not settings.DEBUG and _vite_assets_cache[0] == mtime:
            return _vite_assets_cache[1]
    except OSError:
        mtime = None

    try:
        manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
        entry = manifest.get('src/main.jsx', {})
        js_file = entry.get('file', '')
        css_files = entry.get('css', [])
        result = {'js': js_file, 'css': css_files[0] if css_files else ''}
    except (OSError, json.JSONDecodeError, KeyError, TypeError, IndexError):
        pass

    # Fallback: parse dist/index.html for the hashed asset URLs.
    # The manifest lives at dist/.vite/manifest.json, so dist root is two levels up.
    if not result['js']:
        try:
            dist_root = Path(manifest_path).parent.parent
            html = (dist_root / 'index.html').read_text(encoding='utf-8')
            js_match = re.search(r'<script[^>]+src="(/assets/[^"]+\.js)"', html)
            css_match = re.search(r'<link[^>]+href="(/assets/[^"]+\.css)"', html)
            result = {
                'js': js_match.group(1).lstrip('/') if js_match else '',
                'css': css_match.group(1).lstrip('/') if css_match else '',
            }
        except (OSError, AttributeError):
            pass

    if not settings.DEBUG:
        _vite_assets_cache = (mtime, result)
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

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response['Cache-Control'] = 'public, max-age=300'
        return response


class ProductDetailView(RetrieveAPIView):
    """GET /api/shop/products/<id>/ — single product with full detail."""

    serializer_class = ProductDetailSerializer
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response['Cache-Control'] = 'public, max-age=300'
        return response


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
    """Serves /shop/og/<pk>/ — React SSR shell (kept for backward compatibility).

    Every response includes correct OG/Twitter meta tags and server-rendered product
    content, plus the React bundle which mounts and takes over for interactive use.
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
        response = HttpResponse(html, content_type="text/html; charset=utf-8")
        response['Cache-Control'] = 'public, max-age=300'
        return response


class ProductSSRView(View):
    """Serves /product/<pk>/ for the static frontend.

    Renders product_ssr.html with full OG meta tags and embedded JSON data
    (__pdp_data__) so product.js can hydrate without an extra API call.
    CSS/JS are served by Caddy from static-frontend/; in local dev Django
    can serve them if static-frontend/ is added to STATICFILES_DIRS.
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

        html = render_to_string("shop/product_ssr.html", {
            "product": product,
            "og_image": og_image,
            "og_url": canonical_url,
            "product_data": serializer.data,
        })
        response = HttpResponse(html, content_type="text/html; charset=utf-8")
        response['Cache-Control'] = 'public, max-age=60'
        return response
