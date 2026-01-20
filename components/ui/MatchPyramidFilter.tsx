"use client";
import { useAdminMatchesStore } from "@/stores/useAdminMatchesStore";

const MatchPyramidFilter = () => {
  const { pyramids, selectedPyramid, setSelectedPyramid } =
    useAdminMatchesStore();

  if (!pyramids.length) return null;

  return (
    <div className="flex gap-2 items-center">
      <label className="text-white">Pirámide:</label>
      <select
        value={selectedPyramid?.id ?? ""}
        onChange={(e) => {
          const pyramid = pyramids.find((p) => p.id === Number(e.target.value));
          if (pyramid) setSelectedPyramid(pyramid);
        }}
        className="bg-indor-black border border-slate-600 text-white rounded px-2 py-1 text-ellipsis max-w-56 sm:max-w-full"
      >
        {pyramids.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MatchPyramidFilter;
