// src/components/Admin/AdminDashboard.tsx
import { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store";

import { AdminSidebar } from "./AdminSidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
import { Header } from "../Header";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const currentView = useSelector(
    (state: RootState) => state.adminView.currentAdminPage
  );
  const user = useSelector((state: RootState) => state.orgAuth.user);

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
            toast.error("Failed to initialize notifications.");
    });
  }, [supported]);

  const handleEnableNotifications = async () => {
    try {
      await pushNotificationService.subscribe(); // triggers permission prompt + backend registration
   
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
            toast.error("Couldn’t enable notifications.");
    }
  };

  const fetchAdminNotifications = useCallback(async () => {
    // ✅ Only fetch if user is admin
    if (!user || user.role !== 'ADMIN') {
      return;
    }
    
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
            toast.error("Failed to fetch notifications.");
    }
  }, [dispatch, user]); 

  useEffect(() => {
    const fetchOrgUser = async () => {
      try {
        const res = await api.get("/org/me");
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
      } catch (error) {
                toast.error("Failed to load profile.");
      }
    };

    fetchOrgUser();
    fetchAdminNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAdminNotifications();
    }, 15000);
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
      case "notifications":
        return <AdminNotifications />;
      case "jobs":
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

          <Header />

          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {currentView ? renderAdminView(currentView) : null}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
