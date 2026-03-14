import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_URL = "https://colorfest.it/wp-json/cf/v1/bookings";
const API_KEY = "79f6de5558fd03ca977cd98afb292fded9e4defe29e58b85";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const params = new URLSearchParams({ from, to });
    if (status) {
      params.set("status", status);
    }
    const apiRes = await fetch(`${API_URL}?${params}`, {
      headers: { "X-CF-Key": API_KEY },
    });

    if (!apiRes.ok) {
      const body = await apiRes.text();
      throw new Error(`API error [${apiRes.status}]: ${body}`);
    }

    const data = await apiRes.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
