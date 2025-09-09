import { AdminSidebar } from "./AdminSidebar";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { setUser } from "@/features/Org/Auth/orgAuthSlice";
import { setAdminNotifications } from "@/features/Org/Notifications/AdminNotificationSlice"; // Changed import
import api from "@/lib/api";
import { useEffect, useCallback } from "react";

// Admin page views
import AdminHome from "./AdminHome";
import UserManagement from "./UserManagement";
import RolePermissions from "./RolePermissions";
import SystemConfiguration from "./SystemConfiguration";
import ReportsAnalytics from "./ReportsAnalytics";
import AuditLogs from "./AuditLogs";
import AdminNotifications from "./AdminNotifications"; // Changed from OrgNotifications
import ThemeToggle from "@/components/themeToggle";
import JobManagement from "./JobManagement";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const currentView = useSelector(
    (state: RootState) => state.adminView.currentAdminPage
  );

  // Updated to fetch admin notifications
  const fetchAdminNotifications = useCallback(async () => {
    try {
      const response = await api.get("/org/admin/notifications"); // Changed endpoint
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
      }
    };

    fetchOrgUser();
    fetchAdminNotifications(); // Initial fetch
  }, [dispatch, fetchAdminNotifications]);

  // Periodic notification fetching (every 2 minutes for admin)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAdminNotifications();
    }, 120000); // Increased to 2 minutes for admin
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
        return <AdminNotifications />; // Changed component
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
          <div className="flex-1 overflow-y-auto p-6">
            {currentView ? renderAdminView(currentView) : null}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
