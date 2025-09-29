// src/components/Invigilator/InvigilatorNotifications.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, RefreshCw, Check, CheckCheck } from "lucide-react";
import api from "@/lib/api";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import {
  setNotifications,
  markAsRead,
  markAllAsRead,
  setLoading,
} from "@/features/Org/Notifications/orgNotificationSlice";
import type { RootState } from "@/app/store";

const InvigilatorNotifications = () => {
  const dispatch = useDispatch();
  const {
    items: notifications,
    unreadCount,
    loading,
  } = useSelector((state: RootState) => state.orgNotifications);
  const [localLoading, setLocalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  const fetchNotifications = async () => {
    try {
      setLocalLoading(true);
      dispatch(setLoading(true));
      const res = await api.get("/org/notifications");
      if (res.data?.success) {
        dispatch(setNotifications(res.data.data || []));
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLocalLoading(false);
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/org/notifications/${id}/read`);
      dispatch(markAsRead(id));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/org/notifications/read-all");
      dispatch(markAllAsRead());
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getTypeColor = (type?: string) => {
    if (!type)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    switch (true) {
      case /expired|rejected|error/i.test(type):
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case /reminder|warning/i.test(type):
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case /submitted|hired|success|assigned/i.test(type):
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "read") return n.read;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-foreground">
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
              View the latest updates across assessments, interviews, and more
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Badge variant="outline" className="text-xs sm:text-sm w-fit">
            {unreadCount} unread
          </Badge>
          <div className="flex gap-2">
            <Button
              onClick={fetchNotifications}
              variant="outline"
              disabled={localLoading}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${localLoading ? "animate-spin" : ""}`}
              />
              <span className="sm:hidden">Refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {unreadCount > 0 && (
              <Button 
                onClick={handleMarkAllAsRead} 
                variant="default"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Mark All</span>
                <span className="hidden sm:inline">Mark All Read</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs sm:text-sm">
            Unread{" "}
            {unreadCount > 0 && <Badge className="ml-1 text-xs">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="read" className="text-xs sm:text-sm">
            Read
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card className="border-border dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-foreground dark:text-foreground">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Notifications
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground dark:text-foreground">
                    No notifications
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredNotifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 sm:p-4 rounded-lg border border-border dark:border-border ${
                        n.read
                          ? "bg-gray-50 dark:bg-gray-800/50"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {n.title || "Notification"}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1">
                              {!!n.type && (
                                <Badge className={`${getTypeColor(n.type)} text-xs h-5`}>
                                  {n.type}
                                </Badge>
                              )}
                              {!n.read && (
                                <Badge variant="destructive" className="text-xs h-5">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {n.message}
                          </p>

                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {format(new Date(n.createdAt), "PPpp")}
                          </p>
                        </div>

                        {!n.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(n._id)}
                            className="flex-shrink-0 h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvigilatorNotifications;
