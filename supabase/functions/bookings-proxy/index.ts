import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type ApiBooking = Record<string, unknown> & { status?: string };
type ApiResponse = { total?: number; bookings?: ApiBooking[] };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_URL = "https://colorfest.it/wp-json/cf/v1/bookings";
const API_KEY = "79f6de5558fd03ca977cd98afb292fded9e4defe29e58b85";

const normalizeStatus = (rawStatus: string | undefined, requestedStatus: string | null) => {
  if (requestedStatus && requestedStatus !== "all") return requestedStatus;

  switch (rawStatus) {
    case "paid":
    case "completed":
      return "paid";
    case "pending":
    case "processing":
    case "on-hold":
      return "pending";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      // Il plugin spesso restituisce "unknown" su prenotazioni comunque pagate
      return "paid";
  }
};

async function fetchUpstream(from: string, to: string, status?: string | null): Promise<ApiResponse> {
  const params = new URLSearchParams({ from, to });
  if (status) params.set("status", status);

  const apiRes = await fetch(`${API_URL}?${params}`, {
    headers: { "X-CF-Key": API_KEY },
  });

  if (!apiRes.ok) {
    const body = await apiRes.text();
    throw new Error(`API error [${apiRes.status}]: ${body}`);
  }

  return apiRes.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const status = url.searchParams.get("status");

    if (!from || !to) {
      return new Response(
        JSON.stringify({ error: "Missing 'from' or 'to' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // L'API source usa spesso "completed" al posto di "paid"
    const upstreamStatus = status === "paid" ? "completed" : status;
    let data = await fetchUpstream(from, to, upstreamStatus);

    // Fallback robusto: se paid torna vuoto, recupero tutto e tratto come paid
    if (status === "paid" && (!data.bookings || data.bookings.length === 0)) {
      data = await fetchUpstream(from, to, null);
    }

    const normalizedBookings = (data.bookings ?? []).map((booking) => ({
      ...booking,
      status: normalizeStatus(booking.status, status),
    }));

    return new Response(
      JSON.stringify({ total: normalizedBookings.length, bookings: normalizedBookings }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
