import { OrgPushNotificationToggle } from './OrgPushNotificationToggle';
import { EmailPreferenceToggle } from './EmailPreference';

export const OrgNotificationSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
        <p className="text-muted-foreground">
          Manage how you receive notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrgPushNotificationToggle showTestButton={true} />
        <EmailPreferenceToggle />
      </div>
    </div>
  );
};
