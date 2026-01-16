import { NextRequest, NextResponse } from "next/server";
import { GetPlayedMatchHistory } from "@/actions/StatsActions";

export async function POST(req: NextRequest) {
    try{
        const body = await req.json()
        const data = await GetPlayedMatchHistory(body.id)
        console.log(data.length)
        return new NextResponse(JSON.stringify(data))
    }catch(error){
        return new NextResponse(error instanceof Error ? error.message : "Error desconocido")
    }
}
