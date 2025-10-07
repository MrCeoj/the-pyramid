import { GetMostDisputedTeam } from "@/actions/stats";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(body.id);
    const data = await GetMostDisputedTeam(body.id)
    return new NextResponse(JSON.stringify(data))
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Error desconocido"
    );
  }
}
