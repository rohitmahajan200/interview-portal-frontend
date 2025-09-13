import { useState, useEffect, useCallback } from "react";
import pushNotificationService from "../services/pushNotificationService";

type PermissionState = NotificationPermission | "unsupported";

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permission, setPermission] = useState<PermissionState>("default");
  const [error, setError] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsSupported(pushNotificationService.isSupported);

        if (pushNotificationService.isSupported) {
          await pushNotificationService.initializeServiceWorker();

          const subscribed = await pushNotificationService.isSubscribed();
          setIsSubscribed(subscribed);

          setPermission(pushNotificationService.getPermissionStatus());
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to initialize push notifications";
        console.error(msg, err);
        setError(msg);
      }
    };

    void initialize();
  }, []);

  // Subscribe to notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.subscribe();
      setIsSubscribed(true);
      setPermission("granted");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Subscription failed";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unsubscribe failed";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send test notification
  const sendTest = useCallback(async (): Promise<boolean> => {
    if (!isSubscribed) {
      setError("Not subscribed to notifications");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.sendTestNotification();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Test notification failed";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
    sendTest,
  };
};

export default usePushNotifications;
