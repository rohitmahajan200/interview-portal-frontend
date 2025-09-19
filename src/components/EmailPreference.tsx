import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from "@/lib/api";

interface EmailPreferenceToggleProps {
  className?: string;
}

export const EmailPreferenceToggle = ({ className }: EmailPreferenceToggleProps) => {
  const [emailPreference, setEmailPreference] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch current preference on component mount
  useEffect(() => {
    fetchEmailPreference();
  }, []);

  const fetchEmailPreference = async () => {
    try {
      const response = await api.get("/org/email-preference");
      
      if (response.data.success) {
        setEmailPreference(response.data.data.emailPreference);
      }
    } catch (error: any) {
      console.error('Failed to fetch email preference:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load email preference';
      toast.error(errorMessage);
    }
  };

  const togglePreference = async () => {
    setLoading(true);
    
    try {
      const response = await api.patch("/org/email-preference/toggle");
      
      if (response.data.success) {
        setEmailPreference(response.data.data.emailPreference);
        toast.success(response.data.message);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to toggle email preference:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update email preference';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          {emailPreference ? (
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
          ) : (
            <BellOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
          )}
          <span className="truncate">Email Notifications</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Control whether you receive email notifications from the system
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-2">
          <Switch
            id="email-preference"
            checked={emailPreference}
            onCheckedChange={togglePreference}
            disabled={loading}
            className="flex-shrink-0"
          />
          <Label htmlFor="email-preference" className="cursor-pointer text-sm sm:text-base">
            {emailPreference ? 'Email notifications enabled' : 'Email notifications disabled'}
          </Label>
        </div>
        
        {loading && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Updating preference...
          </p>
        )}
      </CardContent>
    </Card>
  );
};
