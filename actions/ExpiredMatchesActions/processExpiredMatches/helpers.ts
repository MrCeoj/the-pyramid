import { match } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { DbTransaction } from "@/actions/matches/types";

export function getNextPosition(
  currentPos: { row: number; col: number },
  rowAmount: number
): { row: number; col: number } | null {
  const { row, col } = currentPos;

  if (row < 1 || col < 1 || rowAmount < 1 || col > row || row > rowAmount) {
    return null;
  }

  if (row === rowAmount && col === row) {
    return null;
  }

  if (col < row) {
    return { row, col: col + 1 };
  }

  if (row < rowAmount) {
    return { row: row + 1, col: 1 };
  }

  return null;
}

export async function cancelExpiredMatches(
  tx: DbTransaction,
  expiredIds: number[]
) {
  if (expiredIds.length === 0) return
  await tx
    .update(match)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(inArray(match.id, expiredIds));
}

