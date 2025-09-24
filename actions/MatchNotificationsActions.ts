// actions/MatchNotificationActions.ts
"use server";

import { db } from "@/lib/drizzle";
import { match, team, users, profile, matchNotifications } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

// Helper function to get user's team IDs
async function getUserTeamIds(userId: string): Promise<number[]> {
  const userTeams = await db
    .select({ id: team.id })
    .from(team)
    .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

  return userTeams.map((t) => t.id);
}

// Enhanced notification data type
export interface MatchNotification {
  id: number;
  matchId: number;
  status: "pending" | "accepted" | "played" | "rejected" | "cancelled";
  pyramidId: number;
  isChallenger: boolean;
  isDefender: boolean;
  challengerTeamId: number;
  defenderTeamId: number;
  challengerTeamName: string;
  defenderTeamName: string;
  lastStatusChange: Date | null;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Option 1: Using individual player viewed timestamps (simpler migration)
export async function getUnreadMatchNotifications(userId: string) {
  try {
    const userTeamIds = await getUserTeamIds(userId);

    if (userTeamIds.length === 0) {
      return { count: 0, matches: [] };
    }

    // Get matches where user's teams are involved
    const matchesData = await db
      .select({
        id: match.id,
        status: match.status,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        challengerPlayer1ViewedAt: match.challengerPlayer1ViewedAt,
        challengerPlayer2ViewedAt: match.challengerPlayer2ViewedAt,
        defenderPlayer1ViewedAt: match.defenderPlayer1ViewedAt,
        defenderPlayer2ViewedAt: match.defenderPlayer2ViewedAt,
        lastStatusChange: match.lastStatusChange,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      })
      .from(match)
      .where(
        and(
          or(
            ...userTeamIds.map((teamId) =>
              or(
                eq(match.challengerTeamId, teamId),
                eq(match.defenderTeamId, teamId)
              )
            )
          ),
          or(
            eq(match.status, "pending"),
            eq(match.status, "accepted"),
            eq(match.status, "played")
          )
        )
      );

    // Get team info for display names
    const teamIds = new Set<number>();
    matchesData.forEach((m) => {
      teamIds.add(m.challengerTeamId);
      teamIds.add(m.defenderTeamId);
    });

    const teamsInfo = await Promise.all(
      Array.from(teamIds).map(async (teamId) => {
        const teamData = await db
          .select({
            id: team.id,
            player1Id: team.player1Id,
            player2Id: team.player2Id,
          })
          .from(team)
          .where(eq(team.id, teamId))
          .limit(1);

        if (!teamData.length) return null;

        if (!teamData[0].player1Id || !teamData[0].player2Id) {
          return null;
        }

        // Get player names for display
        const [player1, player2] = await Promise.all([
          db
            .select({
              paternalSurname: users.paternalSurname,
              maternalSurname: users.maternalSurname,
              nickname: profile.nickname,
            })
            .from(users)
            .leftJoin(profile, eq(users.id, profile.userId))
            .where(eq(users.id, teamData[0].player1Id))
            .limit(1),
          db
            .select({
              paternalSurname: users.paternalSurname,
              maternalSurname: users.maternalSurname,
              nickname: profile.nickname,
            })
            .from(users)
            .leftJoin(profile, eq(users.id, profile.userId))
            .where(eq(users.id, teamData[0].player2Id))
            .limit(1),
        ]);

        if (!player1.length || !player2.length) return null;

        // Generate display name
        const p1 = player1[0];
        const p2 = player2[0];
        let displayName = "";

        if (p1.nickname && p2.nickname) {
          displayName = `${p1.nickname} / ${p2.nickname}`;
        } else if (p1.nickname && !p2.nickname) {
          displayName = `${p1.nickname} / ${p2.paternalSurname}`;
        } else if (!p1.nickname && p2.nickname) {
          displayName = `${p1.paternalSurname} / ${p2.nickname}`;
        } else {
          displayName = `${p1.paternalSurname} / ${p2.paternalSurname}`;
        }

        return {
          id: teamId,
          displayName,
          player1Id: teamData[0].player1Id,
          player2Id: teamData[0].player2Id,
        };
      })
    );

    const teamInfoMap = new Map();
    teamsInfo.forEach((team) => {
      if (team) teamInfoMap.set(team.id, team);
    });

    // Process notifications
    const notifications: MatchNotification[] = [];

    for (const m of matchesData) {
      const challengerTeam = teamInfoMap.get(m.challengerTeamId);
      const defenderTeam = teamInfoMap.get(m.defenderTeamId);

      const isUserInChallenger = userTeamIds.includes(m.challengerTeamId);
      const isUserInDefender = userTeamIds.includes(m.defenderTeamId);

      if (!challengerTeam || !defenderTeam) continue;

      // Determine if user has viewed this match since last status change
      let userViewedAt: Date | null = null;

      if (isUserInChallenger) {
        // Check if this user is player1 or player2 in challenger team
        if (challengerTeam.player1Id === userId) {
          userViewedAt = m.challengerPlayer1ViewedAt;
        } else if (challengerTeam.player2Id === userId) {
          userViewedAt = m.challengerPlayer2ViewedAt;
        }
      } else if (isUserInDefender) {
        // Check if this user is player1 or player2 in defender team
        if (defenderTeam.player1Id === userId) {
          userViewedAt = m.defenderPlayer1ViewedAt;
        } else if (defenderTeam.player2Id === userId) {
          userViewedAt = m.defenderPlayer2ViewedAt;
        }
      }

      // Check if notification is unread
      const isUnread =
        !userViewedAt ||
        (m.lastStatusChange && userViewedAt < m.lastStatusChange);

      if (isUnread) {
        notifications.push({
          id: m.id,
          matchId: m.id,
          status: m.status,
          pyramidId: m.pyramidId,
          isChallenger: isUserInChallenger,
          isDefender: isUserInDefender,
          challengerTeamId: m.challengerTeamId,
          defenderTeamId: m.defenderTeamId,
          challengerTeamName: challengerTeam.displayName,
          defenderTeamName: defenderTeam.displayName,
          lastStatusChange: m.lastStatusChange,
          viewedAt: userViewedAt,
          createdAt: m.createdAt!,
          updatedAt: m.updatedAt!,
        });
      }
    }

    return {
      count: notifications.length,
      matches: notifications,
    };
  } catch (error) {
    console.error("Error getting unread match notifications:", error);
    return { count: 0, matches: [] };
  }
}

export async function markMatchAsViewed(matchId: number, userId: string) {
  try {
    const userTeamIds = await getUserTeamIds(userId);

    if (userTeamIds.length === 0) {
      return { success: false, error: "User has no teams" };
    }

    // Get the match to determine user's role
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

    const isUserInChallenger = userTeamIds.includes(
      matchData[0].challengerTeamId
    );
    const isUserInDefender = userTeamIds.includes(matchData[0].defenderTeamId);

    if (!isUserInChallenger && !isUserInDefender) {
      return { success: false, error: "User not involved in this match" };
    }

    const viewedAt = new Date();

    // Determine which field to update based on user's position in the team
    if (isUserInChallenger) {
      const challengerTeam = await db
        .select({ player1Id: team.player1Id, player2Id: team.player2Id })
        .from(team)
        .where(eq(team.id, matchData[0].challengerTeamId))
        .limit(1);

      if (challengerTeam.length) {
        const updateField =
          challengerTeam[0].player1Id === userId
            ? "challengerPlayer1ViewedAt"
            : "challengerPlayer2ViewedAt";

        await db
          .update(match)
          .set({ [updateField]: viewedAt })
          .where(eq(match.id, matchId));
      }
    } else if (isUserInDefender) {
      const defenderTeam = await db
        .select({ player1Id: team.player1Id, player2Id: team.player2Id })
        .from(team)
        .where(eq(team.id, matchData[0].defenderTeamId))
        .limit(1);

      if (defenderTeam.length) {
        const updateField =
          defenderTeam[0].player1Id === userId
            ? "defenderPlayer1ViewedAt"
            : "defenderPlayer2ViewedAt";

        await db
          .update(match)
          .set({ [updateField]: viewedAt })
          .where(eq(match.id, matchId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking match as viewed:", error);
  }
}

// Option 2: Using the separate matchNotifications table (more scalable)
export async function getUnreadMatchNotificationsAdvanced(userId: string) {
  try {
    const unreadNotifications = await db
      .select({
        id: matchNotifications.id,
        matchId: matchNotifications.matchId,
        notificationType: matchNotifications.notificationType,
        isRead: matchNotifications.isRead,
        createdAt: matchNotifications.createdAt,
        matchStatus: match.status,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(matchNotifications)
      .innerJoin(match, eq(matchNotifications.matchId, match.id))
      .where(
        and(
          eq(matchNotifications.userId, userId),
          eq(matchNotifications.isRead, false)
        )
      );

    return {
      count: unreadNotifications.length,
      notifications: unreadNotifications,
    };
  } catch (error) {
    console.error("Error getting advanced match notifications:", error);
    return { count: 0, notifications: [] };
  }
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: string
) {
  try {
    const result = await db
      .update(matchNotifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(matchNotifications.id, notificationId),
          eq(matchNotifications.userId, userId)
        )
      )
      .returning();

    return { success: result.length > 0 };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Database error" };
  }
}

// Create notifications when match status changes
export async function createMatchNotifications(
  matchId: number,
  notificationType: string,
  excludeUserId?: string
) {
  try {
    // Get match and team data
    const matchData = await db
      .select({
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchData.length) return { success: false };

    // Get all players involved
    const [challengerTeam, defenderTeam] = await Promise.all([
      db
        .select({ player1Id: team.player1Id, player2Id: team.player2Id })
        .from(team)
        .where(eq(team.id, matchData[0].challengerTeamId))
        .limit(1),
      db
        .select({ player1Id: team.player1Id, player2Id: team.player2Id })
        .from(team)
        .where(eq(team.id, matchData[0].defenderTeamId))
        .limit(1),
    ]);

    if (!challengerTeam.length || !defenderTeam.length) {
      return { success: false };
    }

    const allPlayerIds: string[] = [
      challengerTeam[0].player1Id,
      challengerTeam[0].player2Id,
      defenderTeam[0].player1Id,
      defenderTeam[0].player2Id,
    ].filter((id): id is string => id !== null && id !== excludeUserId); // type guard ensures string[]

    const notifications = allPlayerIds.map((userId) => ({
      matchId,
      userId, // now TypeScript knows this is string
      notificationType,
      isRead: false,
    }));

    await db.insert(matchNotifications).values(notifications);

    return { success: true };
  } catch (error) {
    console.error("Error creating match notifications:", error);
    return { success: false };
  }
}

// Updated function to track status changes
export async function updateMatchStatusChange(
  matchId: number,
  triggeredByUserId?: string
) {
  try {
    await db
      .update(match)
      .set({
        lastStatusChange: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

    // Create notifications for the status change
    if (triggeredByUserId) {
      await createMatchNotifications(
        matchId,
        "status_change",
        triggeredByUserId
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating match status change:", error);
    return { success: false, error: "Database error" };
  }
}
