from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
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
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
