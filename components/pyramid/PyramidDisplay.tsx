"use client";
import React, { useEffect, useState } from "react";
import PyramidRow from "./PyramidRow";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";

type Team = {
  id: number;
  name: string;
  wins: number;
  losses: number;
  status: string;
};

type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

export type PyramidData = {
  positions: Position[];
  row_amount: number;
  pyramid_id?: number;
  pyramid_name?: string;
};

const PyramidDisplay: React.FC<{ data: PyramidData }> = ({ data }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const getSesh = async () => {
    const sesh = await getSession();
    setSession(sesh);
  };

  useEffect(() => {
    getSesh();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setUserRole(session.user.role || "player");
    }
  }, [session]);

  const isMobile = useIsMobile();

  // Data processing logic remains unchanged
  const rows: { [key: number]: Position[] } = {};
  data.positions.forEach((pos) => {
    if (!rows[pos.row]) rows[pos.row] = [];
    rows[pos.row].push(pos);
  });

  const filledRows: { [key: number]: Position[] } = {};
  for (let row = 1; row <= data.row_amount; row++) {
    const expectedCols = row + 1;
    const existing = rows[row] ?? [];
    const filled: Position[] = [];

    for (let col = 1; col < expectedCols; col++) {
      const match = existing.find((p) => p.col === col);
      if (match) {
        filled.push(match);
      } else {
        filled.push({
          id: -1 * (row * 100 + col),
          row,
          col,
          team: null,
        });
      }
    }
    filledRows[row] = filled;
  }

  return (
    <div className="flex flex-col items-center relative mb-5">
      {/* Logo Display */}
      {isMobile ? (
        <Image
          src={"/piramide_logo_title_naranja.svg"}
          alt="Logo"
          width={200}
          height={100}
          className="static drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
        />
      ) : (
        <div className="max-w-1/4 w-[16rem] h-[8rem] lg:w-[400px] lg:h-[160px] absolute left-2">
          <Image
            src={"/piramide_logo_title_naranja.svg"}
            alt="Logo"
            fill
            objectFit="cover"
            className="drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
          />
        </div>
      )}
      {/* Pyramid Structure */}
      <div className="flex flex-col items-center">
        {Object.keys(filledRows)
          .sort((a, b) => Number(a) - Number(b))
          .map((rowKey) => {
            const rowPositions = filledRows[Number(rowKey)];

            return (
              <PyramidRow
                key={rowKey}
                positions={rowPositions}
                onTeamClick={() => {}}
              />
            );
          })}
      </div>
    </div>
  );
};

export default PyramidDisplay;
