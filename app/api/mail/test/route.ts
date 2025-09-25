
// Updated API route: api/challenge-email/route.ts
import { NextResponse } from "next/server";
import { transporter } from "@/lib/mail";
import { generateChallengeEmailTemplate } from "@/lib/mail/templates/Challenge";

export async function GET() {
  try {
    const mailOptions = {
      from: process.env.FROM_RETAS,
      to: "ortizludwin68@outlook.com",
      subject: `Ganamos Jefe x4`,
      html: "<h1>Ganamos jefe x4</h1>",
    };

    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
    });

  } catch (error) {
    console.error("Error sending challenge email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
