type MatchStatus = "pending" | "accepted" | "played" | "rejected" | "cancelled";
type TeamStatus = "winner" | "looser" | "idle" | "risky";
type TeamLastResult = "up" | "down" | "stayed" | "none";

/**
 * From PositionActions, the most descriptive TeamWithPlayers type
 */
type TeamWithPlayers = {
  id: number;
  displayName: string;
  wins: number;
  losses: number;
  status: TeamStatus;
  categoryId: number | null;
  categoryName: string | null;
  defendable?: boolean;
  loosingStreak: number;
  lastResult: TeamLastResult;
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
  status: MatchStatus;
  createdAt: Date;
  updatedAt: Date;
  pyramidId: number;
  pyramidName: string;
  challengerTeam: TeamWithPlayers & {
    currentRow?: number | null;
    currentCol?: number | null;
  };
  defenderTeam: TeamWithPlayers & {
    currentRow?: number | null;
    currentCol?: number | null;
  };
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
  reason?: string;
};

/**
 * From MailActions/Risky
 */
type RiskyWarningMailData = {
  team: TeamWithPlayers;
  pyramidId: number;
  currentPosition?: number;
  nextRowPosition?: number;
};

/**
 * From LoginActions
 */

type CreateProfileData = {
  userId: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl?: string | null;
  password?: string;
};

type CreateAdminPasswordData = {
  userId: string;
  password: string;
};
type UserWithProfile = {
  id: string;
  email: string | null;
  paternalSurname: string;
  maternalSurname: string;
  fullName: string;
  displayName: string;
  role: "player" | "admin";
  profile: {
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
};

type CreateUserData = {
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  role: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
  };
};

type NewUserData = {
  paternalSurname: string;
  maternalSurname: string;
  password: string;
  email: string;
  role: string;
  nickname?: string;
};

type UpdateUserData = {
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  role: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
  };
};

type Category = { id: number; name: string };

type Player = {
  id: string;
  name: string | null;
  paternalSurname: string | null;
  nickname: string | null;
  email: string | null;
};

/**
 * Represents a date filter configuration for querying data by date.
 *
 * @property {"day" | "range" | null} mode - The filtering mode: "day" for a specific date, "range" for a date range, or null for no filter
 * @property {string | null} day - A specific date in YYYY-MM-DD format when mode is "day"
 * @property {string | null} from - The start date in YYYY-MM-DD format when mode is "range"
 * @property {string | null} to - The end date in YYYY-MM-DD format when mode is "range"
 */
type DateFilter = {
  mode: "day" | "range" | null;
  day: string | null;
  from: string | null;
  to: string | null;
};

type MatchStatusMap = Record<MatchStatus, string>;
