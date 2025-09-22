"use server"
import { category, pyramidCategory, team, position } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getApplicableTeams(pyramidId: number) {
  try {
    const categories = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(pyramidCategory.pyramidId, pyramidId))
      .rightJoin(pyramidCategory, eq(pyramidCategory.categoryId, category.id));
      
    const unpackedCategories = categories
      .map(({ id }) => id)
      .filter((id): id is number => id !== null && id !== undefined);
    if (unpackedCategories.length === 0) return []

    const teams = await db
      .select()
      .from(team)
      .where(inArray(team.categoryId, unpackedCategories));

    return teams
  } catch (error) {
    console.error(error)
  }
}

export async function setTeamInPosition(
  pyramidId: number,
  teamId: number,
  row: number,
  col: number
) {
  try {
    // Check if position already exists
    const existingPosition = await db
      .select()
      .from(position)
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          eq(position.row, row),
          eq(position.col, col)
        )
      )
      .limit(1);

    if (existingPosition.length > 0) {
      // Update existing position
      const result = await db
        .update(position)
        .set({
          teamId,
        })
        .where(eq(position.id, existingPosition[0].id))
        .returning();

      if (result.length === 0) {
        throw new Error("Failed to update position");
      }
    } else {
      // Create new position
      const result = await db
        .insert(position)
        .values({
          pyramidId,
          teamId,
          row,
          col,
        })
        .returning();

      if (result.length === 0) {
        throw new Error("Failed to create position");
      }
    }

    // Revalidate the page to reflect changes
    revalidatePath(`/pyramid/${pyramidId}/positions`);

    return { success: true };
  } catch (error) {
    console.error("Error setting team in position:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

export async function removeTeamFromPosition(
  positionId: number,
  pyramidId?: number
) {
  try {
    const result = await db
      .delete(position)
      .where(eq(position.id, positionId))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Position not found" };
    }

    // Revalidate the page to reflect changes
    if (pyramidId) {
      revalidatePath(`/pyramid/${pyramidId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing team from position:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}