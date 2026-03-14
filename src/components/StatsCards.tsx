import { Booking } from "@/types/booking";
import { getDaysInMonth, parseISO, eachDayOfInterval, isWithinInterval } from "date-fns";
import { CalendarDays, Users, Moon, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  bookings: Booking[];
  currentMonth: Date;
}

export function StatsCards({ bookings, currentMonth }: StatsCardsProps) {
  const daysInMonth = getDaysInMonth(currentMonth);
  const totalBookings = bookings.length;
  const totalPersons = bookings.reduce((sum, b) => sum + b.persons, 0);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), daysInMonth);

  const nightsSold = bookings.reduce((sum, b) => {
    const from = parseISO(b.from);
    const to = parseISO(b.to);
    const days = eachDayOfInterval({ start: from, end: new Date(to.getTime() - 86400000) });
    return sum + days.filter((d) => isWithinInterval(d, { start: monthStart, end: monthEnd })).length;
  }, 0);

  const occupancy = daysInMonth > 0 ? Math.round((nightsSold / daysInMonth) * 100) : 0;

  const stats = [
    { label: "Prenotazioni", value: totalBookings, icon: CalendarDays, color: "text-primary" },
    { label: "Persone", value: totalPersons, icon: Users, color: "text-primary" },
    { label: "Notti vendute", value: nightsSold, icon: Moon, color: "text-primary" },
    { label: "Occupazione", value: `${occupancy}%`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-lg p-4 shadow-[inset_0_0_0_1px_hsl(var(--border))]"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
