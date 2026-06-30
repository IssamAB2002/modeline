from pathlib import Path

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.views.static import serve

from apps.shop.views import ProductSSRView


def get_csrf_token(request):
    return JsonResponse({"detail": get_token(request)})


urlpatterns = [
    path("admin/", admin.site.urls),
    # Product pages — Django renders static frontend shell with OG meta tags + embedded JSON
    path("product/<int:pk>/", ProductSSRView.as_view(), name="product_ssr"),
    # Home: front-settings + trust-strips
    path("api/home/", include("apps.home.urls")),
    # About: principles + reviews
    path("api/about/", include("apps.about.urls")),
    # Contact: showrooms + faqs + messages
    path("api/contact/", include("apps.contact.urls")),
    # Shop: product list + detail
    path("api/shop/", include("apps.shop.urls")),
    # Cart: cart CRUD + cart-items
    path("api/cart/", include("apps.cart.urls")),
    # Orders: create + retrieve by order_number
    path("api/orders/", include("apps.orders.urls")),
    path("api/csrf/", get_csrf_token),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve the static-frontend app (css/js/assets + page .html files) so the
    # product SSR page and its nav links (shop/cart/about/contact) work locally
    # without a separate proxy. Caddy's try_files handles this in production.
    _sf_root = Path(settings.BASE_DIR).parent / 'static-frontend'
    urlpatterns += [
        path('', serve, {'document_root': _sf_root, 'path': 'index.html'}),
        re_path(r'^(?P<path>(?:css|js|assets)/.*|[\w-]+\.html|image\.png)$', serve, {'document_root': _sf_root}),
    ]
