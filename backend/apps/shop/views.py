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

_BOT_RE = re.compile(
    r"facebookexternalhit|Facebot|WhatsApp|TelegramBot|Twitterbot|LinkedInBot|Slackbot|ia_archiver",
    re.IGNORECASE,
)

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
    """
    Serves /product/<pk>/ for both bots and humans.

    Bots (Facebook, WhatsApp, etc.) receive a minimal HTML page with full
    OG/Twitter meta tags so crawlers pick up the product image and title.

    Human browsers receive the React SPA shell (frontend/dist/index.html)
    so client-side routing takes over normally — no redirect loop, no flash.
    """

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk, is_active=True)

        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        canonical_url = f"{frontend_url}/product/{product.pk}"

        if product.image:
            og_image = f"{frontend_url}{product.image.url}"
        elif product.image_url:
            og_image = product.image_url
        else:
            og_image = ""

        ua = request.META.get("HTTP_USER_AGENT", "")
        if _BOT_RE.search(ua):
            html = render_to_string("shop/og_product.html", {
                "product": product,
                "og_image": og_image,
                "og_url": canonical_url,
            })
            return HttpResponse(html, content_type="text/html; charset=utf-8")

        # Human visitor — serve the built React shell so SPA routing works.
        spa_path = getattr(settings, "FRONTEND_INDEX_PATH", "")
        if spa_path:
            try:
                html = Path(spa_path).read_text(encoding="utf-8")
                return HttpResponse(html, content_type="text/html; charset=utf-8")
            except OSError:
                pass

        # Fallback (dev / misconfigured prod): send them to the homepage.
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(f"{frontend_url}/")
