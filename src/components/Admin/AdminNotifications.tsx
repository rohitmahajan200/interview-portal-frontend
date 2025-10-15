import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  BellOff,
  RefreshCw,
  Users,
  UserCheck,
  Shield,
  Clock,
  Mail,
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import {
  setAdminNotifications,
  setSelectedRole,
  setLoading,
} from "@/features/Org/Notifications/AdminNotificationSlice";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

const AdminNotifications = () => {
  const dispatch = useDispatch();
  const { notificationsByRole, roleBreakdown, loading, selectedRole } =
    useAppSelector((state) => state.adminNotifications);
      function useIsCompact(breakpoint = 1220) {
      const [isCompact, setIsCompact] = useState(false);
  
      useEffect(() => {
        const checkWidth = () => setIsCompact(window.innerWidth < breakpoint);
        checkWidth(); // run on mount
        window.addEventListener("resize", checkWidth);
        return () => window.removeEventListener("resize", checkWidth);
      }, [breakpoint]);
  
      return isCompact;
    }
    const isCompact = useIsCompact(1220);
  const fetchAdminNotifications = async () => {
    try {
      dispatch(setLoading(true));
      const response = await api.get("/org/admin/notifications");
      if (response.data.success) {
        dispatch(
          setAdminNotifications({
            notificationsByRole: response.data.data.notificationsByRole,
            roleBreakdown: response.data.data.roleBreakdown,
          })
        );
      }
    } catch (error: any) {
      toast.error("Failed to load notifications");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  const getAllNotifications = () => {
    return [
      ...(notificationsByRole.HR || []),
      ...(notificationsByRole.MANAGER || []),
      ...(notificationsByRole.INVIGILATOR || []),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const getFilteredNotifications = () => {
    if (selectedRole === "ALL") {
      return getAllNotifications();
    }
    return notificationsByRole[selectedRole] || [];
  };

  const getTotalStats = () => {
    const allNotifications = getAllNotifications();
    return {
      total: allNotifications.length,
      unread: allNotifications.filter((n) => !n.read).length,
      read: allNotifications.filter((n) => n.read).length,
    };
  };

  const stats = getTotalStats();

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "candidate registered":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
      case "manager_assigned":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
      case "interview_scheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "HR":
        return <Users className="h-4 w-4" />;
      case "MANAGER":
        return <UserCheck className="h-4 w-4" />;
      case "INVIGILATOR":
        return <Shield className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const NotificationCard = ({ notification }: { notification: any }) => (
    <Card className={`mb-3 sm:mb-4 ${
      !notification.read 
        ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
        : "dark:bg-card dark:border-gray-700"
    } hover:shadow-md dark:hover:shadow-gray-900/25 transition-shadow`}>
      <CardContent className="p-3 sm:p-4 md:p-5">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          
          {/* Header Row - Mobile Optimized */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5">
                {getRoleIcon(notification.recipient.role)}
                <Badge variant="outline" className="text-xs px-2 py-0.5 dark:border-gray-600 dark:text-foreground">
                  {notification.recipient.role}
                </Badge>
              </div>
              <Badge
                className={`${getNotificationTypeColor(notification.type)} text-xs px-2 py-0.5 whitespace-nowrap`}
              >
                {notification.type.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          {/* Recipient Info - Mobile Optimized */}
          <div className="flex items-start gap-2 sm:gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm sm:text-base text-foreground break-words">
                {notification.recipient.name}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground break-all">
                {notification.recipient.email}
              </div>
            </div>
          </div>

          {/* Message - Mobile Optimized */}
          <div className="text-sm sm:text-base text-foreground">
            <p className="break-words leading-relaxed">{notification.message}</p>
            {notification.visible_at && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-muted/50 dark:bg-gray-800/50 rounded-md">
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Visible:</span>
                  <span className="font-medium">
                    {format(new Date(notification.visible_at), "MMM dd, HH:mm")}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Timestamp - Mobile Optimized */}
          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs sm:text-sm text-muted-foreground pt-2 sm:pt-3 border-t dark:border-gray-700">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="break-words">
                {format(new Date(notification.createdAt), "MMM dd, yyyy")}
              </span>
            </span>
            <span className="text-xs sm:text-sm font-medium">
              {format(new Date(notification.createdAt), "HH:mm")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 dark:bg-background">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            Admin Notifications
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor organization notifications
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-foreground">
            {stats.unread} unread
          </Badge>
          <Button
            onClick={fetchAdminNotifications}
            variant="outline"
            size="sm"
            disabled={loading}
            className="h-9 dark:border-gray-700 dark:text-foreground dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Mobile-Friendly Stats Alert */}
      <Alert className="dark:bg-card dark:border-gray-700">
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6 text-sm">
            <span className="flex items-center gap-1">
              <strong className="text-foreground">{stats.total}</strong> 
              <span className="text-muted-foreground">Total</span>
            </span>
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <BellOff className="h-3 w-3" />
              <strong>{stats.unread}</strong> Unread
            </span>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <UserCheck className="h-3 w-3" />
              <strong>{stats.read}</strong> Read
            </span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Shield className="h-3 w-3" />
              <strong>{Object.keys(roleBreakdown).length}</strong> Roles
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Mobile-Responsive Role Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Object.entries(roleBreakdown).map(([role, breakdown]) => (
          <div
            key={role}
            className="flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg border bg-muted/50 dark:bg-card dark:border-gray-700"
          >
            <div className="flex items-center gap-2 flex-1">
              {getRoleIcon(role)}
              <span className="font-medium text-sm text-foreground">{role}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs dark:bg-gray-800 dark:text-gray-200">
                {breakdown.total}
              </Badge>
              {breakdown.unread > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {breakdown.unread}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <Separator className="dark:bg-gray-700" />

      {/* Mobile-Optimized Tabs */}
      <Tabs
        value={selectedRole}
        onValueChange={(value) => dispatch(setSelectedRole(value as any))}
        className="w-full"
      >
        {/* Responsive Tab List */}
        <div className="w-full overflow-x-auto">
          <TabsList className="grid w-full min-w-max grid-cols-4 dark:bg-gray-800">
            <TabsTrigger 
              value="ALL" 
              className="text-xs sm:text-sm px-2 sm:px-4 dark:data-[state=active]:bg-gray-700 dark:text-gray-200"
            >
              <span className="sm:hidden">All</span>
              <span className="hidden sm:inline">All ({stats.total})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="HR" 
              className="text-xs sm:text-sm px-2 sm:px-4 dark:data-[state=active]:bg-gray-700 dark:text-gray-200"
            >
              <span className="sm:hidden">HR</span>
              <span className="hidden sm:inline">HR ({roleBreakdown.HR?.total || 0})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="MANAGER" 
              className="text-xs sm:text-sm px-2 sm:px-4 dark:data-[state=active]:bg-gray-700 dark:text-gray-200"
            >
              <span className="sm:hidden">Mgr</span>
              <span className="hidden sm:inline">Manager ({roleBreakdown.MANAGER?.total || 0})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="INVIGILATOR" 
              className="text-xs sm:text-sm px-2 sm:px-4 dark:data-[state=active]:bg-gray-700 dark:text-gray-200"
            >
              <span className="sm:hidden">Inv</span>
              <span className="hidden sm:inline">Invigilator ({roleBreakdown.INVIGILATOR?.total || 0})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedRole} className="mt-4 sm:mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="text-sm text-muted-foreground">Loading notifications...</span>
              </div>
            </div>
          ) : getFilteredNotifications().length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No notifications found</h3>
              <p className="text-sm text-muted-foreground">
                No notifications available for{" "}
                {selectedRole === "ALL" ? "any role" : selectedRole}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - NO SCROLL */}
              <div className="hidden lg:block">
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent dark:border-gray-700">
                        {!isCompact && <TableHead className="w-[80px] text-foreground">Role</TableHead>}
                        <TableHead className="w-[200px] text-foreground">Recipient</TableHead>
                        {!isCompact && <TableHead className="text-foreground">Message</TableHead>}
                        <TableHead className="w-[120px] text-foreground">Type</TableHead>
                        {!isCompact && <TableHead className="w-[140px] text-foreground">Created</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredNotifications().map((notification) => (
                        <TableRow
                          key={notification._id}
                          className={`${
                            !notification.read
                              ? "bg-blue-50/50 dark:bg-blue-900/20"
                              : "dark:border-gray-700"
                          } hover:bg-muted/50 dark:hover:bg-gray-800/50`}
                        >
                          {!isCompact && <TableCell>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(notification.recipient.role)}
                              <span className="text-xs font-medium text-foreground">
                                {notification.recipient.role}
                              </span>
                            </div>
                          </TableCell>}
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium text-foreground">
                                {notification.recipient.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {notification.recipient.email}
                              </div>
                            </div>
                          </TableCell>
                          {!isCompact && <TableCell>
                            <div className="text-sm min-w-0"> {/* min-w-0 allows flex shrinking */}
                              <p className="text-foreground break-words leading-relaxed whitespace-normal">
                                {notification.message}
                              </p>
                              {notification.visible_at && (
                                <p className="text-xs text-muted-foreground mt-1 break-words">
                                  Visible: {format(new Date(notification.visible_at), "MMM dd, HH:mm")}
                                </p>
                              )}
                            </div>
                          </TableCell>}

                          <TableCell>
                            <Badge
                              className={`${getNotificationTypeColor(
                                notification.type
                              )} text-xs`}
                            >
                              {notification.type}
                            </Badge>
                          </TableCell>
                          {!isCompact && <TableCell className="text-xs text-muted-foreground">
                            {format(
                              new Date(notification.createdAt),
                              "MMM dd, HH:mm"
                            )}
                          </TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View - NO SCROLL */}
              <div className="lg:hidden">
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {getFilteredNotifications().length} notification{getFilteredNotifications().length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-3">
                  {getFilteredNotifications().map((notification) => (
                    <NotificationCard 
                      key={notification._id} 
                      notification={notification} 
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
