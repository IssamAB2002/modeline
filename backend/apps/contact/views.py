from rest_framework.generics import CreateAPIView, ListAPIView

from .models import ContactMessage, Faq, Showroom
from .serializers import ContactMessageSerializer, FaqSerializer, ShowroomSerializer


class ShowroomListView(ListAPIView):
    serializer_class = ShowroomSerializer
    queryset = Showroom.objects.filter(is_active=True)


class FaqListView(ListAPIView):
    serializer_class = FaqSerializer
    queryset = Faq.objects.filter(is_active=True)


class ContactMessageCreateView(CreateAPIView):
    serializer_class = ContactMessageSerializer
