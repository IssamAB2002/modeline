from rest_framework.generics import CreateAPIView, ListAPIView

from .models import Principle, Review
from .serializers import PrincipleSerializer, ReviewSerializer


class PrincipleListView(ListAPIView):
    serializer_class = PrincipleSerializer
    queryset = Principle.objects.filter(is_active=True)


class ReviewListView(ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.filter(approved=True)
        limit = self.request.query_params.get("limit")
        if limit:
            try:
                qs = qs[:int(limit)]
            except (ValueError, TypeError):
                pass
        return qs


class ReviewCreateView(CreateAPIView):
    serializer_class = ReviewSerializer
