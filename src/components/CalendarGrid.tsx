import { useMemo, useState } from "react";
import { Booking } from "@/types/booking";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, parseISO,
  isToday, addDays,
} from "date-fns";
import { it } from "date-fns/locale";
import { getBookingColor } from "@/lib/bookingColors";
import { BookingDetailPanel } from "./BookingDetailPanel";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface CalendarGridProps {
  bookings: Booking[];
  currentMonth: Date;
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function CalendarGrid({ bookings, currentMonth }: CalendarGridProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [popoverDay, setPopoverDay] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Compute persons + bookings per day
  const personsPerDay = useMemo(() => {
    const map = new Map<string, { persons: number; bookings: Booking[]; bookingCount: number }>();
    bookings.forEach((b) => {
      if (b.status === "cancelled") return;
      const from = parseISO(b.from);
      const to = parseISO(b.to);
      const interval = eachDayOfInterval({ start: from, end: addDays(to, -1) });
      interval.forEach((d) => {
        const key = format(d, "yyyy-MM-dd");
        const existing = map.get(key) || { persons: 0, bookings: [], bookingCount: 0 };
        existing.persons += b.persons;
        existing.bookings.push(b);
        existing.bookingCount++;
        map.set(key, existing);
      });
    });
    return map;
  }, [bookings]);

  // Find max persons across the month for the heatmap scale
  const maxPersons = useMemo(() => {
    let max = 1;
    personsPerDay.forEach((v) => { if (v.persons > max) max = v.persons; });
    return max;
  }, [personsPerDay]);

  const popoverData = useMemo(() => {
    if (!popoverDay) return null;
    return personsPerDay.get(popoverDay) || null;
  }, [popoverDay, personsPerDay]);

  return (
    <>
      <div className="bg-card rounded-lg shadow-[inset_0_0_0_1px_hsl(var(--border))] overflow-x-auto relative">
        <div className="min-w-[340px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-1 py-2 text-center">
                <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
              {week.map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayData = personsPerDay.get(dayStr);
                const personCount = dayData?.persons || 0;
                const bookingCount = dayData?.bookingCount || 0;
                const isInMonth = isSameMonth(day, currentMonth);
                const isPopoverOpen = popoverDay === dayStr;

                // Heatmap intensity: 0 to 1
                const intensity = personCount > 0 ? Math.max(0.08, personCount / maxPersons) : 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={`relative border-r border-border last:border-r-0 min-h-[60px] md:min-h-[72px] p-1 md:p-1.5 flex flex-col cursor-pointer transition-colors ${
                      !isInMonth ? "opacity-20" : "hover:bg-muted/30"
                    } ${isPopoverOpen ? "ring-1 ring-inset ring-primary" : ""}`}
                    onClick={() => {
                      if (!isInMonth || personCount === 0) return;
                      setPopoverDay(isPopoverOpen ? null : dayStr);
                    }}
                  >
                    {/* Day number */}
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-[11px] md:text-xs font-medium leading-none ${
                          isToday(day)
                            ? "bg-primary text-primary-foreground rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px]"
                            : "text-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>

                    {/* Person count — big and prominent */}
                    {personCount > 0 && isInMonth && (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span
                          className="text-lg md:text-xl font-bold leading-none"
                          style={{ color: `hsl(var(--primary) / ${0.5 + intensity * 0.5})` }}
                        >
                          {personCount}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-muted-foreground mt-0.5">
                          {bookingCount} pren.
                        </span>
                      </div>
                    )}

                    {/* Heatmap background */}
                    {personCount > 0 && isInMonth && (
                      <div
                        className="absolute inset-0 rounded-sm pointer-events-none"
                        style={{ backgroundColor: `hsl(var(--primary) / ${intensity * 0.12})` }}
                      />
                    )}

                    {/* Popover */}
                    <AnimatePresence>
                      {isPopoverOpen && popoverData && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          transition={{ type: "spring", damping: 22, stiffness: 400 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1 w-60 bg-card rounded-xl border border-border shadow-xl p-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground capitalize">
                              {format(parseISO(dayStr), "EEEE d MMMM", { locale: it })}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPopoverDay(null); }}
                              className="p-0.5 rounded hover:bg-muted"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-primary">{popoverData.persons}</span>
                            <span className="text-xs text-muted-foreground">
                              persone · {popoverData.bookings.length} prenotazioni
                            </span>
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {popoverData.bookings.map((b) => (
                              <div
                                key={b.booking_id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50 text-[11px] cursor-pointer hover:bg-muted transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(b);
                                  setPopoverDay(null);
                                }}
                              >
                                <div className={`w-2 h-2 rounded-full shrink-0 ${getBookingColor(bookings.indexOf(b)).bg}`} />
                                <span className="font-medium text-foreground truncate">{b.customer.name}</span>
                                <span className="text-muted-foreground ml-auto shrink-0">{b.persons} pers.</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Close popover backdrop */}
      {popoverDay && (
        <div className="fixed inset-0 z-40" onClick={() => setPopoverDay(null)} />
      )}

      <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </>
  );
}