export interface Genre {
  id: number;
  name: string;
}

export interface Language {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  description?: string;
  release_date?: string | null;
  duration_minutes?: number | null;
  rating?: number | null;
  popularity?: number | null;
  poster?: string | null;
  trailer_url?: string | null;
  genres?: Genre[];
  languages?: Language[];
  matching_count?: number;
  lowest_ticket_price?: number | null;
  highest_ticket_price?: number | null;
}

export interface City {
  id: number;
  name: string;
  theater_count?: number;
}

export interface Theater {
  id: number;
  name: string;
  city?: number;
  city_name?: string;
  screen_count?: number;
}

export interface Screen {
  id: number;
  name: string;
  theater?: number;
  theater_name?: string;
  total_seats?: number;
}

export interface Show {
  id: number;
  movie?: number;
  movie_title?: string;
  screen?: number;
  screen_name?: string;
  theater_id?: number;
  theater_name?: string;
  city_id?: number;
  city_name?: string;
  start_time: string;
  ticket_price: number;
  total_seats?: number;
  available_seats?: number;
}

export interface ShowSeat {
  id: number;
  seat_label: string;
  price: number;
  status: string;
}

export interface BookingSeat {
  id: number;
  seat_label: string;
  price: number;
}

export interface Payment {
  payment_reference: string;
  amount: string;
  status: string;
  paid_at?: string | null;
}

export interface Booking {
  booking_id: string;
  movie_id: number;
  movie_title: string;
  city_name: string;
  theater_id: number;
  theater_name: string;
  screen_name: string;
  show_time: string;
  booking_seats: BookingSeat[];
  total_amount: string;
  status: string;
  expires_at?: string | null;
  remaining_seconds: number;
  booking_category: string;
  payment?: Payment | null;
  ticket_number?: string | null;
  ticket_download_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  ticket_number: string;
  booking_id: string;
  verification_code: string;
  pdf?: string | null;
  generated_at?: string | null;
  created_at: string;
}

export interface TicketVerification {
  valid: boolean;
  ticket_number: string;
  verification_code: string;
  booking_id: string;
  movie: string;
  theater: string;
  city: string;
  screen: string;
  show_time: string;
  seats: string[];
  total_amount: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  booking_count: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}