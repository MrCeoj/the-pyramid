import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/drizzle";
import { position, team } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const body = await req.json()
    const highestLosses = await db
      .select({
        teamId: team.id,
        losses: position.losses,
      })
      .from(team)
      .innerJoin(position, eq(position.teamId, team.id))
      .where(eq(position.pyramidId, body.pyramidId))
      .orderBy(desc(position.losses))
      .limit(3);

    return NextResponse.json(highestLosses);
  } catch (error) {
    console.error(error)
    return NextResponse.json({error:"Error al encontrar al highest looser"}, {status: 500})
  }
}
