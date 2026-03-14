import { Booking } from "@/types/booking";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { X, Mail, Calendar, Moon, Users, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BookingDetailPanelProps {
  booking: Booking | null;
  onClose: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; label: string }> = {
    paid: { bg: "bg-success text-success-foreground", label: "Pagata" },
    pending: { bg: "bg-warning text-warning-foreground", label: "In attesa" },
    cancelled: { bg: "bg-destructive text-destructive-foreground", label: "Cancellata" },
  };
  const c = config[status] || config.pending;
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.bg}`}>{c.label}</span>;
}

export function BookingDetailPanel({ booking, onClose }: BookingDetailPanelProps) {
  return (
    <AnimatePresence>
      {booking && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card z-50 shadow-xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Dettaglio prenotazione</h2>
              <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xl font-semibold text-foreground">{booking.customer.name}</p>
                <a
                  href={`mailto:${booking.customer.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {booking.customer.email}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={booking.status} />
                <span className="text-xs text-muted-foreground">#{booking.booking_id}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={Calendar}
                  label="Check-in"
                  value={format(parseISO(booking.from), "d MMM yyyy", { locale: it })}
                />
                <InfoItem
                  icon={Calendar}
                  label="Check-out"
                  value={format(parseISO(booking.to), "d MMM yyyy", { locale: it })}
                />
                <InfoItem icon={Moon} label="Notti" value={String(booking.duration_days)} />
                <InfoItem icon={Users} label="Persone" value={String(booking.persons)} />
              </div>

              <div className="pt-3 border-t border-border">
                <InfoItem
                  icon={Clock}
                  label="Data prenotazione"
                  value={format(new Date(booking.booked_at), "d MMM yyyy, HH:mm", { locale: it })}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
