from django.urls import path

from .views import ContactMessageCreateView, FaqListView, ShowroomListView

urlpatterns = [
    path("showrooms/", ShowroomListView.as_view(), name="showrooms-list"),
    path("faqs/", FaqListView.as_view(), name="faqs-list"),
    path("messages/", ContactMessageCreateView.as_view(), name="contact-messages-create"),
]
