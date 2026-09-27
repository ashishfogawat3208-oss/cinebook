from bookings.tasks import generate_ticket_task


def queue_ticket_workflow(booking_id):
    """
    Queue ticket generation and email delivery.

    The current generate_ticket_task handles both:
    - PDF ticket generation
    - Email delivery
    """

    return generate_ticket_task.delay(str(booking_id))