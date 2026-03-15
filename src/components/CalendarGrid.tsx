import { useMemo, useState } from "react";
import { Booking } from "@/types/booking";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, parseISO,
  isToday, isBefore, addDays, isWithinInterval,
} from "date-fns";
import { it } from "date-fns/locale";
import { getBookingColor, abbreviateName } from "@/lib/bookingColors";
import { BookingDetailPanel } from "./BookingDetailPanel";
import { Users, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface CalendarGridProps {
  bookings: Booking[];
  currentMonth: Date;
}

interface BookingRow {
  booking: Booking;
  colorIndex: number;
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

  const bookingRows: BookingRow[] = useMemo(
    () => bookings.map((b, i) => ({ booking: b, colorIndex: i })),
    [bookings]
  );

  // Compute persons per day for all calendar days
  const personsPerDay = useMemo(() => {
    const map = new Map<string, { persons: number; bookings: Booking[] }>();
    bookings.forEach((b) => {
      if (b.status === "cancelled") return;
      const from = parseISO(b.from);
      const to = parseISO(b.to);
      const interval = eachDayOfInterval({ start: from, end: addDays(to, -1) });
      interval.forEach((d) => {
        const key = format(d, "yyyy-MM-dd");
        const existing = map.get(key) || { persons: 0, bookings: [] };
        existing.persons += b.persons;
        existing.bookings.push(b);
        map.set(key, existing);
      });
    });
    return map;
  }, [bookings]);

  const getBookingsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return bookingRows.filter(({ booking }) => {
      return dayStr >= booking.from && dayStr < booking.to;
    });
  };

  const getBarSpan = (booking: Booking, weekDays: Date[]) => {
    const from = parseISO(booking.from);
    const to = addDays(parseISO(booking.to), -1);
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];

    const barStart = isBefore(from, weekStart) ? weekStart : from;
    const barEnd = isBefore(to, weekEnd) ? to : weekEnd;

    const startIdx = weekDays.findIndex((d) => format(d, "yyyy-MM-dd") === format(barStart, "yyyy-MM-dd"));
    const endIdx = weekDays.findIndex((d) => format(d, "yyyy-MM-dd") === format(barEnd, "yyyy-MM-dd"));

    if (startIdx === -1 || endIdx === -1) return null;
    return { startIdx, span: endIdx - startIdx + 1 };
  };

  const getWeekBookings = (weekDays: Date[]) => {
    const seen = new Set<number>();
    const result: BookingRow[] = [];
    for (const day of weekDays) {
      for (const br of getBookingsForDay(day)) {
        if (!seen.has(br.booking.booking_id)) {
          seen.add(br.booking.booking_id);
          result.push(br);
        }
      }
    }
    return result;
  };

  const popoverData = useMemo(() => {
    if (!popoverDay) return null;
    return personsPerDay.get(popoverDay) || null;
  }, [popoverDay, personsPerDay]);

  return (
    <>
      <div className="bg-card rounded-lg shadow-[inset_0_0_0_1px_hsl(var(--border))] overflow-x-auto relative">
        <div className="min-w-[500px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-1 md:px-2 py-2 text-center">
                <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          {weeks.map((week, wi) => {
            const weekBookings = getWeekBookings(week);
            return (
              <div key={wi} className="border-b border-border last:border-b-0">
                {/* Day numbers + person count */}
                <div className="grid grid-cols-7">
                  {week.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const dayData = personsPerDay.get(dayStr);
                    const personCount = dayData?.persons || 0;
                    const isInMonth = isSameMonth(day, currentMonth);
                    const isPopoverOpen = popoverDay === dayStr;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`relative px-1 md:px-2 pt-1 md:pt-1.5 pb-0.5 border-r border-border last:border-r-0 min-h-[24px] md:min-h-[28px] ${
                          !isInMonth ? "opacity-30" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] md:text-xs font-medium ${
                              isToday(day)
                                ? "bg-primary text-primary-foreground rounded-full w-4 h-4 md:w-5 md:h-5 inline-flex items-center justify-center text-[9px] md:text-xs"
                                : "text-foreground"
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                          {personCount > 0 && isInMonth && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPopoverDay(isPopoverOpen ? null : dayStr);
                              }}
                              className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] md:text-[10px] font-semibold transition-all ${
                                isPopoverOpen
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }`}
                            >
                              <Users className="w-2.5 h-2.5 md:w-3 md:h-3" />
                              {personCount}
                            </button>
                          )}
                        </div>

                        {/* Popover */}
                        <AnimatePresence>
                          {isPopoverOpen && popoverData && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -4 }}
                              transition={{ type: "spring", damping: 22, stiffness: 400 }}
                              className="absolute top-full left-0 z-50 mt-1 w-56 bg-card rounded-xl border border-border shadow-xl p-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-xs font-semibold text-foreground">
                                    {format(parseISO(dayStr), "d MMMM", { locale: it })}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setPopoverDay(null)}
                                  className="p-0.5 rounded hover:bg-muted"
                                >
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </div>
                              <p className="text-[10px] text-muted-foreground mb-2">
                                {popoverData.persons} persone · {popoverData.bookings.length} prenotazion{popoverData.bookings.length === 1 ? "e" : "i"}
                              </p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {popoverData.bookings.map((b, i) => (
                                  <div
                                    key={b.booking_id}
                                    className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50 text-[10px] cursor-pointer hover:bg-muted transition-colors"
                                    onClick={() => {
                                      setSelectedBooking(b);
                                      setPopoverDay(null);
                                    }}
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${getBookingColor(bookings.indexOf(b)).bg}`}
                                    />
                                    <span className="font-medium text-foreground truncate">{b.customer.name}</span>
                                    <span className="text-muted-foreground ml-auto">{b.persons}p</span>
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

                {/* Booking bars */}
                <div className="relative min-h-[20px] md:min-h-[24px]">
                  {weekBookings.map(({ booking, colorIndex }, rowIdx) => {
                    const bar = getBarSpan(booking, week);
                    if (!bar) return null;
                    const color = getBookingColor(colorIndex);
                    return (
                      <div
                        key={booking.booking_id}
                        className="grid grid-cols-7 absolute w-full"
                        style={{ top: `${rowIdx * 18}px` }}
                      >
                        <div
                          className={`${color.bg} ${color.text} rounded-sm px-1 py-px text-[9px] md:text-[11px] font-medium truncate cursor-pointer
                            hover:brightness-95 transition-all leading-tight`}
                          style={{
                            gridColumnStart: bar.startIdx + 1,
                            gridColumnEnd: bar.startIdx + 1 + bar.span,
                            marginLeft: "1px",
                            marginRight: "1px",
                          }}
                          onClick={() => setSelectedBooking(booking)}
                        >
                          {abbreviateName(booking.customer.name)}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ height: `${Math.max(weekBookings.length * 18 + 4, 20)}px` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Close popover when clicking outside */}
      {popoverDay && (
        <div className="fixed inset-0 z-40" onClick={() => setPopoverDay(null)} />
      )}

      <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </>
  );
}