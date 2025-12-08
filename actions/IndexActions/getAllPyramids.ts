"use server";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { pyramid } from "@/db/schema";

import { PyramidOption } from "@/actions/IndexActions/types";

export async function getAllPyramids(): Promise<PyramidOption[]> {
  try {
    const pyramids = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        description: pyramid.description,
      })
      .from(pyramid)
      .where(eq(pyramid.active, true))
      .orderBy(pyramid.name);

    return pyramids;
  } catch (error) {
    console.error("Error fetching pyramids:", error);
    return [];
  }
}
