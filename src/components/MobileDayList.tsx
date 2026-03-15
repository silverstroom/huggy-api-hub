import { Booking } from "@/types/booking";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getBookingColor } from "@/lib/bookingColors";
import { useState } from "react";
import { BookingDetailPanel } from "./BookingDetailPanel";
import { motion } from "framer-motion";

interface MobileDayListProps {
  bookings: Booking[];
  currentMonth: Date;
}

const dayVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function MobileDayList({ bookings, currentMonth }: MobileDayListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  const getBookingsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return bookings.filter((b) => dayStr >= b.from && dayStr < b.to);
  };

  let visibleIdx = 0;

  return (
    <>
      <div className="space-y-2 pb-24">
        {days.map((day) => {
          const dayBookings = getBookingsForDay(day);
          if (dayBookings.length === 0) return null;
          const currentIdx = visibleIdx++;
          return (
            <motion.div
              key={day.toISOString()}
              variants={dayVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: currentIdx * 0.05, type: "spring", damping: 20, stiffness: 300 }}
            >
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-1 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {format(day, "EEEE d MMMM", { locale: it })}
                </span>
              </div>
              <div className="space-y-1.5">
                {dayBookings.map((booking, i) => {
                  const colorIdx = bookings.indexOf(booking);
                  const color = getBookingColor(colorIdx);
                  return (
                    <motion.button
                      key={`${booking.booking_id}-${day.toISOString()}`}
                      variants={cardVariants}
                      initial="hidden"
                      animate="show"
                      transition={{ delay: currentIdx * 0.05 + (i + 1) * 0.03, type: "spring", damping: 22 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left ${color.bg} rounded-xl px-3 py-2.5 transition-shadow hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${color.text}`}>
                          {booking.customer.name}
                        </span>
                        <span className={`text-xs ${color.text} opacity-70`}>
                          {booking.persons}p
                        </span>
                      </div>
                      <span className={`text-xs ${color.text} opacity-60`}>
                        {format(parseISO(booking.from), "d MMM", { locale: it })} → {format(parseISO(booking.to), "d MMM", { locale: it })}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
      <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </>
  );
}
