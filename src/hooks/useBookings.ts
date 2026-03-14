import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookingsResponse } from "@/types/booking";
import { mockBookings } from "@/data/mockBookings";

const API_KEY = "79f6de5558fd03ca977cd98afb292fded9e4defe29e58b85";
const API_URL = "https://colorfest.it/wp-json/cf/v1/bookings";

async function fetchBookings(from: Date, to: Date): Promise<BookingsResponse> {
  const params = new URLSearchParams({
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  });

  try {
    const res = await fetch(`${API_URL}?${params}`, {
      headers: { "X-CF-Key": API_KEY },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch {
    // CORS or network error — return mock data
    console.warn("API non raggiungibile, uso dati mock");
    return { total: mockBookings.length, bookings: mockBookings };
  }
}

export function useBookings(from: Date, to: Date) {
  return useQuery({
    queryKey: ["bookings", format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd")],
    queryFn: () => fetchBookings(from, to),
    retry: 0,
    staleTime: 60_000,
  });
}
