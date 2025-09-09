import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Bell,
  BellOff,
  RefreshCw,
  Users,
  UserCheck,
  Shield,
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
      console.error("Failed to fetch admin notifications:", error);
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
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "manager_assigned":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "interview_scheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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

  return (
    <div className="p-4 space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Monitor organization notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{stats.unread} unread</Badge>
          <Button
            onClick={fetchAdminNotifications}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Compact Stats Alert */}
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <strong>{stats.total}</strong> Total
            </span>
            <span className="flex items-center gap-1 text-orange-600">
              <BellOff className="h-3 w-3" />
              <strong>{stats.unread}</strong> Unread
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <UserCheck className="h-3 w-3" />
              <strong>{stats.read}</strong> Read
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <Shield className="h-3 w-3" />
              <strong>{Object.keys(roleBreakdown).length}</strong> Active Roles
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Role Stats Compact Bar */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(roleBreakdown).map(([role, breakdown]) => (
          <div
            key={role}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50"
          >
            {getRoleIcon(role)}
            <span className="font-medium text-sm">{role}</span>
            <Badge variant="secondary" className="text-xs">
              {breakdown.total}
            </Badge>
            {breakdown.unread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {breakdown.unread} Unread
              </Badge>
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Compact Tabs with Table */}
      <Tabs
        value={selectedRole}
        onValueChange={(value) => dispatch(setSelectedRole(value as any))}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ALL" className="text-xs">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="HR" className="text-xs">
            HR ({roleBreakdown.HR?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="MANAGER" className="text-xs">
            Manager ({roleBreakdown.MANAGER?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="INVIGILATOR" className="text-xs">
            Invigilator ({roleBreakdown.INVIGILATOR?.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedRole} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : getFilteredNotifications().length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm text-muted-foreground mt-2">
                No notifications found for{" "}
                {selectedRole === "ALL" ? "any role" : selectedRole}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px]">Role</TableHead>
                    <TableHead className="w-[200px]">Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[140px]">Created</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredNotifications().map((notification) => (
                    <TableRow
                      key={notification._id}
                      className={
                        !notification.read
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : ""
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(notification.recipient.role)}
                          <span className="text-xs font-medium">
                            {notification.recipient.role}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {notification.recipient.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {notification.recipient.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-md">
                          <p className="truncate" title={notification.message}>
                            {notification.message}
                          </p>
                          {notification.visible_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Visible:{" "}
                              {format(
                                new Date(notification.visible_at),
                                "MMM dd, HH:mm"
                              )}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getNotificationTypeColor(
                            notification.type
                          )} text-xs`}
                        >
                          {notification.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(
                          new Date(notification.createdAt),
                          "MMM dd, HH:mm"
                        )}
                      </TableCell>
                      <TableCell>
                        {notification.read ? (
                          <Badge variant="secondary" className="text-xs">
                            Read
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Unread
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
