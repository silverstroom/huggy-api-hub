import { useState, useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, format, isWithinInterval, parseISO, isSameDay, getDate, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { X, Users, ZoomIn, ZoomOut } from "lucide-react";
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
  const [focusWeek, setFocusWeek] = useState(true);

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
        const to = addDays(parseISO(b.to), -1); // checkout day excluded
        if (isWithinInterval(day, { start: from, end: to })) {
          persons += b.persons;
          dayBookings.push(b);
        }
      });
      return { date: day, persons, bookings: dayBookings };
    });
  }, [bookings, currentMonth]);

  const FOCUS_START = 9;
  const FOCUS_END = 17;

  const displayData = useMemo(() => {
    if (!focusWeek) return dailyData;
    return dailyData.filter((d) => {
      const day = getDate(d.date);
      return day >= FOCUS_START && day <= FOCUS_END;
    });
  }, [dailyData, focusWeek]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return dailyData.find((d) => isSameDay(d.date, selectedDate)) || null;
  }, [selectedDate, dailyData]);

  const maxPersons = Math.max(...displayData.map((d) => d.persons), maxCapacity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", damping: 20 }}
      className="bg-card rounded-xl border border-border p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Presenze giornaliere {focusWeek && <span className="text-muted-foreground font-normal">· {FOCUS_START}–{FOCUS_END} ago</span>}
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFocusWeek(!focusWeek)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {focusWeek ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
          {focusWeek ? "Mese intero" : "Ferragosto"}
        </motion.button>
      </div>
      <div className="flex items-end gap-[3px] h-36">
        {displayData.map(({ date, persons }, idx) => {
          const heightPct = maxPersons > 0 ? (persons / maxPersons) * 100 : 0;
          const overCapacity = persons > maxCapacity;
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          return (
            <div
              key={date.toISOString()}
              className="flex-1 flex flex-col items-center justify-end group relative h-full cursor-pointer"
              onClick={() => setSelectedDate(isSelected ? null : date)}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, persons > 0 ? 4 : 0)}%` }}
                transition={{ delay: 0.4 + idx * 0.04, type: "spring", damping: 15, stiffness: 200 }}
                className={`w-full min-w-[3px] rounded-t relative ${
                  isSelected
                    ? "bg-primary ring-1 ring-primary"
                    : overCapacity
                    ? "bg-destructive"
                    : "bg-primary/70"
                }`}
              >
                {/* Tooltip */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-foreground text-background text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">
                    {persons} <span className="opacity-70">pers.</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-foreground rotate-45 -mt-[3px]" />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="relative h-0 -mt-[1px]" style={{ bottom: `${(maxCapacity / maxPersons) * 100}%` }}>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-destructive/50"
          style={{ bottom: `${(maxCapacity / maxPersons) * 144}px` }}
        />
      </div>
      <div className="flex gap-[3px] mt-1">
        {displayData.map(({ date }, i) => (
          <div
            key={i}
            className="flex-1 text-center cursor-pointer"
            onClick={() => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              setSelectedDate(isSelected ? null : date);
            }}
          >
            <span className={`text-[8px] ${selectedDate && isSameDay(date, selectedDate) ? "text-primary font-bold" : "text-muted-foreground"}`}>
              {format(date, "d")}
            </span>
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
            transition={{ type: "spring", damping: 20 }}
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
                    <motion.div
                      key={b.booking_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
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
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
