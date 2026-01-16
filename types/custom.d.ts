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