"use server";
import { db } from "@/lib/drizzle";
import { eq, and } from "drizzle-orm";
import { match, pyramid, position } from "@/db/schema";
import { AcceptedMatchWithDetails } from "@/actions/matches/types";
import { getTeamWithPlayers } from "@/actions/matches/TeamService";

export async function getAcceptedMatches(): Promise<
  AcceptedMatchWithDetails[]
> {
  try {
    const acceptedMatches = await db
      .select({
        id: match.id,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        createdAt: match.createdAt,
        pyramidName: pyramid.name,
      })
      .from(match)
      .innerJoin(pyramid, eq(match.pyramidId, pyramid.id))
      .where(eq(match.status, "accepted"));

    const matchesWithDetails: AcceptedMatchWithDetails[] = await Promise.all(
      acceptedMatches.map(async (m) => {
        const [challengerTeam, defenderTeam, challengerPos, defenderPos] =
          await Promise.all([
            getTeamWithPlayers(m.challengerTeamId),
            getTeamWithPlayers(m.defenderTeamId),
            db
              .select({ row: position.row, col: position.col })
              .from(position)
              .where(
                and(
                  eq(position.teamId, m.challengerTeamId),
                  eq(position.pyramidId, m.pyramidId)
                )
              )
              .limit(1),
            db
              .select({ row: position.row, col: position.col })
              .from(position)
              .where(
                and(
                  eq(position.teamId, m.defenderTeamId),
                  eq(position.pyramidId, m.pyramidId)
                )
              )
              .limit(1),
          ]);

        if (
          !challengerTeam ||
          !defenderTeam ||
          !challengerPos.length ||
          !defenderPos.length
        ) {
          throw new Error(`Missing data for match ${m.id}`);
        }

        return {
          id: m.id,
          pyramidId: m.pyramidId,
          pyramidName: m.pyramidName || "Pirámide sin nombre",
          challengerTeam: {
            ...challengerTeam,
            currentRow: challengerPos[0].row,
            currentCol: challengerPos[0].col,
          },
          defenderTeam: {
            ...defenderTeam,
            currentRow: defenderPos[0].row,
            currentCol: defenderPos[0].col,
          },
          createdAt: m.createdAt!,
        };
      })
    );

    return matchesWithDetails;
  } catch (error) {
    console.error("Error fetching accepted matches:", error);
    return [];
  }
}
