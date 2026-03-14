export interface Booking {
  booking_id: number;
  order_id: number;
  product_name: string;
  status: "paid" | "pending" | "cancelled";
  customer: {
    name: string;
    email: string;
  };
  from: string;
  to: string;
  duration_days: number;
  persons: number;
  booked_at: string;
}

export interface BookingsResponse {
  total: number;
  bookings: Booking[];
}

export type BookingStatus = "all" | "paid" | "pending" | "cancelled";
export type ViewMode = "calendar" | "list";
