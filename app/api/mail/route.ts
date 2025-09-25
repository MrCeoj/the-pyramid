
// Updated API route: api/challenge-email/route.ts
import { NextResponse } from "next/server";
import { transporter } from "@/lib/mail";
import { generateChallengeEmailTemplate } from "@/lib/mail/templates/Challenge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      attacker, 
      defender, 
      pyramidId, 
      defenderEmail 
    } = body;

    if (!attacker || !defender || !pyramidId || !defenderEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const categoryDiff = (defender.categoryId ?? 0) - (attacker.categoryId ?? 0);
    const handicapPoints = Math.abs(categoryDiff) * 15;

    const emailData = {
      attacker,
      defender,
      pyramidId,
      handicapPoints
    };
    

    const htmlContent = generateChallengeEmailTemplate(emailData);

    const mailOptions = {
      from: process.env.SMTP_USER!,
      to: "jakes1182866@uabc.edu.mx",
      subject: `🏆 ¡${attacker.displayName} te han desafiado!`,
      html: htmlContent,
      alias: "retas"
    };

    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      html: htmlContent
    });

  } catch (error) {
    console.error("Error sending challenge email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
