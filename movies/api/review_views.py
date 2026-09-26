from django.db.models import Avg, Exists, OuterRef
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from bookings.models import Booking
from movies.models import Movie
from movies.review_models import MovieReview

from movies.api.review_serializers import (
    CreateMovieReviewSerializer,
    MovieReviewSerializer,
    ReportMovieReviewSerializer,
)


def refresh_movie_rating(movie):
    average = (
        MovieReview.objects
        .filter(
            movie=movie,
            is_hidden=False,
        )
        .aggregate(
            average=Avg("rating")
        )
        .get("average")
    )

    movie.rating = (
        round(float(average), 1)
        if average is not None
        else 0.0
    )

    movie.save(
        update_fields=[
            "rating",
            "updated_at",
        ]
    )


class MovieReviewListCreateView(
    generics.ListCreateAPIView
):
    permission_classes = [IsAuthenticated]

    def get_movie(self):
        return get_object_or_404(
            Movie,
            id=self.kwargs["movie_id"],
            is_active=True,
        )

    def get_queryset(self):
        movie = self.get_movie()

        now = timezone.now()

        verified_viewer_query = Booking.objects.filter(
            user=OuterRef("user"),
            show__movie=movie,
            status=Booking.STATUS_CONFIRMED,
            show__end_time__lt=now,
        )

        return (
            MovieReview.objects
            .filter(
                movie=movie,
                is_hidden=False,
            )
            .select_related("user")
            .annotate(
                verified_viewer=Exists(
                    verified_viewer_query
                )
            )
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateMovieReviewSerializer

        return MovieReviewSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()

        context["movie"] = self.get_movie()

        return context

    def perform_create(self, serializer):
        movie = self.get_movie()

        review = serializer.save(
            movie=movie,
            user=self.request.user,
        )

        refresh_movie_rating(movie)


class MovieReviewUpdateDeleteView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [IsAuthenticated]

    serializer_class = MovieReviewSerializer

    lookup_url_kwarg = "review_id"

    def get_queryset(self):
        return (
            MovieReview.objects
            .filter(
                user=self.request.user
            )
            .select_related(
                "user",
                "movie",
            )
        )

    def perform_update(self, serializer):
        review = serializer.save()

        refresh_movie_rating(
            review.movie
        )

    def perform_destroy(self, instance):
        movie = instance.movie

        instance.delete()

        refresh_movie_rating(movie)


class ReportMovieReviewView(
    generics.GenericAPIView
):
    permission_classes = [IsAuthenticated]

    serializer_class = (
        ReportMovieReviewSerializer
    )

    def post(
        self,
        request,
        review_id,
    ):
        review = get_object_or_404(
            MovieReview,
            id=review_id,
            is_hidden=False,
        )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        review.is_reported = True

        review.report_reason = (
            serializer.validated_data["reason"]
        )

        review.save(
            update_fields=[
                "is_reported",
                "report_reason",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": (
                    "Review reported successfully."
                )
            },
            status=status.HTTP_200_OK,
        )