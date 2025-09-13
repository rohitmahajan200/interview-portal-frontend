// src/hooks/usePushNotificationInit.ts
import { useEffect } from 'react';
import pushNotificationService from '@/services/pushNotificationService';

export const usePushNotificationInit = () => {
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        if (pushNotificationService.isSupported) {
          await pushNotificationService.initializeServiceWorker();
          
          // 🔥 ADD THIS: Auto-request permission on first visit
          if (Notification.permission === 'default') {
            // Small delay to ensure page is fully loaded
            setTimeout(async () => {
              try {
                const permission = await Notification.requestPermission();
                console.log('Permission result:', permission);
              } catch (error) {
                console.log('Permission request failed:', error);
              }
            }, 1000);
          }
          
          console.log("✅ Push notification service initialized");
        }
      } catch (err) {
        console.error("❌ Failed to initialize push notifications:", err);
      }
    };

    initializePushNotifications();
  }, []);
};
