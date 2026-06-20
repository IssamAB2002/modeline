from django.urls import path

from .views import ContactInfoView, FrontSettingsView, TrustStripListView

urlpatterns = [
    path("front-settings/", FrontSettingsView.as_view(), name="front-settings"),
    path("trust-strips/", TrustStripListView.as_view(), name="trust-strips"),
    path("contact-info/", ContactInfoView.as_view(), name="contact-info"),
]
