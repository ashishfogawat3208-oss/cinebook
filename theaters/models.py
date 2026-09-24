from django.db import models


class City(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Theater(models.Model):
    name = models.CharField(
        max_length=255,
        db_index=True,
    )

    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name="theaters",
    )

    address = models.TextField()

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.name} - {self.city.name}"


class Screen(models.Model):
    theater = models.ForeignKey(
        Theater,
        on_delete=models.CASCADE,
        related_name="screens",
    )

    name = models.CharField(
        max_length=100,
    )

    total_seats = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["theater", "name"],
                name="unique_screen_per_theater",
            )
        ]

    def __str__(self):
        return f"{self.theater.name} - {self.name}"

class Show(models.Model):
    movie = models.ForeignKey(
        "movies.Movie",
        on_delete=models.CASCADE,
        related_name="shows",
    )

    screen = models.ForeignKey(
        Screen,
        on_delete=models.CASCADE,
        related_name="shows",
    )

    start_time = models.DateTimeField(
        db_index=True,
    )

    end_time = models.DateTimeField()

    ticket_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        db_index=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["start_time"]

        indexes = [
            models.Index(
                fields=["movie", "start_time"],
            ),
            models.Index(
                fields=["screen", "start_time"],
            ),
            models.Index(
                fields=["ticket_price"],
            ),
        ]

    def __str__(self):
        return f"{self.movie.title} - {self.screen.name} - {self.start_time}"

class Seat(models.Model):
    SEAT_TYPES = [
        ("REGULAR", "Regular"),
        ("PREMIUM", "Premium"),
        ("RECLINER", "Recliner"),
    ]

    screen = models.ForeignKey(
        Screen,
        on_delete=models.CASCADE,
        related_name="seats",
    )

    row = models.CharField(
        max_length=5,
    )

    number = models.PositiveIntegerField()

    seat_type = models.CharField(
        max_length=20,
        choices=SEAT_TYPES,
        default="REGULAR",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["screen", "row", "number"],
                name="unique_seat_per_screen",
            )
        ]

        ordering = ["row", "number"]

    def __str__(self):
        return f"{self.row}{self.number}"