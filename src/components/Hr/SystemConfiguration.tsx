// src/components/SystemConfiguration.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Key, Palette } from 'lucide-react';
import OrgProfileUpdate from '../OrgProfileUpdate';
import { OrgPushNotificationToggle } from '../OrgPushNotificationToggle';
import { EmailPreferenceToggle } from '../EmailPreference';
import ResetOrgPasswordDialog from '../ui/ResetOrgPasswordDialog';
import ThemeToggleCard from '../themeToggle';

export const SystemConfiguration = () => {
  const [passwordUpdateDialogOpen, setPasswordUpdateDialogOpen] = useState(false);

  const openPasswordUpdateDialog = () => {
    setPasswordUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span className="truncate">System Configuration</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account settings, preferences, and security options
        </p>
      </div>

      {/* Profile Settings */}
      <OrgProfileUpdate />

      <Separator className="my-4 sm:my-6" />

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Palette className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Appearance Settings</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Customize the visual appearance of your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ThemeToggleCard />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-4 sm:my-6" />

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Security Settings</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="font-medium text-sm sm:text-base">Password</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Change your account password for enhanced security
                </p>
              </div>
              <Button 
                onClick={openPasswordUpdateDialog} 
                variant="outline"
                className="w-full sm:w-auto justify-center sm:justify-start"
              >
                <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Setup Password</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Update Dialog */}
      <ResetOrgPasswordDialog
        isOpen={passwordUpdateDialogOpen}
        onOpenChange={setPasswordUpdateDialogOpen}
        apiEndpoint="/org/setup-password"
      />

      <Separator className="my-4 sm:my-6" />

      {/* Notification Settings */}
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold">Notification Preferences</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <OrgPushNotificationToggle showTestButton={true} />
          <EmailPreferenceToggle />
        </div>
      </div>
    </div>
  );
};

export default SystemConfiguration;
