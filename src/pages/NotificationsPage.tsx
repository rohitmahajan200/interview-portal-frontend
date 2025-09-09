import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { RootState } from "@/app/store";

import {
  setNotifications,
  markAsRead,
  markAllAsRead,
  setLoading,
} from "@/features/Candidate/notifications/notificationSlice"; // Updated import path

const CandidateNotifications = () => {
  const dispatch = useDispatch();
  const {
    items: notifications,
    unreadCount,
    loading,
  } = useSelector((state: RootState) => state.notifications); // Updated selector

  const [localLoading, setLocalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  const fetchNotifications = useCallback(async () => {
    setLocalLoading(true);
    dispatch(setLoading(true));
    try {
      const res = await api.get("/candidates/notifications");
      if (res.data?.success) {
        dispatch(setNotifications(res.data.data || []));
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setLocalLoading(false);
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/candidates/notifications/${id}/read`);
      dispatch(markAsRead(id));
      toast.success("Notification marked as read");
    } catch (err) {
      console.error("Failed to mark as read:", err);
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/candidates/notifications/read-all");
      dispatch(markAllAsRead());
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to update notifications");
    }
  };

  const getTypeColor = (type?: string) => {
    if (!type)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    switch (type.toLowerCase()) {
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        // Handle custom types with pattern matching
        switch (true) {
          case /error|expired|rejected/i.test(type):
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
          case /warning|reminder/i.test(type):
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
          case /success|submitted|hired|assigned/i.test(type):
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
          default:
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
        }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "read") return n.read;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              View your latest candidate notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {unreadCount} unread
          </Badge>
          <Button
            onClick={fetchNotifications}
            variant="outline"
            disabled={localLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${localLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="default">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread{" "}
            {unreadCount > 0 && <Badge className="ml-1">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{`${
                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
              } Notifications`}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No notifications</h3>
                  <p className="text-muted-foreground">You're all caught up!</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredNotifications.map((n) => (
                      <div
                        key={n._id}
                        className={`p-4 rounded-lg border ${
                          n.read
                            ? "bg-gray-50 dark:bg-gray-800/50"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {n.title || "Notification"}
                              </h4>
                              {!!n.type && (
                                <Badge
                                  className={`${getTypeColor(n.type)} text-xs`}
                                >
                                  {n.type}
                                </Badge>
                              )}
                              {!n.read && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {n.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(n.createdAt), "PPpp")}
                            </p>
                          </div>
                          {!n.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(n._id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CandidateNotifications;
