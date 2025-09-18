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
} from "@/features/Candidate/notifications/notificationSlice";

const CandidateNotifications = () => {
  const dispatch = useDispatch();
  const {
    items: notifications,
    unreadCount,
    loading,
  } = useSelector((state: RootState) => state.notifications);

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

  const getTypeVariant = (type?: string) => {
    if (!type) return "secondary";
    const typeMap: Record<string, string> = {
      error: "destructive",
      warning: "outline",
      success: "default",
      info: "secondary",
    };
    
    if (/error|expired|rejected/i.test(type)) return "destructive";
    if (/warning|reminder/i.test(type)) return "outline";
    if (/success|submitted|hired|assigned/i.test(type)) return "default";
    
    return typeMap[type.toLowerCase()] || "secondary";
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "read") return n.read;
    return true;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notifications
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {unreadCount} unread
          </Badge>
          <Button
            onClick={fetchNotifications}
            variant="outline"
            size="default"
            disabled={localLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${localLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
          <TabsTrigger value="all" className="text-sm font-medium">All</TabsTrigger>
          <TabsTrigger value="unread" className="text-sm font-medium">
            Unread {unreadCount > 0 && <Badge className="ml-2 text-xs">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="read" className="text-sm font-medium">Read</TabsTrigger>
        </TabsList>

        {/* Wide container with consistent width */}
        <div 
          className="w-full border rounded-lg relative overflow-hidden bg-background"
          style={{
            minHeight: '500px',
            height: '75vh',
            maxHeight: '700px',
            scrollbarGutter: 'stable'
          }}
        >
          <TabsContent value={activeTab} className="absolute inset-0 m-0">
            <div className="h-full w-full overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground">You're all caught up!</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-2">
                    {filteredNotifications.map((n) => (
                      <Card 
                        key={n._id}
                        className={`w-full transition-colors hover:shadow-sm ${
                          !n.read ? "border-primary/30 bg-primary/5" : ""
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {n.title || "Notification"}
                                </h4>
                                {n.type && (
                                  <Badge 
                                    variant={getTypeVariant(n.type) as any}
                                    className="text-xs px-1.5 py-0.5"
                                  >
                                    {n.type}
                                  </Badge>
                                )}
                                {!n.read && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                                {n.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(n.createdAt), "MMM d, h:mm a")}
                              </p>
                            </div>
                            
                            {!n.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(n._id)}
                                className="shrink-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CandidateNotifications;
