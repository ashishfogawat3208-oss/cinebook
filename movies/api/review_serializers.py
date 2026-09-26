from django.utils import timezone
from rest_framework import serializers

from bookings.models import Booking
from movies.review_models import MovieReview


class MovieReviewSerializer(
    serializers.ModelSerializer
):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    is_verified_viewer = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = MovieReview

        fields = [
            "id",
            "movie",
            "user",
            "username",
            "rating",
            "review_text",
            "is_verified_viewer",
            "is_reported",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "movie",
            "user",
            "username",
            "is_verified_viewer",
            "is_reported",
            "created_at",
            "updated_at",
        ]

    def get_is_verified_viewer(
        self,
        obj,
    ):
        if hasattr(
            obj,
            "verified_viewer",
        ):
            return bool(
                obj.verified_viewer
            )

        return obj.is_verified_viewer

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value


class CreateMovieReviewSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = MovieReview

        fields = [
            "rating",
            "review_text",
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "Rating must be between 1 and 5."
            )

        return value

    def validate(self, attrs):
        request = self.context["request"]
        movie = self.context["movie"]

        has_watched = Booking.objects.filter(
            user=request.user,
            show__movie=movie,
            status=Booking.STATUS_CONFIRMED,
            show__end_time__lt=timezone.now(),
        ).exists()

        if not has_watched:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "You can review this movie only "
                        "after booking and watching it."
                    )
                }
            )

        if MovieReview.objects.filter(
            movie=movie,
            user=request.user,
        ).exists():
            raise serializers.ValidationError(
                {
                    "detail": (
                        "You have already reviewed this movie."
                    )
                }
            )

        return attrs


class ReportMovieReviewSerializer(
    serializers.Serializer
):
    reason = serializers.CharField(
        max_length=500,
        required=True,
    )