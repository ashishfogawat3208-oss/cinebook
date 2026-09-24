from django.contrib.auth.models import User
from django.db.models import Count

from rest_framework import generics
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework import status

from accounts.api.serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
)


class RegisterView(
    generics.CreateAPIView
):
    permission_classes = [
        AllowAny
    ]

    serializer_class = RegisterSerializer


class UserProfileView(
    generics.RetrieveAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = (
        UserProfileSerializer
    )

    def get_object(self):
        return (
            User.objects
            .annotate(
                booking_count=Count(
                    "bookings",
                    distinct=True,
                )
            )
            .get(
                pk=self.request.user.pk
            )
        )


class UserProfileUpdateView(
    generics.UpdateAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = (
        UserProfileUpdateSerializer
    )

    http_method_names = [
        "patch",
        "put",
    ]

    def get_object(self):
        return self.request.user

    def update(
        self,
        request,
        *args,
        **kwargs,
    ):
        partial = (
            request.method == "PATCH"
        )

        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )

        serializer.is_valid(
            raise_exception=True
        )

        self.perform_update(
            serializer
        )

        refreshed_user = (
            User.objects
            .annotate(
                booking_count=Count(
                    "bookings",
                    distinct=True,
                )
            )
            .get(
                pk=request.user.pk
            )
        )

        response_serializer = (
            UserProfileSerializer(
                refreshed_user
            )
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )