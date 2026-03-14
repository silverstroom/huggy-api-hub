import { useMemo, useState } from "react";
import { Booking } from "@/types/booking";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, parseISO,
  isToday, isBefore, addDays,
} from "date-fns";
import { it } from "date-fns/locale";
import { getBookingColor, abbreviateName } from "@/lib/bookingColors";
import { BookingDetailPanel } from "./BookingDetailPanel";

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

  // Assign color indices to bookings
  const bookingRows: BookingRow[] = useMemo(
    () => bookings.map((b, i) => ({ booking: b, colorIndex: i })),
    [bookings]
  );

  // For each day, find which bookings are active (from <= day < to)
  const getBookingsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return bookingRows.filter(({ booking }) => {
      const from = booking.from;
      const to = booking.to;
      return dayStr >= from && dayStr < to;
    });
  };

  // Check if a booking starts on this day
  const isBookingStart = (booking: Booking, day: Date) => {
    return format(day, "yyyy-MM-dd") === booking.from;
  };

  // Calculate span of booking bar within the week row
  const getBarSpan = (booking: Booking, weekDays: Date[]) => {
    const from = parseISO(booking.from);
    const to = addDays(parseISO(booking.to), -1); // last night
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];

    const barStart = isBefore(from, weekStart) ? weekStart : from;
    const barEnd = isBefore(to, weekEnd) ? to : weekEnd;

    const startIdx = weekDays.findIndex((d) => format(d, "yyyy-MM-dd") === format(barStart, "yyyy-MM-dd"));
    const endIdx = weekDays.findIndex((d) => format(d, "yyyy-MM-dd") === format(barEnd, "yyyy-MM-dd"));

    if (startIdx === -1 || endIdx === -1) return null;
    return { startIdx, span: endIdx - startIdx + 1 };
  };

  // Get unique bookings that appear in a week
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

  return (
    <>
      <div className="bg-card rounded-lg shadow-[inset_0_0_0_1px_hsl(var(--border))] overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        {weeks.map((week, wi) => {
          const weekBookings = getWeekBookings(week);
          return (
            <div key={wi} className="border-b border-border last:border-b-0">
              {/* Day numbers */}
              <div className="grid grid-cols-7">
                {week.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`px-2 pt-1.5 pb-0.5 text-right border-r border-border last:border-r-0 min-h-[28px] ${
                      !isSameMonth(day, currentMonth) ? "opacity-30" : ""
                    }`}
                  >
                    <span
                      className={`text-xs font-medium ${
                        isToday(day)
                          ? "bg-primary text-primary-foreground rounded-full w-5 h-5 inline-flex items-center justify-center"
                          : "text-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Booking bars */}
              <div className="relative min-h-[24px]">
                {weekBookings.map(({ booking, colorIndex }, rowIdx) => {
                  const bar = getBarSpan(booking, week);
                  if (!bar) return null;
                  const color = getBookingColor(colorIndex);
                  return (
                    <div
                      key={booking.booking_id}
                      className="grid grid-cols-7 absolute w-full"
                      style={{ top: `${rowIdx * 22}px` }}
                    >
                      <div
                        className={`${color.bg} ${color.text} rounded-sm px-1.5 py-0.5 text-[11px] font-medium truncate cursor-pointer
                          hover:brightness-95 transition-all`}
                        style={{
                          gridColumnStart: bar.startIdx + 1,
                          gridColumnEnd: bar.startIdx + 1 + bar.span,
                          marginLeft: "2px",
                          marginRight: "2px",
                        }}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        {abbreviateName(booking.customer.name)}
                      </div>
                    </div>
                  );
                })}
                {/* Spacer for rows */}
                <div style={{ height: `${Math.max(weekBookings.length * 22 + 4, 24)}px` }} />
              </div>
            </div>
          );
        })}
      </div>

      <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </>
  );
}
