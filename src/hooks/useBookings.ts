import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookingsResponse } from "@/types/booking";
import { mockBookings } from "@/data/mockBookings";
import { supabase } from "@/integrations/supabase/client";

async function fetchBookings(from: Date, to: Date): Promise<BookingsResponse> {
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  try {
    const { data, error } = await supabase.functions.invoke("bookings-proxy", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: null,
    });

    // supabase.functions.invoke doesn't support query params, so use fetch directly
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/bookings-proxy?from=${fromStr}&to=${toStr}`,
      {
        headers: {
          "Authorization": `Bearer ${anonKey}`,
          "apikey": anonKey,
        },
      }
    );

    if (!res.ok) throw new Error(`Edge function error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.warn("Edge function non raggiungibile, uso dati mock", err);
    return { total: mockBookings.length, bookings: mockBookings };
  }
}

export function useBookings(from: Date, to: Date) {
  return useQuery({
    queryKey: ["bookings", format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd")],
    queryFn: () => fetchBookings(from, to),
    retry: 1,
    staleTime: 60_000,
  });
}
