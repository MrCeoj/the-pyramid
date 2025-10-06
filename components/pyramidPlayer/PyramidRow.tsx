"use client";
import TeamCard from "@/components/ui/TeamCard";
import EmptySlot from "@/components/ui/EmptySlot";
import { useCenteredScroll } from "@/hooks/useCenteredScroll";
import { useSessionStore } from "@/stores/sessionStore";
import { useState, useCallback } from "react";
import ChallengeModal from "@/components/ui/ChallengeModal";
import { TeamWithPlayers } from "@/actions/PositionActions";

type PyramidPosition = {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
};

type UnresolvedMatch = {
  id: number;
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  status: "pending" | "accepted";
  createdAt: Date;
};

const PyramidRow = ({
  positions,
  allPositions,
  userTeamId,
  pyramidId,
  unresolvedMatches = [],
  className,
  onRefreshNeeded, // Add this prop to trigger parent refresh
}: {
  positions: PyramidPosition[];
  onTeamClick: (team: TeamWithPlayers) => void;
  isFirst?: boolean;
  allPositions: PyramidPosition[];
  userTeamId?: number | null;
  pyramidId: number;
  unresolvedMatches?: UnresolvedMatch[];
  className?: string;
  onRefreshNeeded?: () => void; // Optional callback to refresh parent data
}) => {
  const scrollContainerRef = useCenteredScroll<HTMLDivElement>();
  const { session } = useSessionStore();
  const [challengeModal, setChallengeModal] = useState<{
    isOpen: boolean;
    defenderTeam: TeamWithPlayers | null;
  }>({ isOpen: false, defenderTeam: null });

  // Add a local refresh trigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const hasUnresolvedWith = useCallback((targetTeamId: number | null) => {
    if (!userTeamId || !targetTeamId) return false;
    return unresolvedMatches.some(
      (m) =>
        m.challengerTeamId === userTeamId &&
        m.defenderTeamId === targetTeamId &&
        (m.status === "pending" || m.status === "accepted")
    );
  }, [userTeamId, unresolvedMatches]);

  const handleChallenge = (defenderTeam: TeamWithPlayers) => {
    if (hasUnresolvedWith(defenderTeam.id)) {
      return;
    }

    setChallengeModal({
      isOpen: true,
      defenderTeam,
    });
  };

  const handleCloseModal = useCallback(() => {
    setChallengeModal({
      isOpen: false,
      defenderTeam: null,
    });
    
    // Option 2: Trigger parent refresh if callback provided
    if (onRefreshNeeded) {
      onRefreshNeeded();
    }
    
    setTimeout(() => {
      // Small delay to ensure any server updates are complete
      setRefreshTrigger(prev => prev + 1);
    }, 100);
  }, [onRefreshNeeded]);

  const isChallengable = useCallback((targetPos: PyramidPosition): boolean => {
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
    // Block if user already has an unresolved match vs this target
    if (hasUnresolvedWith(targetPos.team.id)) return false;

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
  }, [session?.user.role, userTeamId, allPositions, hasUnresolvedWith]);

  return (
    <div
      ref={scrollContainerRef}
      className="h-auto overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth max-w-screen z-10"
    >
      <div className={className}>
        {positions.map((pos) =>
          pos.team ? (
            <TeamCard
              key={`${pos.id}-${refreshTrigger}`} // Force re-render when refresh trigger changes
              data={pos}
              challengable={isChallengable(pos)}
              isPlayer={pos.team.id === userTeamId}
              defended={true}
              isTop={pos.row === 1}
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