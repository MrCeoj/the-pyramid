"use server";
import { team } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

export default async function getRejectedAmount(teamId: number) {
  try {
    const rejectedMatches = await db
      .select({ rejected: team.amountRejected })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (rejectedMatches.length < 1) {
      throw new Error(
        "No se pudo conseguir la cantidad de partidas rechazadas"
      );
    }

    console.log(rejectedMatches)

    return rejectedMatches[0].rejected
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return {error: error.message}
    }
  }
}
