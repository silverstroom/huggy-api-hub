import { useState, useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, format, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getBookingColor } from "@/lib/bookingColors";
import type { Booking } from "@/types/booking";

interface DailyOccupancyChartProps {
  bookings: Booking[];
  currentMonth: Date;
  maxCapacity: number;
}

export function DailyOccupancyChart({ bookings, currentMonth, maxCapacity }: DailyOccupancyChartProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    return days.map((day) => {
      let persons = 0;
      const dayBookings: Booking[] = [];
      bookings.forEach((b) => {
        if (b.status === "cancelled") return;
        const from = parseISO(b.from);
        const to = parseISO(b.to);
        if (isWithinInterval(day, { start: from, end: to })) {
          persons += b.persons;
          dayBookings.push(b);
        }
      });
      return { date: day, persons, bookings: dayBookings };
    });
  }, [bookings, currentMonth]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return dailyData.find((d) => isSameDay(d.date, selectedDate)) || null;
  }, [selectedDate, dailyData]);

  const maxPersons = Math.max(...dailyData.map((d) => d.persons), maxCapacity);

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Presenze giornaliere</h3>
      <div className="flex items-end gap-[2px] h-32">
        {dailyData.map(({ date, persons }) => {
          const heightPct = maxPersons > 0 ? (persons / maxPersons) * 100 : 0;
          const overCapacity = persons > maxCapacity;
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          return (
            <div
              key={date.toISOString()}
              className="flex-1 flex flex-col items-end justify-end group relative h-full cursor-pointer"
              onClick={() => setSelectedDate(isSelected ? null : date)}
            >
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 left-1/2 -translate-x-1/2">
                <div className="bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded whitespace-nowrap">
                  {format(date, "d MMM", { locale: it })}: {persons} persone
                </div>
              </div>
              <div
                className={`w-full min-w-[3px] rounded-t transition-all ${
                  isSelected
                    ? "bg-primary ring-1 ring-primary"
                    : overCapacity
                    ? "bg-destructive"
                    : "bg-primary/70"
                }`}
                style={{ height: `${Math.max(heightPct, persons > 0 ? 4 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="relative h-0 -mt-[1px]" style={{ bottom: `${(maxCapacity / maxPersons) * 100}%` }}>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-destructive/50"
          style={{ bottom: `${(maxCapacity / maxPersons) * 128}px` }}
        />
      </div>
      <div className="flex gap-[2px] mt-1">
        {dailyData.map(({ date }, i) => (
          <div key={i} className="flex-1 text-center">
            {(i % 5 === 0 || i === dailyData.length - 1) && (
              <span className="text-[8px] text-muted-foreground">{format(date, "d")}</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Capienza max: {maxCapacity} · <span className="text-destructive">■</span> Oltre capienza
      </p>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDayData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {format(selectedDayData.date, "EEEE d MMMM", { locale: it })}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    — {selectedDayData.persons} persone
                  </span>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-1 rounded hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              {selectedDayData.bookings.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nessuna prenotazione attiva.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedDayData.bookings.map((b, i) => (
                    <div
                      key={b.booking_id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50 text-xs"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: `hsl(var(${getBookingColor(b.booking_id)}))` }}
                      />
                      <span className="font-medium text-foreground truncate">{b.customer.name}</span>
                      <span className="text-muted-foreground ml-auto whitespace-nowrap">
                        {b.persons} pers · {b.product_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
