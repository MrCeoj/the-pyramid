// actions/MatchNotificationActions.ts
"use server";

import { db } from "@/lib/drizzle";
import { match, profile } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

export async function getUnreadMatchNotifications(userId: string) {
  try {
    // Get user's profile and team
    const userProfile = await db
      .select({
        teamId: profile.teamId,
      })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    if (!userProfile.length || !userProfile[0].teamId) {
      return { count: 0, matches: [] };
    }

    const teamId = userProfile[0].teamId;

    // Get matches where user's team is involved and they haven't viewed the latest status change
    const unreadMatches = await db
      .select({
        id: match.id,
        status: match.status,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        challengerViewedAt: match.challengerViewedAt,
        defenderViewedAt: match.defenderViewedAt,
        lastStatusChange: match.lastStatusChange,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      })
      .from(match)
      .where(
        and(
          or(
            eq(match.challengerTeamId, teamId),
            eq(match.defenderTeamId, teamId)
          ),
          or(
            eq(match.status, "pending"),
            eq(match.status, "accepted")
          )
        )
      );

    // Filter matches that haven't been viewed since last status change
    const unreadCount = unreadMatches.filter((m) => {
      const isChallenger = m.challengerTeamId === teamId;
      const viewedAt = isChallenger ? m.challengerViewedAt : m.defenderViewedAt;
      
      // If never viewed, or viewed before last status change, it's unread
      return !viewedAt || (m.lastStatusChange && viewedAt < m.lastStatusChange);
    }).length;

    return {
      count: unreadCount,
      matches: unreadMatches,
    };
  } catch (error) {
    console.error("Error getting unread match notifications:", error);
    return { count: 0, matches: [] };
  }
}

export async function markMatchAsViewed(matchId: number, userId: string) {
  try {
    // Get user's profile and team
    const userProfile = await db
      .select({
        teamId: profile.teamId,
      })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    if (!userProfile.length || !userProfile[0].teamId) {
      return { success: false, error: "User profile not found" };
    }

    const teamId = userProfile[0].teamId;

    // Get the match to determine if user is challenger or defender
    const matchData = await db
      .select({
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchData.length) {
      return { success: false, error: "Match not found" };
    }

    const isChallenger = matchData[0].challengerTeamId === teamId;
    const isDefender = matchData[0].defenderTeamId === teamId;

    if (!isChallenger && !isDefender) {
      return { success: false, error: "User not involved in this match" };
    }

    // Update the appropriate viewed timestamp
    const updateField = isChallenger ? "challengerViewedAt" : "defenderViewedAt";
    
    await db
      .update(match)
      .set({
        [updateField]: new Date(),
      })
      .where(eq(match.id, matchId));

    return { success: true };
  } catch (error) {
    console.error("Error marking match as viewed:", error);
    return { success: false, error: "Database error" };
  }
}

// Call this function whenever match status changes
export async function updateMatchStatusChange(matchId: number) {
  try {
    await db
      .update(match)
      .set({
        lastStatusChange: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

    return { success: true };
  } catch (error) {
    console.error("Error updating match status change:", error);
    return { success: false, error: "Database error" };
  }
}