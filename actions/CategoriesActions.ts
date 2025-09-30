import { category } from "@/db/schema"
import { db } from "@/lib/drizzle"

export async function getCategories(){
    try{
        return await db.select().from(category)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }catch(error){
    }
}