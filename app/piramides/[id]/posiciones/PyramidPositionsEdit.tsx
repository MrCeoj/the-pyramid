"use client";
import React, { useState } from "react";
import PyramidRow from "./PyramidRowEdit";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  setTeamInPosition,
  getApplicableTeams,
  TeamWithPlayers
} from "@/actions/PositionActions";
import toast from "react-hot-toast";
import SetTeamModal from "./SetTeamModal";
import { PyramidData } from "@/actions/IndexActions";


interface PyramidPosition {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
}

interface SelectedPosition {
  pyramidId: number;
  row: number;
  col: number;
}

export default function PyramidDisplay({ data }: { data: PyramidData }) {
  const [applicableTeams, setApplicableTeams] = useState<TeamWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] =
    useState<SelectedPosition | null>(null);

  const fetchApplicableTeams = async () => {
    setIsLoading(true);
    try {
      const teams = await getApplicableTeams(data.pyramid_id!);
      if (teams) {
        if (!data.positions) return;
        const existingInPyramid = data.positions.map(({ team }) => team?.id);

        const filteredTeams = teams.filter(
          (team) => !existingInPyramid.includes(team.id)
        );
        console.log("filtered",filteredTeams)

        setApplicableTeams(filteredTeams);
      }
    } catch (error) {
      console.error("Error fetching applicable teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetTeam = (position: PyramidPosition) => {
    setSelectedPosition({
      pyramidId: data.pyramid_id!,
      row: position.row,
      col: position.col,
    });
    fetchApplicableTeams();
    setIsModalOpen(true);
  };

  const isMobile = useIsMobile();


  const rows: { [key: number]: PyramidPosition[] } = {};
  data.positions.forEach((pos) => {
    if (!rows[pos.row]) rows[pos.row] = [];
  
    const pyramidPos: PyramidPosition = {
      id: pos.id,
      row: pos.row,
      col: pos.col,
      team: pos.team as TeamWithPlayers | null,
    };
    rows[pos.row].push(pyramidPos);
  });

  const handleTeamSelect = async (team: TeamWithPlayers) => {
    if (!selectedPosition) return;

    setIsLoading(true);
    try {
      const result = await setTeamInPosition(
        selectedPosition.pyramidId,
        team.id,
        selectedPosition.row,
        selectedPosition.col
      );

      if (!result.success) {
        throw new Error(result.error || "Error desconocido");
      }
      setIsModalOpen(false);
      setSelectedPosition(null);
      setApplicableTeams([]);
    } catch (error) {
      if (error instanceof Error) toast.error("Error al posicionar equipo: "+error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPosition(null);
    setApplicableTeams([]);
  };

  const filledRows: { [key: number]: PyramidPosition[] } = {};
  for (let row = 1; row <= data.row_amount; row++) {
    const expectedCols = row + 1;
    const existing = rows[row] ?? [];
    const filled: PyramidPosition[] = [];

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
    <div className="flex flex-col items-center relative mb-5 no-scrollbar">
      
      {isMobile ? (
        <Image
          src={"/piramide_logo_title_naranja.svg"}
          alt="Logo"
          width={200}
          height={120}
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
      
      <div className="flex flex-col items-center mb-5">
        {Object.keys(filledRows)
          .sort((a, b) => Number(a) - Number(b))
          .map((rowKey, index, array) => {
            const rowPositions = filledRows[Number(rowKey)];
            const isFirst = index === 0;
            const isLast = index === array.length - 1;

            return (
              <PyramidRow
                pyramidId={data.pyramid_id!}
                key={rowKey}
                handleSetTeam={handleSetTeam}
                positions={rowPositions}
                onTeamClick={() => {}}
                isFirst={isFirst}
                isLast={isLast}
              />
            );
          })}
      </div>

      {/* Modal */}
      <SetTeamModal
        isOpen={isModalOpen}
        onClose={closeModal}
        teams={applicableTeams}
        pyramidId={data.pyramid_id!}
        rowNumber={selectedPosition?.row || 0}
        posNumber={selectedPosition?.col || 0}
        onTeamSelect={handleTeamSelect}
        isLoading={isLoading}
      />
    </div>
  );
}