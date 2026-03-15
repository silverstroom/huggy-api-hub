import { useState, useMemo, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, List, Search, X, Loader2, AlertCircle, RefreshCw, Settings2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { StatsCards } from "@/components/StatsCards";
import { CalendarGrid } from "@/components/CalendarGrid";
import { BookingListView } from "@/components/BookingListView";
import { MobileDayList } from "@/components/MobileDayList";
import { DailyOccupancyChart } from "@/components/DailyOccupancyChart";
import { LiquidGlassNav } from "@/components/LiquidGlassNav";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BookingStatus, ViewMode } from "@/types/booking";

const STATUS_OPTIONS: { value: BookingStatus; label: string; dot?: string }[] = [
  { value: "all", label: "Tutte" },
  { value: "paid", label: "Pagate", dot: "bg-emerald-500" },
  { value: "pending", label: "In attesa", dot: "bg-amber-500" },
  { value: "cancelled", label: "Cancellate", dot: "bg-red-500" },
];

export default function Index() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 7, 1));
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("paid");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(200);
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const from = startOfMonth(currentMonth);
  const to = endOfMonth(currentMonth);

  const { data, isLoading, isError, refetch } = useBookings(from, to, statusFilter !== "all" ? statusFilter : undefined);

  // Auto-focus search input when opened
  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  // Clear search when closing
  const handleToggleSearch = (show: boolean) => {
    setShowMobileSearch(show);
    if (!show) {
      setSearchQuery("");
    }
  };

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

  // Count bookings per status for badges
  const statusCounts = useMemo(() => {
    if (!data?.bookings) return {} as Record<BookingStatus, number>;
    return {
      all: data.bookings.length,
      paid: data.bookings.filter(b => b.status === "paid").length,
      pending: data.bookings.filter(b => b.status === "pending").length,
      cancelled: data.bookings.filter(b => b.status === "cancelled").length,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, damping: 20 }}
          className="mb-4 md:mb-6"
        >
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Camping Ulisse</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Calendario prenotazioni Color Fest</p>
        </motion.div>

        {/* Stats */}
        <div className="mb-4 md:mb-6">
          <StatsCards bookings={filteredBookings} currentMonth={currentMonth} maxCapacity={maxCapacity} />
          <div className="flex items-center gap-2 mt-2">
            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Capienza max/giorno:</span>
            <input
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Math.max(1, Number(e.target.value)))}
              className="w-16 px-2 py-0.5 text-xs rounded bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <span className="text-xs text-muted-foreground">persone</span>
          </div>
          <DailyOccupancyChart bookings={filteredBookings} currentMonth={currentMonth} maxCapacity={maxCapacity} />
        </div>

        {/* Month navigation + controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-base md:text-lg font-semibold text-foreground min-w-[140px] md:min-w-[160px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: it })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Desktop controls */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/30 w-48"
              />
            </div>
            <div className="flex rounded-lg overflow-hidden border border-border">
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

        {/* Inline status filter pills — visible on both mobile and desktop */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            const count = statusCounts[opt.value] ?? 0;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {opt.dot && (
                  <span className={`w-2 h-2 rounded-full ${opt.dot} ${isActive ? "opacity-100" : "opacity-40"}`} />
                )}
                {opt.label}
                <span className={`text-[10px] tabular-nums ${isActive ? "text-primary/70" : "text-muted-foreground/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile search bar — inline, toggleable */}
        {showMobileSearch && isMobile && (
          <div className="mb-3 flex items-center gap-2 lg:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cerca cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <button
              onClick={() => handleToggleSearch(false)}
              className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Riprova
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {isMobile ? (
              viewMode === "list" ? (
                <BookingListView bookings={filteredBookings} />
              ) : (
                <MobileDayList bookings={filteredBookings} currentMonth={currentMonth} />
              )
            ) : (
              viewMode === "calendar" ? (
                <CalendarGrid bookings={filteredBookings} currentMonth={currentMonth} />
              ) : (
                <BookingListView bookings={filteredBookings} />
              )
            )}
          </>
        )}
      </div>

      {/* Mobile nav — simplified, no filter */}
      <LiquidGlassNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showMobileSearch}
        setShowSearch={handleToggleSearch}
      />
    </div>
  );
}
