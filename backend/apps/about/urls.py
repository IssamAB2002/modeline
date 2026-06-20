from django.urls import path

from .views import PrincipleListView, ReviewCreateView, ReviewListView

urlpatterns = [
    path("principles/", PrincipleListView.as_view(), name="principles-list"),
    path("reviews/", ReviewListView.as_view(), name="reviews-list"),
    path("reviews/submit/", ReviewCreateView.as_view(), name="reviews-create"),
]
