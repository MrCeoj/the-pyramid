import { createSupabaseClient } from "@/lib/supabase";
import { Pyramid } from "@/types";

export async function piramides() {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('piramides').select('*');
    
    if (error) {
        console.error("Error fetching piramides:", error);
        return [];
    }

    return data as Pyramid[]; 
}