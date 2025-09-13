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