import { category } from "@/db/schema"
import { db } from "@/lib/drizzle"

export async function getCategories(){
    try{
        return await db.select().from(category)
    }catch(error){
        console.log(error)
    }
}