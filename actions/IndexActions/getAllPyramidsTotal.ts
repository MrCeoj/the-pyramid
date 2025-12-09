"use server";
import { db } from "@/lib/drizzle";
import { pyramid } from "@/db/schema";

import { PyramidOption } from "@/actions/IndexActions/types";

export async function getAllPyramidsTotal(): Promise<PyramidOption[]> {
  try {
    const pyramids = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        description: pyramid.description,
      })
      .from(pyramid)
      .orderBy(pyramid.name);

    return pyramids;
  } catch (error) {
    console.error("Hubo un error al conseguir las piramides:", error);
    throw error;
  }
}
