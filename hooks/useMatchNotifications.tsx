// hooks/useMatchNotifications.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getUnreadMatchNotifications, markMatchAsViewed, MatchNotification } from "@/actions/MatchNotificationsActions";

interface NotificationState {
  count: number;
  matches: MatchNotification[];
  loading: boolean;
  error: string | null;
}

export function useMatchNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationState>({
    count: 0,
    matches: [],
    loading: false,
    error: null,
  });

  const fetchNotifications = useCallback(() => {
    if (!session?.user?.id) return;

    setNotifications(prev => ({ ...prev, loading: true, error: null }));
    const gettingunreadnotifs = async() => {
      try {
        const result = await getUnreadMatchNotifications(session.user.id);
        setNotifications({
          count: result.count,
          matches: result.matches,
          loading: false,
          error: null,
        });
      } catch (error) {
        setNotifications(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to fetch notifications",
        }));
      }
    }

    gettingunreadnotifs()
  }, [session?.user.id])

  const markAsViewed = async (matchId: number) => {
    if (!session?.user?.id) return;

    try {
      const result = await markMatchAsViewed(matchId, session.user.id);
      if (result?.success) {
        // Refresh notifications after marking as viewed
        await fetchNotifications();
      }
      return result;
    } catch (error) {
      console.error("Error marking match as viewed:", error);
      return { success: false, error: "Failed to mark as viewed" };
    }
  };

  // Fetch notifications on mount and when session changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, session?.user.id]);

  // Optional: Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, session?.user?.id]);

  return {
    ...notifications,
    fetchNotifications,
    markAsViewed,
    refresh: fetchNotifications,
  };
}