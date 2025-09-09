import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/hooks/useAuth";
import {
  setNotifications,
  setLoading,
  setError,
} from "@/features/Candidate/notifications/notificationSlice";
import api from "@/lib/api";

export const useNotifications = () => {
  const dispatch = useDispatch();
  const notifications = useAppSelector((state) => state.notifications);

  const fetchNotifications = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await api.get("/candidates/notifications");

      if (response.data.success) {
        dispatch(setNotifications(response.data.data || []));
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as any)?.response?.data?.message ||
            "Failed to load notifications"
          : "Failed to load notifications";
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return {
    notifications: notifications.items,
    unreadCount: notifications.unreadCount,
    loading: notifications.loading,
    error: notifications.error,
    fetchNotifications,
  };
};
