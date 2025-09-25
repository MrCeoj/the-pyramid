import { getLongestReigningTeam } from "@/db/queries";
import { NextRequest, NextResponse } from "next/server";

export async function POST(){
    const data = await getLongestReigningTeam(1)
    return NextResponse.json(data)
}