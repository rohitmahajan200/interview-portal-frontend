// src/components/Admin/AdminDashboard.tsx
import { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store";

import { AdminSidebar } from "./AdminSidebar";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/themeToggle";

import { setUser } from "@/features/Org/Auth/orgAuthSlice";
import { setAdminNotifications } from "@/features/Org/Notifications/AdminNotificationSlice";
import api from "@/lib/api";
import pushNotificationService from "@/services/pushNotificationService";

// page views
import AdminHome from "./AdminHome";
import UserManagement from "./UserManagement";
import RolePermissions from "./RolePermissions";
import SystemConfiguration from "./SystemConfiguration";
import ReportsAnalytics from "./ReportsAnalytics";
import AuditLogs from "./AuditLogs";
import AdminNotifications from "./AdminNotifications";
import JobManagement from "./JobManagement";

// toasts
import {  toast } from "react-hot-toast";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const currentView = useSelector(
    (state: RootState) => state.adminView.currentAdminPage
  );

  const supported = pushNotificationService.isSupported;
  const [open, setOpen] = useState(Notification.permission === "default");

  useEffect(() => {
    if (!supported) {
      toast.error("This browser doesn’t support push notifications.");
      return;
    }

    const perm = Notification.permission;
    if (perm === "default") {
      setOpen(true);
    } else if (perm === "denied") {
      setOpen(false);
      toast(
        "Notifications are blocked. Enable them in your browser’s site settings, then reload.",
        { icon: "⚠️" }
      );
    }

    // register SW silently; prompt must be from a user gesture
    pushNotificationService.initializeServiceWorker().catch((e) => {
      console.error("SW init failed:", e);
      toast.error("Failed to initialize notifications.");
    });
  }, [supported]);

  const handleEnableNotifications = async () => {
    try {
      await pushNotificationService.subscribe(); // triggers permission prompt + backend registration
      console.log(Notification.permission)
      if (Notification.permission === "granted") {
        toast.success("Notifications enabled!", { duration: 2000});
      } else if (Notification.permission === "denied") {
        toast(
          "Notifications were blocked. Enable them in site settings to receive alerts.",
          { icon: "⚠️" }
        );
      }
      setOpen(false);
    } catch (e) {
      console.error("Subscribe failed:", e);
      toast.error("Couldn’t enable notifications.");
    }
  };

  const fetchAdminNotifications = useCallback(async () => {
    try {
      const response = await api.get("/org/admin/notifications");
      if (response.data?.success) {
        dispatch(
          setAdminNotifications({
            notificationsByRole: response.data.data.notificationsByRole,
            roleBreakdown: response.data.data.roleBreakdown,
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch admin notifications:", error);
      toast.error("Failed to fetch notifications.");
    }
  }, [dispatch]);

  useEffect(() => {
    const fetchOrgUser = async () => {
      try {
        const res = await api.get("/org/me");
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
      } catch (error) {
        console.error("Failed to fetch org user profile:", error);
        toast.error("Failed to load profile.");
      }
    };

    fetchOrgUser();
    fetchAdminNotifications();
  }, [dispatch, fetchAdminNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAdminNotifications();
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchAdminNotifications]);

  useEffect(() => {
    localStorage.setItem("adminCurrentView", currentView);
  }, [currentView]);

  const renderAdminView = (view: string) => {
    switch (view) {
      case "home":
        return <AdminHome />;
      case "users":
        return <UserManagement />;
      case "roles":
        return <RolePermissions />;
      case "config":
        return <SystemConfiguration />;
      case "analytics":
        return <ReportsAnalytics />;
      case "audit":
        return <AuditLogs />;
      case "notifications":
        return <AdminNotifications />;
      case "JobManagement":
        return <JobManagement />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      <SidebarProvider>
        <AdminSidebar className="w-64 h-full flex-shrink-0" />
        <SidebarInset className="flex-1 h-full overflow-hidden flex flex-col">
          {/* Only show dialog when permission is 'default' */}
          <Dialog open={open && Notification.permission === "default"} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enable notifications?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600">
                Get real-time updates for interviews, actions, and alerts.
              </p>
              <DialogFooter>
                <Button onClick={handleEnableNotifications}>Allow notifications</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background dark:bg-gray-900">
            <div className="flex items-center gap-2 px-4 justify-between w-full">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <header className="px-1 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          Admin Portal - Change Networks
                        </span>
                      </div>
                    </header>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {currentView ? renderAdminView(currentView) : null}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
