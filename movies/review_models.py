from django.conf import settings
from django.db import models


class CastMember(models.Model):
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=200, blank=True)
    photo = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        if self.role:
            return f"{self.name} - {self.role}"
        return self.name


class MovieCast(models.Model):
    movie = models.ForeignKey(
        "movies.Movie",
        on_delete=models.CASCADE,
        related_name="cast_members",
    )

    cast_member = models.ForeignKey(
        CastMember,
        on_delete=models.CASCADE,
        related_name="movie_roles",
    )

    character_name = models.CharField(
        max_length=200,
        blank=True,
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        ordering = ["display_order", "id"]

        constraints = [
            models.UniqueConstraint(
                fields=["movie", "cast_member"],
                name="unique_movie_cast_member",
            )
        ]

    def __str__(self):
        return (
            f"{self.movie.title} - "
            f"{self.cast_member.name}"
        )


class MoviePoster(models.Model):
    movie = models.ForeignKey(
        "movies.Movie",
        on_delete=models.CASCADE,
        related_name="posters",
    )

    image = models.URLField()

    display_order = models.PositiveIntegerField(
        default=0,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return (
            f"{self.movie.title} "
            f"poster #{self.id}"
        )


class MovieReview(models.Model):
    movie = models.ForeignKey(
        "movies.Movie",
        on_delete=models.CASCADE,
        related_name="reviews",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="movie_reviews",
    )

    rating = models.PositiveSmallIntegerField()

    review_text = models.TextField(
        blank=True,
    )

    is_reported = models.BooleanField(
        default=False,
    )

    report_reason = models.CharField(
        max_length=500,
        blank=True,
    )

    is_hidden = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["movie", "user"],
                name="unique_movie_review_per_user",
            )
        ]

        indexes = [
            models.Index(
                fields=["movie", "-created_at"]
            ),
            models.Index(
                fields=["movie", "is_reported"]
            ),
        ]

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.movie.title} - "
            f"{self.rating}/5"
        )

    @property
    def is_verified_viewer(self):
        """
        Fallback property.

        The review serializer will use an optimized
        prefetched/annotated value when available.
        """
        if hasattr(
            self,
            "_verified_viewer",
        ):
            return self._verified_viewer

        from django.utils import timezone
        from bookings.models import Booking

        return Booking.objects.filter(
            user=self.user,
            show__movie=self.movie,
            status=Booking.STATUS_CONFIRMED,
            show__end_time__lt=timezone.now(),
        ).exists()