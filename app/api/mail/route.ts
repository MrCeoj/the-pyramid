
// Updated API route: api/challenge-email/route.ts
import { NextResponse } from "next/server";
import { transporter } from "@/lib/mail";
import { generateChallengeEmailTemplate } from "@/lib/mail/templates/Challenge";

export async function POST(request: Request) {
  
}
