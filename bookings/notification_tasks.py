from celery import chain

from bookings.email_tasks import (
    send_ticket_email_task,
)

from bookings.tasks import (
    generate_ticket_task,
)


def queue_ticket_workflow(
    booking_id,
):
    """
    Queue ticket generation first and email delivery
    second.

    The email task receives the ticket-generation result
    automatically through the Celery chain.
    """

    workflow = chain(
        generate_ticket_task.s(
            str(booking_id)
        ),
        send_ticket_email_task.s(
            str(booking_id)
        ),
    )

    return workflow.apply_async()