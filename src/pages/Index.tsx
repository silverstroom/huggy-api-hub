import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, List, Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { StatsCards } from "@/components/StatsCards";
import { CalendarGrid } from "@/components/CalendarGrid";
import { BookingListView } from "@/components/BookingListView";
import type { BookingStatus, ViewMode } from "@/types/booking";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "all", label: "Tutte" },
  { value: "paid", label: "Pagate" },
  { value: "pending", label: "In attesa" },
  { value: "cancelled", label: "Cancellate" },
];

export default function Index() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 7, 1)); // August 2026
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  const from = startOfMonth(currentMonth);
  const to = endOfMonth(currentMonth);

  const { data, isLoading, isError, refetch } = useBookings(from, to, statusFilter !== "all" ? statusFilter : undefined);

  const filteredBookings = useMemo(() => {
    if (!data?.bookings) return [];
    let bookings = data.bookings;
    if (statusFilter !== "all") {
      bookings = bookings.filter((b) => b.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      bookings = bookings.filter((b) => b.customer.name.toLowerCase().includes(q));
    }
    return bookings;
  }, [data, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Camping Ulisse</h1>
          <p className="text-sm text-muted-foreground">Calendario prenotazioni Color Fest</p>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StatsCards bookings={filteredBookings} currentMonth={currentMonth} />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground min-w-[160px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: it })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/30 w-48"
              />
            </div>

            {/* Status filter */}
            <div className="flex rounded overflow-hidden border border-border">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex rounded overflow-hidden border border-border">
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-1.5 transition-colors ${
                  viewMode === "calendar" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Caricamento prenotazioni...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Errore nel caricamento dei dati.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Riprova
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          viewMode === "calendar" ? (
            <CalendarGrid bookings={filteredBookings} currentMonth={currentMonth} />
          ) : (
            <BookingListView bookings={filteredBookings} />
          )
        )}
      </div>
    </div>
  );
}
