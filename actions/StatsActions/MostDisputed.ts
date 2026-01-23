"use server";

import { db } from "@/lib/drizzle";
import { match, team, users, profile } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { getTeamDisplayName } from "@/lib/utils";

export async function GetMostDisputedTeam(pyramidId: number) {
  const result = await db
    .select({
      teamId: sql<number>`team_id`,
      totalMatches: sql<number>`COUNT(*) as total_matches`,
    })
    .from(
      sql`
        (
          SELECT ${match.challengerTeamId} as team_id
          FROM ${match}
          WHERE ${match.pyramidId} = ${pyramidId}
            AND ${match.status} = 'played'
          UNION ALL
          SELECT ${match.defenderTeamId} as team_id
          FROM ${match}
          WHERE ${match.pyramidId} = ${pyramidId}
            AND ${match.status} = 'played'
        ) as all_matches
      `
    )
    .groupBy(sql`team_id`)
    .orderBy(desc(sql`total_matches`))
    .limit(1);

  if (result.length === 0) return null;

  // Get team data
  const [teamData] = await db
    .select()
    .from(team)
    .where(sql`${team.id} = ${result[0].teamId}`)
    .limit(1);

  if (!teamData) return null;

  // Get player data for both players
  const player1Data = teamData.player1Id
    ? await db
        .select({
          id: users.id,
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData.player1Id))
        .limit(1)
    : [];

  const player2Data = teamData.player2Id
    ? await db
        .select({
          id: users.id,
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData.player2Id))
        .limit(1)
    : [];

  const player1 = player1Data[0] || null;
  const player2 = player2Data[0] || null;

  // Generate team display name
  const teamName = getTeamDisplayName(player1, player2);

  return {
    ...teamData,
    teamName,
    totalMatches: result[0].totalMatches,
  };
}