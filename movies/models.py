from django.db import models


class Genre(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Language(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Movie(models.Model):
    title = models.CharField(
        max_length=255,
        db_index=True,
    )

    description = models.TextField(
        blank=True,
    )

    genres = models.ManyToManyField(
        Genre,
        related_name="movies",
        blank=True,
    )

    languages = models.ManyToManyField(
        Language,
        related_name="movies",
        blank=True,
    )

    release_date = models.DateField(
        db_index=True,
    )

    duration_minutes = models.PositiveIntegerField()

    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=0.0,
        db_index=True,
    )

    popularity = models.PositiveIntegerField(
        default=0,
        db_index=True,
    )

    poster = models.URLField(
        blank=True,
    )

    trailer_url = models.URLField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-popularity",
            "-release_date",
        ]

    def __str__(self):
        return self.title


class MovieView(models.Model):
    user = models.ForeignKey(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="movie_views",
    )

    movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        related_name="views",
    )

    viewed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-viewed_at"]

        indexes = [
            models.Index(
                fields=["user", "-viewed_at"],
            ),
            models.Index(
                fields=["user", "movie"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.user.username} "
            f"viewed {self.movie.title}"
        )