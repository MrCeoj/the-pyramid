"use client";
import TeamCard from "@/components/ui/TeamCard";
import EmptySlot from "@/components/ui/EmptySlot";
import { useCenteredScroll } from "@/hooks/useCenteredScroll";
import { useSessionStore } from "@/stores/sessionStore";
import { useState } from "react";
import ChallengeModal from "@/components/ui/ChallengeModal";

type Team = {
  id: number;
  name: string | null;
  wins: number | null;
  status: "winner" | "idle" | "looser" | "risky";
  losses: number | null;
  categoryId: number | null;
};

type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

const PyramidRow = ({
  positions,
  isFirst = false,
  isLast = false,
  allPositions,
  userTeamId,
  pyramidId,
}: {
  positions: Position[];
  onTeamClick: (team: Team) => void;
  isFirst?: boolean;
  isLast?: boolean;
  allPositions: Position[];
  userTeamId?: number | null;
  pyramidId: number;
}) => {
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();
  const { session } = useSessionStore();
  const [challengeModal, setChallengeModal] = useState<{
    isOpen: boolean;
    defenderTeam: Team | null;
  }>({ isOpen: false, defenderTeam: null });

  const isChallengable = (targetPos: Position): boolean => {
    // Admins cannot challenge
    if (session?.user.role === "admin") return false;

    // Target must have a team
    if (!targetPos.team) return false;

    // User must have a team
    if (!userTeamId) return false;

    // Find user's current position in the pyramid
    const userTeamPosition = allPositions.find(
      (pos) => pos.team && pos.team.id === userTeamId
    );

    if (!userTeamPosition) return false;

    const userRow = userTeamPosition.row;
    const userCol = userTeamPosition.col;
    const targetRow = targetPos.row;
    const targetCol = targetPos.col;

    // Cannot challenge yourself
    if (userRow === targetRow && userCol === targetCol) return false;

    // If user is in top row (row 1), cannot challenge anyone
    if (userRow === 1) return false;

    // Same row challenge: can challenge teams with lower column numbers (to the left)
    if (userRow === targetRow) {
      return targetCol < userCol;
    }

    if (targetRow === userRow - 1) return true;

    // If user is in leftmost position (col 1), can challenge entire row above
    if (userCol === 1 && targetRow === userRow - 1) {
      return true;
    }

    // No other challenges allowed
    return false;
  };

  const handleChallenge = (defenderTeam: Team) => {
    setChallengeModal({
      isOpen: true,
      defenderTeam,
    });
  };

  const handleCloseModal = () => {
    setChallengeModal({
      isOpen: false,
      defenderTeam: null,
    });
  };

  // Dynamic class names based on position
  const borderClasses = `
    border-l-2 border-r-2 border-slate-500 border-dashed
    ${isFirst ? "border-t-2 rounded-t-2xl" : ""}
    ${isLast ? "border-b-2 rounded-b-2xl" : ""}
    ${!isFirst && !isLast ? "border-t-2" : ""}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div
      ref={scrollContainerRef}
      className="h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth max-w-screen z-10"
    >
      <div
        className={`flex gap-4 p-4 justify-start min-w-max overflow-x-scroll scroll-smooth no-scrollbar rounded-t-2xl border-t-2 bg-indor-black/90 items-center snap-x ${borderClasses}`}
      >
        {positions.map((pos) =>
          pos.team ? (
            <TeamCard
              key={pos.id}
              data={pos}
              challengable={isChallengable(pos)}
              onChallenge={(team) => handleChallenge(team)}
            />
          ) : (
            <EmptySlot key={pos.id} rowNumber={pos.row} posNumber={pos.col} />
          )
        )}
      </div>
      <ChallengeModal
        isOpen={challengeModal.isOpen}
        attacker={
          allPositions.find((p) => p.team?.id === userTeamId)?.team ?? null
        }
        defender={challengeModal.defenderTeam}
        pyramidId={pyramidId}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PyramidRow;
