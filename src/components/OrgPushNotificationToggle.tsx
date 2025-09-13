import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, TestTube, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import api from "@/lib/api";
import pushNotificationService from '@/services/pushNotificationService';

interface OrgPushNotificationToggleProps {
  className?: string;
  showTestButton?: boolean;
}

export const OrgPushNotificationToggle = ({ 
  className, 
  showTestButton = true 
}: OrgPushNotificationToggleProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  useEffect(() => {
    checkSubscriptionStatus();
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = () => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      if (!pushNotificationService.isSupported) return;
      
      const subscription = await pushNotificationService.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return false;
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
      setPermissionState(permission);
    }

    if (permission !== 'granted') {
      toast.error('Notification permission denied');
      return false;
    }

    return true;
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const subscription = await pushNotificationService.subscribe();
      if (subscription) {
        const response = await api.post('/org/push/subscribe', {
          subscription,
          deviceId: `org_${Date.now()}`
        });

        if (response.data.success) {
          setIsSubscribed(true);
          setSubscriptionCount(response.data.subscriptionCount);
          toast.success('Push notifications enabled successfully');
        }
      }
    } catch (error: any) {
      console.error('Subscription failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const subscription = await pushNotificationService.getSubscription();
      if (subscription) {
        await api.post('/org/push/unsubscribe', {
          endpoint: subscription.endpoint
        });
      }

      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      toast.success('Push notifications disabled');
    } catch (error: any) {
      console.error('Unsubscription failed:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await api.post('/org/push/test');
      if (response.data.success) {
        toast.success('Test notification sent!');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send test notification');
    }
  };

  const getPermissionBadge = () => {
    switch (permissionState) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Allowed</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  if (!pushNotificationService.isSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BellOff className="h-4 w-4" />
            <span className="text-sm">Push notifications not supported</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get instant notifications for important updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
              </span>
              {isSubscribed && subscriptionCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Smartphone className="h-3 w-3 mr-1" />
                  {subscriptionCount} device{subscriptionCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Browser Permission:</span>
              {getPermissionBadge()}
            </div>
          </div>

          <Switch
            checked={isSubscribed}
            onCheckedChange={isSubscribed ? unsubscribe : subscribe}
            disabled={loading}
          />
        </div>

        {showTestButton && isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Send Test Notification
          </Button>
        )}

        {permissionState === 'denied' && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Notifications are blocked. Please enable them in your browser settings to receive updates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
