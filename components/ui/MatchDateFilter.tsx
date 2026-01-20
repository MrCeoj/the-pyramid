"use client";
import { useAdminMatchesStore } from "@/stores/useAdminMatchesStore";

const MatchDateFilter = () => {
  const { dateFilter, setRangeFilter, clearDateFilter } =
    useAdminMatchesStore();

  return (
    <div className="flex flex-col gap-2 w-fit">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <label className="text-white">Desde:</label>
          <input
            type="date"
            value={dateFilter.from ?? ""}
            onChange={(e) =>
              setRangeFilter(e.target.value || null, dateFilter.to)
            }
            className="bg-indor-black border border-slate-600 text-white rounded px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-white">Hasta:</label>
          <input
            type="date"
            value={dateFilter.to ?? ""}
            onChange={(e) =>
              setRangeFilter(dateFilter.from, e.target.value || null)
            }
            className="bg-indor-black border border-slate-600 text-white rounded px-2 py-1"
          />
        </div>
      </div>
      <button
        onClick={clearDateFilter}
        className="self-end text-sm text-slate-300 hover:cursor-pointer hover:text-slate-400"
      >
        Limpiar
      </button>
    </div>
  );
};

export default MatchDateFilter;
