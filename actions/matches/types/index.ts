import { TeamWithPlayers } from "@/actions/PositionActions";

export type MatchWithDetails = {
  id: number;
  status: "pending" | "accepted" | "played" | "rejected" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  pyramidId: number;
  pyramidName: string;
  challengerTeam: TeamWithPlayers;
  defenderTeam: TeamWithPlayers;
  winnerTeam?: TeamWithPlayers | null;
  evidenceUrl?: string | null;
};

export type UnresolvedMatch = {
  id: number;
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  status: "pending" | "accepted";
  createdAt: Date;
};

export type AcceptedMatchWithDetails = {
  id: number;
  pyramidId: number;
  pyramidName: string;
  challengerTeam: TeamWithPlayers & {
    currentRow: number;
    currentCol: number;
  };
  defenderTeam: TeamWithPlayers & {
    currentRow: number;
    currentCol: number;
  };
  createdAt: Date;
};

export type MatchResult = {
  success: boolean;
  message: string;
};

export type MatchCompletionResult = {
  success: boolean;
  message: string;
};
