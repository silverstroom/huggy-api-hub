import { Booking } from "@/types/booking";
import { getDaysInMonth, parseISO, eachDayOfInterval, isWithinInterval, format } from "date-fns";
import { CalendarDays, Users, Moon, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  bookings: Booking[];
  currentMonth: Date;
  maxCapacity: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 20, stiffness: 300 } },
};

export function StatsCards({ bookings, currentMonth, maxCapacity }: StatsCardsProps) {
  const daysInMonth = getDaysInMonth(currentMonth);
  const totalBookings = bookings.length;
  const totalPersons = bookings.reduce((sum, b) => sum + b.persons, 0);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), daysInMonth);

  const personNightsPerDay = new Map<string, number>();
  bookings.forEach((b) => {
    const from = parseISO(b.from);
    const to = parseISO(b.to);
    const nights = eachDayOfInterval({ start: from, end: new Date(to.getTime() - 86400000) });
    nights.forEach((d) => {
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) {
        const key = format(d, "yyyy-MM-dd");
        personNightsPerDay.set(key, (personNightsPerDay.get(key) || 0) + b.persons);
      }
    });
  });

  const totalPersonNights = Array.from(personNightsPerDay.values()).reduce((a, b) => a + b, 0);
  const maxPersonNights = maxCapacity * daysInMonth;
  const occupancy = maxPersonNights > 0 ? Math.round((totalPersonNights / maxPersonNights) * 100) : 0;

  const stats = [
    { label: "Prenotazioni", value: totalBookings, icon: CalendarDays },
    { label: "Persone", value: totalPersons, icon: Users },
    { label: "Persone-notte", value: totalPersonNights, icon: Moon },
    { label: "Occupazione", value: `${occupancy}%`, icon: TrendingUp },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={item}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="bg-card rounded-lg p-4 shadow-[inset_0_0_0_1px_hsl(var(--border))] cursor-default"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <motion.p
            className="text-2xl font-semibold text-foreground"
            key={String(stat.value)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {stat.value}
          </motion.p>
        </motion.div>
      ))}
    </motion.div>
  );
}
