from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import ContactInfo, FrontSettings, TrustStrip
from .serializers import ContactInfoSerializer, FrontSettingsSerializer, TrustStripSerializer


class FrontSettingsView(RetrieveAPIView):
    serializer_class = FrontSettingsSerializer

    def get_object(self):
        return FrontSettings.load()


class TrustStripListView(ListAPIView):
    serializer_class = TrustStripSerializer
    queryset = TrustStrip.objects.filter(is_active=True)


class ContactInfoView(RetrieveAPIView):
    serializer_class = ContactInfoSerializer

    def get_object(self):
        return ContactInfo.load()
