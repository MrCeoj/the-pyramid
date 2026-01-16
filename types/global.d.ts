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
  loosingStreak: number;
  lastResult: "up" | "down" | "stayed" | "none";
  player1: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
    email?: string | null;
  } | null;
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
    email?: string | null;
  } | null;
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
 * From IndexActions
 */
type Position = {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
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

/**
 * From ProfileDataActions
 */
type UpdateProfileData = {
  paternalSurname?: string;
  maternalSurname?: string;
  email?: string;
  image?: string;
  nickname?: string;
  avatarUrl?: string;

  // Password fields (optional)
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

/**
 * From ProfileDataActions
 */
type ProfileData = {
  user: {
    paternalSurname: string;
    maternalSurname: string;
    email: string | null;
    role: "player" | "admin";
    fullName: string;
  };
  profile: {
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
};

/**
 * From PyramidActions
 */
type CreatePyramidData = {
  name: string;
  description: string;
  row_amount: number;
  active: boolean;
  categories: number[];
};

/**
 * From PyramidActions
 */
type UpdatePyramidData = {
  name: string;
  description: string;
  row_amount: number;
  active: boolean;
  categories: number[];
};

/**
 * From TeamsActions
 */
type RiskyCheckResult = {
  success: boolean;
  message: string;
  teamsMarkedRisky: number;
  emailsSent: number;
  emailsFailed: number;
  details?: {
    riskyTeams: string[];
    emailResults: unknown[];
  };
};

/**
 * From a random form
 */
type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  needsProfileSetup: boolean;
  needsRegistratino?: boolean;
};

/**
 * From PasswordSetupForm
 */
type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * From HistoryMatchCard
 */
type HistoryMatchCardData = {
  match: MatchWithDetails;
  handleCancelMatch: (matchId: number) => Promise<void>;
  userTeamId: number;
  formatDate: (date: Date) => string;
};

/**
 * From PendingMatchCard
 */
type PendingMatchCardData = {
  match: MatchWithDetails;
  formatDate: (date: Date) => string;
  handleRejectMatch: (matchId: number) => Promise<void>;
  actionLoading: number;
  handleAcceptMatch: (matchId: number) => Promise<void>;
  userTeamId: number;
  rejectedAmount: number;
};

/**
 * From EditPyramidModal
 */

type Pyramid = {
  id: number;
  name: string;
  description: string | null;
  row_amount: number | null;
  active: boolean;
  categories: number[];
  createdAt: Date | null;
  updatedAt: Date | null;
};

type PyramidPosition = {
  id: number;
  row: number;
  col: number;
  team: TeamWithPlayers | null;
};

/**
 * From MailActions/Accept
 */
type MailData = {
  attacker: TeamWithPlayers;
  defender: TeamWithPlayers;
  pyramidId: number;
  handicapPoints?: number;
  reason?: string
}

/**
 * From MailActions/Risky
 */
type RiskyWarningMailData = {
  team: TeamWithPlayers;
  pyramidId: number;
  currentPosition?: number;
  nextRowPosition?: number;
}