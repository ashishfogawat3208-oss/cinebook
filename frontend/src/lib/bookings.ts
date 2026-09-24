import api from "@/lib/api";

import type {
  Booking,
  PaginatedResponse,
  ShowSeat,
  Ticket,
  TicketVerification,
} from "@/lib/types";

export interface ShowSeatsResponse {
  show_id: number;
  movie_id: number;
  start_time: string;
  ticket_price: number;
  seats: ShowSeat[];
}

export interface CreateBookingPayload {
  show_id: number;
  show_seat_ids: number[];
}

export interface MockPaymentResponse {
  booking_id: string;
  payment_reference: string;
  payment_status: string;
  booking_status: string;
  amount: string;
}

export async function getShowSeats(
  showId: number
): Promise<ShowSeatsResponse> {
  const response =
    await api.get<ShowSeatsResponse>(
      `/bookings/shows/${showId}/seats/`
    );

  return response.data;
}

export async function createBooking(
  payload: CreateBookingPayload
): Promise<Booking> {
  const response =
    await api.post<Booking>(
      "/bookings/create/",
      payload
    );

  return response.data;
}

export async function getBooking(
  bookingId: string
): Promise<Booking> {
  const response =
    await api.get<Booking>(
      `/bookings/${bookingId}/`
    );

  return response.data;
}

export async function getBookings(
  category?: string
): Promise<Booking[]> {
  const response = await api.get<
    Booking[] | PaginatedResponse<Booking>
  >("/bookings/", {
    params: category
      ? { category }
      : undefined,
  });

  const data = response.data;

  // Django/DRF may return a paginated response:
  // { count, next, previous, results: [...] }
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "results" in data &&
    Array.isArray(data.results)
  ) {
    return data.results;
  }

  // Or it may return a plain array.
  if (Array.isArray(data)) {
    return data;
  }

  // Never allow the UI to receive undefined.
  return [];
}

export async function makeMockPayment(
  bookingId: string,
  success = true
): Promise<MockPaymentResponse> {
  const response =
    await api.post<MockPaymentResponse>(
      "/bookings/payment/mock/",
      {
        booking_id: bookingId,
        success,
      }
    );

  return response.data;
}

export async function getTicket(
  bookingId: string
): Promise<Ticket> {
  const response =
    await api.get<Ticket>(
      `/bookings/tickets/${bookingId}/`
    );

  return response.data;
}

export async function verifyTicket(
  verificationCode: string
): Promise<TicketVerification> {
  const response =
    await api.get<TicketVerification>(
      `/bookings/tickets/verify/${verificationCode}/`
    );

  return response.data;
}