import { Booking } from "@/types/booking";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getBookingColor } from "@/lib/bookingColors";
import { useState } from "react";
import { BookingDetailPanel } from "./BookingDetailPanel";
import { motion } from "framer-motion";

interface BookingListViewProps {
  bookings: Booking[];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string; label: string }> = {
    paid: { cls: "bg-success/10 text-success", label: "Pagata" },
    pending: { cls: "bg-warning/10 text-warning", label: "In attesa" },
    cancelled: { cls: "bg-destructive/10 text-destructive", label: "Cancellata" },
  };
  const c = config[status] || config.pending;
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function BookingListView({ bookings }: BookingListViewProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  if (bookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-lg shadow-[inset_0_0_0_1px_hsl(var(--border))] p-8 text-center text-muted-foreground"
      >
        Nessuna prenotazione trovata.
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-card rounded-lg shadow-[inset_0_0_0_1px_hsl(var(--border))] overflow-hidden"
      >
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2 border-b border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliente</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Check-in</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Check-out</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Persone</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stato</span>
        </div>
        {bookings.map((booking, i) => {
          const color = getBookingColor(i);
          return (
            <motion.div
              key={booking.booking_id}
              variants={rowVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: i * 0.04, type: "spring", damping: 22 }}
              whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)", x: 2 }}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-border last:border-b-0
                cursor-pointer transition-colors items-center"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                <span className="text-sm font-medium text-foreground">{booking.customer.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(parseISO(booking.from), "d MMM", { locale: it })}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(parseISO(booking.to), "d MMM", { locale: it })}
              </span>
              <span className="text-sm text-muted-foreground text-center">{booking.persons}</span>
              <StatusBadge status={booking.status} />
            </motion.div>
          );
        })}
      </motion.div>
      <BookingDetailPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </>
  );
}
