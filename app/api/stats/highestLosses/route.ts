import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { team } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const highestLosses = await db
    .select({
      teamId: team.id,
      losses: team.losses
    })
    .from(team)
    .orderBy(desc(team.losses))
    .limit(3);

  return NextResponse.json(highestLosses);
}