import { Booking } from "@/types/booking";
import { format, parseISO, eachDayOfInterval, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { getBookingColor } from "@/lib/bookingColors";
import { useMemo, useState } from "react";
import { BookingDetailPanel } from "./BookingDetailPanel";
import { motion } from "framer-motion";
import { Download, ChevronDown, ChevronRight, Users } from "lucide-react";

interface BookingListViewProps {
  bookings: Booking[];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string; label: string }> = {
    paid: { cls: "bg-success/10 text-success", label: "Pagata" },
    pending: { cls: "bg-warning/10 text-warning", label: "In attesa" },
    cancelled: { cls: "bg-destructive/10 text-destructive", label: "Cancellata" },
  };
  const c = config[status] || config.pending;
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

interface DayGroup {
  date: string;
  dateObj: Date;
  bookings: Booking[];
  totalPersons: number;
}

function groupBookingsByDay(bookings: Booking[]): DayGroup[] {
  const dayMap = new Map<string, Booking[]>();

  bookings.forEach((b) => {
    if (b.status === "cancelled") return;
    const from = parseISO(b.from);
    const to = addDays(parseISO(b.to), -1);
    const interval = eachDayOfInterval({ start: from, end: to });
    interval.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      const existing = dayMap.get(key) || [];
      existing.push(b);
      dayMap.set(key, existing);
    });
  });

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bks]) => ({
      date,
      dateObj: parseISO(date),
      bookings: bks,
      totalPersons: bks.reduce((sum, b) => sum + b.persons, 0),
    }));
}

function generateCSV(groups: DayGroup[]): string {
  const headers = [
    "Giorno",
    "Nome Cliente",
    "Email",
    "Check-in",
    "Check-out",
    "Notti",
    "Persone",
    "Stato",
    "ID Prenotazione",
    "ID Ordine",
    "Prodotto",
    "Data Prenotazione",
  ];

  const rows: string[][] = [];

  groups.forEach((group) => {
    group.bookings.forEach((b) => {
      rows.push([
        format(group.dateObj, "dd/MM/yyyy"),
        b.customer.name,
        b.customer.email,
        format(parseISO(b.from), "dd/MM/yyyy"),
        format(parseISO(b.to), "dd/MM/yyyy"),
        String(b.duration_days),
        String(b.persons),
        b.status === "paid" ? "Pagata" : b.status === "pending" ? "In attesa" : "Cancellata",
        String(b.booking_id),
        String(b.order_id),
        b.product_name,
        b.booked_at,
      ]);
    });
  });

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function BookingListView({ bookings }: BookingListViewProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const dayGroups = useMemo(() => groupBookingsByDay(bookings), [bookings]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(dayGroups.map((g) => g.date)));
  };

  const handleDownload = () => {
    const csv = generateCSV(dayGroups);
    const filename = `prenotazioni_${format(new Date(), "yyyy-MM-dd")}.csv`;
    downloadCSV(csv, filename);
  };

  if (bookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-lg shadow-[inset_0_0_0_1px_hsl(var(--border))] p-8 text-center text-muted-foreground"
      >
        Nessuna prenotazione trovata.
      </motion.div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-[10px] md:text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Espandi tutti
          </button>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            {dayGroups.length} giorni · {bookings.filter((b) => b.status !== "cancelled").length} prenotazioni
          </span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Scarica CSV
        </button>
      </div>

      {/* Day groups */}
      <div className="space-y-2">
        {dayGroups.map((group, gi) => {
          const isExpanded = expandedDays.has(group.date);
          return (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.03, type: "spring", damping: 22 }}
              className="bg-card rounded-lg shadow-[inset_0_0_0_1px_hsl(var(--border))] overflow-hidden"
            >
              {/* Day header */}
              <button
                onClick={() => toggleDay(group.date)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-semibold text-foreground capitalize">
                  {format(group.dateObj, "EEEE d MMMM yyyy", { locale: it })}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{group.totalPersons}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({group.bookings.length} pren.)
                  </span>
                </div>
              </button>

              {/* Expanded booking list */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ type: "spring", damping: 22 }}
                  className="border-t border-border"
                >
                  {/* Header row - visible on md+ */}
                  <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-1.5 bg-muted/30">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cliente</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Check-in</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Check-out</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Persone</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Stato</span>
                  </div>

                  {group.bookings.map((booking, i) => {
                    const color = getBookingColor(bookings.indexOf(booking));
                    return (
                      <motion.div
                        key={`${group.date}-${booking.booking_id}`}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: i * 0.03, type: "spring", damping: 22 }}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        {/* Desktop row */}
                        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                            <div>
                              <span className="text-sm font-medium text-foreground">{booking.customer.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">{booking.customer.email}</span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(booking.from), "d MMM", { locale: it })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(booking.to), "d MMM", { locale: it })}
                          </span>
                          <span className="text-sm text-muted-foreground text-center">{booking.persons}</span>
                          <StatusBadge status={booking.status} />
                        </div>

                        {/* Mobile row */}
                        <div className="md:hidden px-4 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                            <span className="text-sm font-medium text-foreground">{booking.customer.name}</span>
                            <StatusBadge status={booking.status} />
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground ml-4">
                            <span>{booking.persons} pers.</span>
                            <span>
                              {format(parseISO(booking.from), "d MMM", { locale: it })} → {format(parseISO(booking.to), "d MMM", { locale: it })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </>
  );
}