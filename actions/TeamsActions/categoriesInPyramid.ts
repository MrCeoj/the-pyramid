"use server";
import { position, team } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { DbTransaction } from "@/types/custom";

type getCategoriesInPyramidProps =
  | { success: true; cats: number[] }
  | { success: false; error: any };

/**
 * Retrieves all unique categories associated with teams in a given pyramid.
 * 
 * @param pyramidId - The ID of the pyramid to query
 * @returns A promise that resolves to an object containing:
 *   - `success`: boolean indicating if the operation was successful
 *   - `cats`: array of category IDs found in the pyramid (empty array if no teams exist)
 *   - `error`: error object if the operation failed
 * 
 * @example
 * const result = await getCategoriesInPyramid(1);
 * if (result.success) {
 *   console.log(result.cats); // [1, 2, 3]
 * }
 */
export default async function getCategoriesInPyramid(
  pyramidId: number,
  tx: DbTransaction
): Promise<getCategoriesInPyramidProps> {
  try {
    const teamIdsInPyramid = await tx
      .select({ teamId: position.teamId })
      .from(position)
      .where(eq(position.pyramidId, pyramidId));

    const teamIds = teamIdsInPyramid.map((t) => t.teamId);

    if (!teamIds.length) return { success: true, cats: [] };

    const catsInPyramid = await tx
      .select({ categoryId: team.categoryId })
      .from(team)
      .where(inArray(team.id, teamIds));

    const cats = [...new Set(catsInPyramid.map((c) => c.categoryId!))];

    return { success: true, cats: cats };
  } catch (error) {
    return { success: false, error: error };
  }
}
