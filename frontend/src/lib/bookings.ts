import api from "./api";

import type {
  Booking,
  ShowSeat,
  Ticket,
} from "./types";


export interface ShowSeatsResponse {
  show_id: number;
  movie_id: number;
  start_time: string;
  ticket_price: number;
  seats: ShowSeat[];
}


export interface ReserveSeatsResponse {
  show_id: number;
  seats: ShowSeat[];
}


export interface CreateRazorpayOrderResponse {
  booking_id: string;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}


export interface VerifyRazorpayPaymentResponse {
  booking_id: string;
  payment_reference: string;
  razorpay_payment_id: string;
  payment_status: string;
  booking_status: string;
  amount: string;
}


export interface PaymentFailedResponse {
  booking_id: string;
  payment_status: string;
  booking_status: string;
}


export interface MockPaymentResponse {
  booking_id: string;
  payment_reference: string;
  payment_status: string;
  booking_status: string;
  amount: string;
}


/* ============================================================
   SHOW SEATS
============================================================ */

export async function getShowSeats(
  showId: number
): Promise<ShowSeatsResponse> {
  const response = await api.get(
    `/bookings/shows/${showId}/seats/`
  );

  return response.data;
}


/* ============================================================
   RESERVE SEATS
============================================================ */

export async function reserveSeats(
  showId: number,
  showSeatIds: number[]
): Promise<ReserveSeatsResponse> {
  const response = await api.post(
    `/bookings/shows/${showId}/reserve/`,
    {
      show_seat_ids: showSeatIds,
    }
  );

  return response.data;
}


/* ============================================================
   RELEASE SEAT HOLDS
============================================================ */

export async function releaseSeatHolds(
  showId: number,
  showSeatIds?: number[]
): Promise<{
  show_id: number;
  released: number;
}> {
  const response = await api.post(
    `/bookings/shows/${showId}/release/`,
    {
      show_seat_ids:
        showSeatIds ?? null,
    }
  );

  return response.data;
}


/* ============================================================
   CREATE BOOKING
============================================================ */

export async function createBooking(
  showId: number,
  showSeatIds: number[]
): Promise<Booking> {
  const response = await api.post(
    `/bookings/create/`,
    {
      show_id: showId,
      show_seat_ids: showSeatIds,
    }
  );

  return response.data;
}


/* ============================================================
   RAZORPAY — CREATE ORDER
============================================================ */

export async function createRazorpayOrder(
  bookingId: string
): Promise<CreateRazorpayOrderResponse> {
  const response = await api.post(
    `/bookings/payment/create-order/`,
    {
      booking_id: bookingId,
    }
  );

  return response.data;
}


/* ============================================================
   RAZORPAY — VERIFY PAYMENT
============================================================ */

export async function verifyRazorpayPayment(
  bookingId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<VerifyRazorpayPaymentResponse> {
  const response = await api.post(
    `/bookings/payment/verify/`,
    {
      booking_id: bookingId,
      razorpay_order_id:
        razorpayOrderId,
      razorpay_payment_id:
        razorpayPaymentId,
      razorpay_signature:
        razorpaySignature,
    }
  );

  return response.data;
}


/* ============================================================
   RAZORPAY — PAYMENT FAILED
============================================================ */

export async function markRazorpayPaymentFailed(
  bookingId: string
): Promise<PaymentFailedResponse> {
  const response = await api.post(
    `/bookings/payment/failed/`,
    {
      booking_id: bookingId,
    }
  );

  return response.data;
}


/* ============================================================
   MOCK PAYMENT
   Kept for development/testing.
============================================================ */

export async function processMockPayment(
  bookingId: string,
  success = true
): Promise<MockPaymentResponse> {
  const response = await api.post(
    `/bookings/payment/mock/`,
    {
      booking_id: bookingId,
      success,
    }
  );

  return response.data;
}


/*
 * Backward compatibility with older frontend code.
 */
export const makeMockPayment =
  processMockPayment;


/* ============================================================
   GET BOOKING
============================================================ */

export async function getBooking(
  bookingId: string
): Promise<Booking> {
  const response = await api.get(
    `/bookings/${bookingId}/`
  );

  return response.data;
}


/* ============================================================
   GET BOOKINGS
============================================================ */

export async function getBookings(
  category?: string
): Promise<Booking[]> {
  const params: Record<
    string,
    string
  > = {};

  if (category) {
    params.category = category;
  }

  const response = await api.get(
    `/bookings/`,
    {
      params,
    }
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.results ?? [];
}


/* ============================================================
   GET TICKET
============================================================ */

export async function getTicket(
  bookingId: string
): Promise<Ticket> {
  const response = await api.get(
    `/bookings/${bookingId}/ticket/`
  );

  return response.data;
}

/* ============================================================
   TICKET VERIFICATION
============================================================ */

export interface TicketVerification {
  valid: boolean;
  ticket_number?: string | null;
  booking_id?: string | null;
  movie_title?: string | null;
  theater_name?: string | null;
  screen_name?: string | null;
  city_name?: string | null;
  show_time?: string | null;
  seats?: string[];
  detail?: string;
}

export async function verifyTicket(
  verificationCode: string,
) {
  const response = await api.get(
    `/bookings/ticket/verify/${verificationCode}/`,
  );

  const data = response.data;

  return {
    valid: data.valid,
    verification_code: verificationCode,
    ticket_number: data.ticket_number,
    booking_id: data.booking_id,
    movie: data.movie_title,
    theater: data.theater_name,
    city: data.city_name,
    screen: data.screen_name,
    show_time: data.show_time,
    seats: data.seats || [],
    total_amount: data.total_amount,
    detail: data.detail,
  };
}
