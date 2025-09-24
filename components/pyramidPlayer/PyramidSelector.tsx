"use client";
import { useState, useEffect } from "react";
import PyramidDisplay from "./PyramidDisplay";
import { PyramidData } from "@/actions/IndexActions";

type Pyramid = {
  id: number;
  name: string;
};

export default function PyramidSelector({ pyramids }: { pyramids: Pyramid[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pyramidData, setPyramidData] = useState<PyramidData | null>(null);

  useEffect(() => {
    if (selectedId) {
      (async () => {
        const res = await fetch(`/api/pyramids/${selectedId}`);
        const data = await res.json();
        setPyramidData(data);
      })();
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col gap-4 items-center">
      <select
        className="border p-2 rounded"
        value={selectedId ?? ""}
        onChange={(e) => setSelectedId(Number(e.target.value))}
      >
        <option value="">Select a pyramid</option>
        {pyramids.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {pyramidData ? <PyramidDisplay data={pyramidData} /> : null}
    </div>
  );
}
