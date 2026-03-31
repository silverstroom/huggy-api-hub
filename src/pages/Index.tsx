import { useState, useMemo, useRef, useEffect } from "react";
import { parseISO } from "date-fns";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, List, Search, X, Loader2, AlertCircle, RefreshCw, Settings2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { BookingDetailPanel } from "@/components/BookingDetailPanel";
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
  const [selectedBooking, setSelectedBooking] = useState<import("@/types/booking").Booking | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0 && contentRef.current && contentRef.current.scrollTop === 0) {
      setPullDistance(Math.min(delta * 0.4, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50) {
      handleRefresh();
    }
    setPullDistance(0);
    pullStartY.current = null;
  };

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

  // Show splash screen while loading for the first time
  const [splashDone, setSplashDone] = useState(false);
  const showSplash = isLoading && !splashDone;

  useEffect(() => {
    if (!isLoading && !splashDone) {
      // Small delay to let the exit animation play
      const t = setTimeout(() => setSplashDone(true), 400);
      return () => clearTimeout(t);
    }
  }, [isLoading, splashDone]);

  return (
    <div className="min-h-screen bg-background">
      {/* Splash / Loading overlay */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Animated logo / icon */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-16 h-16 rounded-2xl border-[3px] border-primary/20 border-t-primary"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", damping: 12 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <CalendarDays className="w-7 h-7 text-primary" />
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg font-semibold text-foreground"
                >
                  Camping Ulisse
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-muted-foreground"
                >
                  Color Fest
                </motion.p>
              </div>

              {/* Loading steps */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-3 mt-2"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Connessione ai server Color Fest...
                  </span>
                </div>
                <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary/60"
                  />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-[10px] text-muted-foreground/60"
                >
                  Recupero prenotazioni in corso…
                </motion.span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — hidden behind splash */}
      {!showSplash && (
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, damping: 20 }}
            className="mb-4 md:mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground">Camping Ulisse</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Calendario prenotazioni Color Fest</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                title="Aggiorna dati"
              >
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
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
              <AnimatePresence mode="wait">
                <motion.h2
                  key={format(currentMonth, "yyyy-MM")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-base md:text-lg font-semibold text-foreground min-w-[140px] md:min-w-[160px] text-center capitalize"
                >
                  {format(currentMonth, "MMMM yyyy", { locale: it })}
                </motion.h2>
              </AnimatePresence>
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

          {/* Inline status filter pills */}
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

          {/* Search popup overlay */}
          <AnimatePresence>
            {showMobileSearch && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 lg:hidden"
                  onClick={() => handleToggleSearch(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ type: "spring" as const, damping: 22, stiffness: 300 }}
                  className="fixed top-20 left-4 right-4 z-50 lg:hidden"
                >
                  <div className="bg-card rounded-2xl border border-border shadow-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="w-5 h-5 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Cerca cliente</span>
                      <button
                        onClick={() => handleToggleSearch(false)}
                        className="ml-auto p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Nome cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                      />
                    </div>
                    {searchQuery.trim() && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3"
                      >
                        <p className="text-xs text-muted-foreground mb-2">
                          {filteredBookings.length} risultat{filteredBookings.length === 1 ? "o" : "i"}
                        </p>
                        {filteredBookings.length > 0 && (
                          <div className="max-h-60 overflow-y-auto space-y-1 rounded-xl bg-muted/30 p-2">
                            {filteredBookings.slice(0, 20).map((b) => (
                              <button
                                key={b.booking_id}
                                onClick={() => {
                                  handleToggleSearch(false);
                                  setSelectedBooking(b);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                <div>
                                  <span className="text-sm font-medium text-foreground">{b.customer.name}</span>
                                  <span className="text-[11px] text-muted-foreground ml-2">
                                    {format(parseISO(b.from), "d MMM", { locale: it })} → {format(parseISO(b.to), "d MMM", { locale: it })}
                                  </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground">{b.persons} pers.</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Content */}
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

          <AnimatePresence mode="wait">
            {!isLoading && !isError && (
              <motion.div
                key={`${viewMode}-${statusFilter}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ type: "spring" as const, damping: 22, stiffness: 300 }}
                className="pb-28"
              >
                {viewMode === "calendar" ? (
                  <CalendarGrid bookings={filteredBookings} currentMonth={currentMonth} />
                ) : (
                  <BookingListView bookings={filteredBookings} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mobile nav */}
      {!showSplash && (
        <LiquidGlassNav
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={showMobileSearch}
          setShowSearch={handleToggleSearch}
        />
      )}

      <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}
