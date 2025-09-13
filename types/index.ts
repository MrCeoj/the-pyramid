export interface Category_Pyramid {
  id: number;
  category_id: string;
  pyramid_id: number;
}

export interface Category {
  id: string;
  name: string;
  desc?: number;
}

export enum Match_Status {
  PENDING = "PENDING",
  ACCEPTED = "CONFIRMED",
  DECLINED = "REJECTED",
  COMPLETED = "PLAYED",
}

export interface Match {
  id: number;
  challenger_id: number;
  defender_id: number;
  scheduled_at?: string;
  created_at: string;
  evidence_url?: string;
  winner_id?: number;
  status: Match_Status;
}

export interface Position {
  id: number;
  pyramid_id: number;
  team_id: number;
  row_number: number;
  pos_number: number;
}

export interface Profile {
  id: string;
  created_at: string;
  name: string;
  last_name: string;
  nickname?: string;
  avatar_url?: string;
  team_id?: number;
  supabase_id?: string;
}

export interface Pyramid {
  id: number;
  name: string;
  desc?: string;
  active: boolean;
}

export interface Team {
  id: number;
  name: string;
  category_id: string;
  wins: number;
  looses: number;
}
