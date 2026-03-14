import { CalendarDays, List, Search, X } from "lucide-react";
import { ViewMode } from "@/types/booking";
import { motion } from "framer-motion";

interface LiquidGlassNavProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
}

export function LiquidGlassNav({
  viewMode,
  setViewMode,
  showSearch,
  setShowSearch,
}: LiquidGlassNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe">
      <div className="mx-3 mb-3">
        <div className="glass-surface rounded-[22px] px-2 py-2">
          <div className="flex items-center justify-around">
            <NavButton
              active={viewMode === "calendar" && !showSearch}
              onClick={() => { setViewMode("calendar"); setShowSearch(false); }}
              icon={<CalendarDays className="w-5 h-5" />}
              label="Calendario"
            />
            <NavButton
              active={viewMode === "list" && !showSearch}
              onClick={() => { setViewMode("list"); setShowSearch(false); }}
              icon={<List className="w-5 h-5" />}
              label="Lista"
            />
            <NavButton
              active={showSearch}
              onClick={() => setShowSearch(!showSearch)}
              icon={showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              label={showSearch ? "Chiudi" : "Cerca"}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-2xl transition-all duration-200"
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
    </button>
  );
}
