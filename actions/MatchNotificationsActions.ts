"use server";
import { db } from "@/lib/drizzle";
import { eq, and, desc, count } from "drizzle-orm";
import {
  match,
  matchNotifications,
  team,
  pyramid
} from "@/db/schema";
import { getTeamData } from "./IndexActions";
import { revalidatePath } from "next/cache";

export type NotificationType = 'challenge' | 'accepted' | 'played' | 'result';

export type NotificationWithDetails = {
  id: number;
  matchId: number;
  notificationType: NotificationType;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  match: {
    id: number;
    status: string;
    pyramidName: string;
    challengerTeamName: string;
    defenderTeamName: string;
    winnerTeamName?: string;
  };
};

// Create notifications for all players in both teams
async function createNotificationsForMatch(
  matchId: number,
  notificationType: NotificationType,
  excludeUserId?: string // User who triggered the action doesn't need notification
) {
  try {
    // Get match details and team players
    const matchData = await db
      .select({
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchData.length) return;

    const { challengerTeamId, defenderTeamId } = matchData[0];

    // Get all players from both teams
    const [challengerTeam, defenderTeam] = await Promise.all([
      db
        .select({
          player1Id: team.player1Id,
          player2Id: team.player2Id,
        })
        .from(team)
        .where(eq(team.id, challengerTeamId))
        .limit(1),
      db
        .select({
          player1Id: team.player1Id,
          player2Id: team.player2Id,
        })
        .from(team)
        .where(eq(team.id, defenderTeamId))
        .limit(1),
    ]);

    // Collect all player IDs
    const playerIds: string[] = [];
    
    if (challengerTeam[0]?.player1Id) playerIds.push(challengerTeam[0].player1Id);
    if (challengerTeam[0]?.player2Id) playerIds.push(challengerTeam[0].player2Id);
    if (defenderTeam[0]?.player1Id) playerIds.push(defenderTeam[0].player1Id);
    if (defenderTeam[0]?.player2Id) playerIds.push(defenderTeam[0].player2Id);

    // Filter out excluded user and create notifications
    const targetPlayerIds = excludeUserId 
      ? playerIds.filter(id => id !== excludeUserId)
      : playerIds;

    if (targetPlayerIds.length > 0) {
      const notificationData = targetPlayerIds.map(userId => ({
        matchId,
        userId,
        notificationType,
        isRead: false,
      }));

      // Use INSERT ... ON CONFLICT to avoid duplicates
      await db
        .insert(matchNotifications)
        .values(notificationData)
        .onConflictDoNothing({
          target: [
            matchNotifications.matchId,
            matchNotifications.userId,
            matchNotifications.notificationType
          ]
        });
    }
  } catch (error) {
    console.error("Error creating match notifications:", error);
  }
}

// Updated match creation with notifications
export async function createMatchWithNotifications({
  pyramidId,
  challengerTeamId,
  defenderTeamId,
  userId,
}: {
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  userId: string;
}) {
  try {
    // Your existing validation logic here...
    
    const [newMatch] = await db
      .insert(match)
      .values({
        pyramidId,
        challengerTeamId,
        defenderTeamId,
        status: "pending",
      })
      .returning();

    // Create notifications for defender team (challenger initiated, so exclude them)
    await createNotificationsForMatch(newMatch.id, 'challenge', userId);

    revalidatePath("/mis-retas");
    return { success: true, match: newMatch };
  } catch (err) {
    console.error("Error creating match:", err);
    return { success: false, error: "No se pudo establecer la reta" };
  }
}

// Updated match acceptance with notifications
export async function acceptMatchWithNotifications(
  matchId: number,
  userId: string
) {
  try {
    // Your existing validation logic here...

    await db
      .update(match)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

    // Create notifications for all players (except the one who accepted)
    await createNotificationsForMatch(matchId, 'accepted', userId);

    revalidatePath("/mis-retas");
    return {
      success: true,
      message: "Desafío aceptado. ¡Prepárate para el combate!",
    };
  } catch (error) {
    console.error("Error accepting match:", error);
    return {
      success: false,
      message: "Error al aceptar el desafío. Intenta de nuevo.",
    };
  }
}

// Updated match completion with notifications
export async function completeMatchWithNotifications(
  matchId: number,
  winnerTeamId: number
) {
  try {
    // Your existing completion logic here...
    
    await db.transaction(async (tx) => {
      // Your existing transaction logic...
      
      await tx
        .update(match)
        .set({
          winnerTeamId,
          status: "played",
          updatedAt: new Date(),
        })
        .where(eq(match.id, matchId));

      // Rest of your transaction logic...
    });

    // Create notifications for all players about match completion
    await createNotificationsForMatch(matchId, 'played');
    await createNotificationsForMatch(matchId, 'result');

    revalidatePath("/retas");
    return {
      success: true,
      message: "Match completado. Todos los jugadores han sido notificados.",
    };
  } catch (error) {
    console.error("Error completing match:", error);
    return {
      success: false,
      message: "Error interno del servidor. Intenta de nuevo.",
    };
  }
}

// Get user notifications
export async function getUserNotifications(
  userId: string
): Promise<NotificationWithDetails[]> {
  try {
    const notifications = await db
      .select({
        id: matchNotifications.id,
        matchId: matchNotifications.matchId,
        notificationType: matchNotifications.notificationType,
        isRead: matchNotifications.isRead,
        readAt: matchNotifications.readAt,
        createdAt: matchNotifications.createdAt,
        matchStatus: match.status,
        pyramidName: pyramid.name,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        winnerTeamId: match.winnerTeamId,
      })
      .from(matchNotifications)
      .innerJoin(match, eq(matchNotifications.matchId, match.id))
      .innerJoin(pyramid, eq(match.pyramidId, pyramid.id))
      .where(eq(matchNotifications.userId, userId))
      .orderBy(desc(matchNotifications.createdAt));

    // Get team names for all involved teams
    const teamIds = new Set<number>();
    notifications.forEach(n => {
      teamIds.add(n.challengerTeamId);
      teamIds.add(n.defenderTeamId);
      if (n.winnerTeamId) teamIds.add(n.winnerTeamId);
    });

    const teamNames = new Map<number, string>();
    for (const teamId of teamIds) {
      const teamInfo = await getTeamData(teamId);
      if (teamInfo) {
        teamNames.set(teamId, teamInfo.displayName);
      }
    }

    return notifications.map(n => ({
      id: n.id,
      matchId: n.matchId,
      notificationType: n.notificationType as NotificationType,
      isRead: n.isRead || false,
      readAt: n.readAt,
      createdAt: n.createdAt!,
      match: {
        id: n.matchId,
        status: n.matchStatus || "",
        pyramidName: n.pyramidName || "",
        challengerTeamName: teamNames.get(n.challengerTeamId) || "Equipo desconocido",
        defenderTeamName: teamNames.get(n.defenderTeamId) || "Equipo desconocido",
        winnerTeamName: n.winnerTeamId ? teamNames.get(n.winnerTeamId) : undefined,
      },
    }));
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: number,
  userId: string
) {
  try {
    await db
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
      );

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await db
      .update(matchNotifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(matchNotifications.userId, userId),
          eq(matchNotifications.isRead, false)
        )
      );

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false };
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(matchNotifications)
      .where(
        and(
          eq(matchNotifications.userId, userId),
          eq(matchNotifications.isRead, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

// Helper function to generate notification message
export async function getNotificationMessage(notification: NotificationWithDetails) {
  const { notificationType, match } = notification;
  
  switch (notificationType) {
    case 'challenge':
      return `${match.challengerTeamName} te ha desafiado en ${match.pyramidName}`;
    case 'accepted':
      return `${match.defenderTeamName} ha aceptado tu desafío en ${match.pyramidName}`;
    case 'played':
      return `El match entre ${match.challengerTeamName} vs ${match.defenderTeamName} ha finalizado`;
    case 'result':
      return match.winnerTeamName 
        ? `${match.winnerTeamName} ha ganado el match en ${match.pyramidName}`
        : `Match completado en ${match.pyramidName}`;
    default:
      return 'Nueva notificación de match';
  }
}