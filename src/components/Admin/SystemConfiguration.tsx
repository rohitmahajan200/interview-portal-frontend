// src/components/SystemConfiguration.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Key } from 'lucide-react';
import OrgProfileUpdate from '../OrgProfileUpdate';
import { OrgPushNotificationToggle } from '../OrgPushNotificationToggle';
import { EmailPreferenceToggle } from '../EmailPreference';
import ResetOrgPasswordDialog from '../ui/ResetOrgPasswordDialog';

export const SystemConfiguration = () => {
 const [passwordUpdateDialogOpen, setPasswordUpdateDialogOpen] = useState(false);

  // Update the openPasswordUpdateDialog function
  const openPasswordUpdateDialog = () => {
    setPasswordUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          System Configuration
        </h2>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and security options
        </p>
      </div>

      {/* Profile Settings */}
      <OrgProfileUpdate />

      <Separator />

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Change your account password for enhanced security
                </p>
              </div>
              <Button onClick={openPasswordUpdateDialog} variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Setup Password
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

      <Separator />

      {/* Notification Settings */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Notification Preferences</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrgPushNotificationToggle showTestButton={true} />
          <EmailPreferenceToggle />
        </div>
      </div>
    </div>
  );
};

export default SystemConfiguration;
