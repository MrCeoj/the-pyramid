import { Match_Status } from "./Match_Status";

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