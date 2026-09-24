import os

from celery import Celery


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)


app = Celery(
    "movie_booking_system"
)


app.config_from_object(
    "django.conf:settings",
    namespace="CELERY",
)


app.autodiscover_tasks()


# Celery/Redis reliability settings.
app.conf.update(
    broker_connection_retry_on_startup=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)


# Periodic tasks.
app.conf.beat_schedule = {
    "expire-pending-bookings-every-minute": {
        "task": "bookings.tasks.expire_pending_bookings",
        "schedule": 60.0,
    },
}