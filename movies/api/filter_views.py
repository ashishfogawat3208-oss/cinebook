from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from movies.models import Genre, Language
from movies.api.filter_serializers import (
    GenreFilterSerializer,
    LanguageFilterSerializer,
)


class GenreListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GenreFilterSerializer

    def get_queryset(self):
        return Genre.objects.all().order_by("name")


class LanguageListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LanguageFilterSerializer

    def get_queryset(self):
        return Language.objects.all().order_by("name")