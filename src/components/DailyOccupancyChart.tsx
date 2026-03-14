import { useMemo } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, format, isWithinInterval, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Booking } from "@/types/booking";

interface DailyOccupancyChartProps {
  bookings: Booking[];
  currentMonth: Date;
  maxCapacity: number;
}

export function DailyOccupancyChart({ bookings, currentMonth, maxCapacity }: DailyOccupancyChartProps) {
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    return days.map((day) => {
      let persons = 0;
      bookings.forEach((b) => {
        if (b.status === "cancelled") return;
        const from = parseISO(b.from);
        const to = parseISO(b.to);
        if (isWithinInterval(day, { start: from, end: to })) {
          persons += b.persons;
        }
      });
      return { date: day, persons };
    });
  }, [bookings, currentMonth]);

  const maxPersons = Math.max(...dailyData.map((d) => d.persons), maxCapacity);

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Presenze giornaliere</h3>
      <div className="flex items-end gap-[2px] h-32">
        {dailyData.map(({ date, persons }) => {
          const heightPct = maxPersons > 0 ? (persons / maxPersons) * 100 : 0;
          const overCapacity = persons > maxCapacity;
          return (
            <div key={date.toISOString()} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded whitespace-nowrap">
                  {format(date, "d MMM", { locale: it })}: {persons} persone
                </div>
              </div>
              <div
                className={`w-full min-w-[3px] rounded-t transition-all ${
                  overCapacity ? "bg-destructive" : "bg-primary/70"
                }`}
                style={{ height: `${Math.max(heightPct, persons > 0 ? 4 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* Capacity line label */}
      <div className="relative h-0 -mt-[1px]" style={{ bottom: `${(maxCapacity / maxPersons) * 100}%` }}>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-destructive/50"
          style={{ bottom: `${(maxCapacity / maxPersons) * 128}px` }}
        />
      </div>
      {/* Day labels */}
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
    </div>
  );
}
