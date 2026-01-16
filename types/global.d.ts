/**
 * From PositionActions, the most descriptive TeamWithPlayers type
 */
type TeamWithPlayers = {
  id: number;
  displayName: string;
  wins: number;
  losses: number;
  status: "winner" | "looser" | "idle" | "risky";
  categoryId: number | null;
  defendable?: boolean;
  loosingStreak?: number;
  lastResult: "up" | "down" | "stayed" | "none";
  player1: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
    email?: string | null;
  };
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
    email?: string | null;
  };
};

/**
 *
 */
type MatchWithDetails = {
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

/**
 * 
 */
type UnresolvedMatch = {
  id: number;
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  status: "pending" | "accepted";
  createdAt: Date;
};

/**
 * 
 */
type AcceptedMatchWithDetails = {
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

/**
 * 
 */
type MatchResult = {
  success: boolean;
  message: string;
};

/**
 * 
 */
type MatchCompletionResult = {
  success: boolean;
  message: string;
};

/**
 * From IndexActions, it has tons of data, potentially conflicting with other declarations
 */
type Team = {
  id: number;
  displayName: string;
  wins: number;
  losses: number;
  status: "winner" | "looser" | "idle" | "risky";
  categoryId: number | null;
  defendable?: boolean;
  loosingStreak: number;
  lastResult: "up" | "down" | "stayed" | "none";
  player1: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  } | null;
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  } | null;
};

/**
 * From IndexActions
 */
type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

/**
 * From IndexActions
 */
type PyramidData = {
  positions: Position[];
  row_amount: number;
  pyramid_id: number;
  pyramid_name: string;
  description: string | null;
  active: boolean;
  teamId?: number;
};

/**
 * From IndexActions
 */
type PyramidOption = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  teamId?: number;
};
