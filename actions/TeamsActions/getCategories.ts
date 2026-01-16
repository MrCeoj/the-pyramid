"use server"
import { category } from "@/db/schema";
import { db } from "@/lib/drizzle";

/**
 * Fetches all categories.
 */
export async function getCategories() {
  try {
    const categories = await db.select().from(category);
    return categories.sort((a, b) => {
      return a.id - b.id;
    });
  } catch (error) {
    console.error("Failed to get categories:", error);
    throw new Error("Could not fetch categories.");
  }
}