"use server";
import { positionHistory } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, desc } from "drizzle-orm";
import { formatDuration } from ".";

export async function getCurrentTeamDurationInPosition(teamId: number) {
  // Get the most recent position history entry for this team
  const [teamData] = await db
    .select()
    .from(positionHistory)
    .where(eq(positionHistory.teamId, teamId))
    .orderBy(desc(positionHistory.effectiveDate))
    .limit(1);

  if (!teamData) {
    console.log("No position history found for this team.");
    return null;
  }

  // Check if they're at the top (assuming top = row 0, col 0)
  if (teamData.newRow !== 1 || teamData.newCol !== 1) {
    console.log("Team is not currently at the top of the pyramid.");
    return null;
  }

  if (!teamData.effectiveDate) {
    console.log("Position has not effective date recorded");
    return null;
  }

  // Calculate duration from effectiveDate to now
  const now = new Date();
  const effectiveDate = new Date(teamData.effectiveDate);
  const diffMs = now.getTime() - effectiveDate.getTime();

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalHours = days * 24 + hours;
  const format = formatDuration(days, hours, minutes);

  return {
    totalDays: days,
    totalHours,
    days,
    hours,
    minutes,
    seconds,
    raw: `${days} days ${hours}:${minutes}:${seconds}`,
    format,
  };
}
