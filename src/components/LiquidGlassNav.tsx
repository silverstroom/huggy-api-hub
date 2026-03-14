import { CalendarDays, List, Search, Filter } from "lucide-react";
import { BookingStatus, ViewMode } from "@/types/booking";
import { motion } from "framer-motion";

interface LiquidGlassNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  statusFilter: BookingStatus;
  setStatusFilter: (status: BookingStatus) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
}

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "all", label: "Tutte" },
  { value: "paid", label: "Pagate" },
  { value: "pending", label: "Attesa" },
  { value: "cancelled", label: "Annull." },
];

export function LiquidGlassNav({
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  showSearch,
  setShowSearch,
}: LiquidGlassNavProps) {
  return (
    <>
      {/* Search overlay */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-4 right-4 z-50 lg:hidden"
        >
          <div className="glass-surface rounded-2xl p-3">
            <input
              type="text"
              placeholder="Cerca cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </motion.div>
      )}

      {/* Status filter pills overlay */}

      {/* Bottom navbar - liquid glass */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe">
        <div className="mx-3 mb-3">
          <div className="glass-surface rounded-[22px] px-2 py-2">
            <div className="flex items-center justify-around">
              {/* Calendar view */}
              <NavButton
                active={viewMode === "calendar"}
                onClick={() => setViewMode("calendar")}
                icon={<CalendarDays className="w-5 h-5" />}
                label="Calendario"
              />

              {/* List view */}
              <NavButton
                active={viewMode === "list"}
                onClick={() => setViewMode("list")}
                icon={<List className="w-5 h-5" />}
                label="Lista"
              />

              {/* Search */}
              <NavButton
                active={showSearch}
                onClick={() => setShowSearch(!showSearch)}
                icon={<Search className="w-5 h-5" />}
                label="Cerca"
              />

              {/* Filter - cycles through statuses */}
              <NavButton
                active={statusFilter !== "all"}
                onClick={() => {
                  const idx = STATUS_OPTIONS.findIndex((o) => o.value === statusFilter);
                  const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
                  setStatusFilter(next.value);
                }}
                icon={<Filter className="w-5 h-5" />}
                label={STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || "Filtro"}
                badge={statusFilter !== "all"}
              />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200"
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 bg-primary/10 rounded-2xl"
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        />
      )}
      <span className={`relative z-10 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
      </span>
      <span
        className={`relative z-10 text-[10px] font-medium transition-colors ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      {badge && (
        <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </button>
  );
}
