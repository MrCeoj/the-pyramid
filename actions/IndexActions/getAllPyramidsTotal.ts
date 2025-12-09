"use server";
import { db } from "@/lib/drizzle";
import { pyramid } from "@/db/schema";
import { desc } from "drizzle-orm"
import { PyramidOption } from "@/actions/IndexActions/types";

export async function getAllPyramidsTotal(): Promise<PyramidOption[]> {
  try {
    const pyramids = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        description: pyramid.description,
        active: pyramid.active
      })
      .from(pyramid)
      .orderBy(desc(pyramid.updatedAt));

    return pyramids;
  } catch (error) {
    console.error("Hubo un error al conseguir las piramides:", error);
    throw error;
  }
}
