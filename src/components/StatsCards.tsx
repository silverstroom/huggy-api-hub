import { Booking } from "@/types/booking";
import { getDaysInMonth, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";
import { CalendarDays, Users, TrendingUp, BarChart3 } from "lucide-react";
import { it as itLocale } from "date-fns/locale";
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
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, damping: 20, stiffness: 300 } },
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

  // Daily data for sparkline
  const allDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const dailyPersons = allDays.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { date: d, persons: personNightsPerDay.get(key) || 0 };
  });
  const maxDaily = Math.max(...dailyPersons.map((d) => d.persons), 1);

  // Find peak
  let peakIdx = 0;
  dailyPersons.forEach((d, i) => {
    if (d.persons > dailyPersons[peakIdx].persons) peakIdx = i;
  });
  const peakDay = dailyPersons[peakIdx];

  const stats = [
    { label: "Prenotazioni", value: totalBookings, sub: null, icon: CalendarDays },
    { label: "Persone totali", value: totalPersons, sub: null, icon: Users },
    { label: "Occupazione", value: `${occupancy}%`, sub: `${totalPersonNights} presenze-notte`, icon: TrendingUp },
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
          {stat.sub && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
          )}
        </motion.div>
      ))}

      {/* Concentrazione persone - mini chart card */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="bg-card rounded-lg p-4 shadow-[inset_0_0_0_1px_hsl(var(--border))] cursor-default col-span-2 lg:col-span-1"
      >
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Concentrazione
          </span>
        </div>
        <div className="flex items-end gap-[2px] h-10 mt-1">
          {dailyPersons.map((d, i) => {
            const hPct = maxDaily > 0 ? (d.persons / maxDaily) * 100 : 0;
            const isPeak = i === peakIdx && d.persons > 0;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(hPct, d.persons > 0 ? 6 : 0)}%` }}
                transition={{ delay: 0.3 + i * 0.02, type: "spring", damping: 15, stiffness: 200 }}
                className={`flex-1 min-w-[2px] rounded-t ${
                  isPeak
                    ? "bg-primary"
                    : d.persons > maxCapacity
                    ? "bg-destructive/80"
                    : d.persons > 0
                    ? "bg-primary/40"
                    : "bg-muted/40"
                }`}
                title={`${format(d.date, "d MMM", { locale: itLocale })}: ${d.persons} pers.`}
              />
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Picco: <span className="font-semibold text-foreground">{peakDay.persons} pers.</span> · {format(peakDay.date, "d MMM", { locale: itLocale })}
        </p>
      </motion.div>
    </motion.div>
  );
}
