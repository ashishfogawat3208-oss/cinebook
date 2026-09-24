from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[
            validate_password
        ],
    )

    password_confirm = serializers.CharField(
        write_only=True,
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
        ]

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, attrs):
        if (
            attrs["password"]
            != attrs["password_confirm"]
        ):
            raise serializers.ValidationError(
                {
                    "password_confirm": (
                        "Passwords do not match."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop(
            "password_confirm"
        )

        password = validated_data.pop(
            "password"
        )

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        return user


class UserProfileSerializer(
    serializers.ModelSerializer
):
    booking_count = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "booking_count",
        ]

        read_only_fields = [
            "id",
            "username",
            "date_joined",
            "booking_count",
        ]


class UserProfileUpdateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = User

        fields = [
            "first_name",
            "last_name",
            "email",
        ]

    def validate_email(self, value):
        value = value.strip().lower()

        queryset = User.objects.filter(
            email__iexact=value
        ).exclude(
            pk=self.instance.pk
        )

        if queryset.exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value