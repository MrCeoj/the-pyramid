"use client";
import {
  CheckCircle,
  ClipboardClock,
  Trophy,
  XCircle,
  Ban,
} from "lucide-react";
import { useAdminMatchesStore } from "@/stores/useAdminMatchesStore";

const MatchStatusFilter = () => {
  const { statusFilter, toggleStatusFilter } = useAdminMatchesStore();
  const STATUS_OPTIONS: {
    value: MatchStatus;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "pending",
      label: "Pendientes",
      icon: <ClipboardClock size={16} />,
    },
    { value: "accepted", label: "Aceptadas", icon: <CheckCircle size={16} /> },
    { value: "played", label: "Jugadas", icon: <Trophy size={16} /> },
    { value: "rejected", label: "Rechazadas", icon: <XCircle size={16} /> },
    { value: "cancelled", label: "Canceladas", icon: <Ban size={16} /> },
  ];
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {STATUS_OPTIONS.map(({ value, label, icon }) => {
        const active = statusFilter.includes(value);

        return (
          <button
            key={value}
            onClick={() => toggleStatusFilter(value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
              transition-all border
              ${
                active
                  ? "bg-indor-orange text-white border-indor-orange"
                  : "bg-transparent text-slate-300 border-slate-600 hover:border-slate-400"
              }
            `}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default MatchStatusFilter;
