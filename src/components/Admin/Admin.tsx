import { AdminSidebar } from "./AdminSidebar";
import {
  Breadcrumb,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { setUser } from "@/features/Org/Auth/orgAuthSlice";
import api from "@/lib/api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Importing admin page views
import AdminHome from "./AdminHome";
import UserManagement from "./UserManagement";
import RolePermissions from "./RolePermissions";
import SystemConfiguration from "./SystemConfiguration";
import ReportsAnalytics from "./ReportsAnalytics";
import AuditLogs from "./AuditLogs";
import PlatformIntegration from "./PlatformIntegration";
import ThemeToggle from "@/components/themeToggle";
import JobManagement from "./JobManagement";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentView = useSelector((state: RootState) => state.adminView.currentAdminPage);
  const orgUser = useSelector((state: RootState) => state.orgAuth.user);

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
  }, [dispatch, navigate]);

  useEffect(() => {
    localStorage.setItem("adminCurrentView", currentView);
  }, [currentView]);

  const renderAdminView = (currentView: string) => {
    switch (currentView) {
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
      case "integrations":
        return <PlatformIntegration />;
      case "JobManagement":
        return <JobManagement />
      default:
        return <AdminHome />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      <SidebarProvider>
        {/* Fixed Width Sidebar */}
        <AdminSidebar className="w-64 h-full flex-shrink-0" />
        
        {/* Main Content Area */}
        <SidebarInset className="flex-1 h-full overflow-hidden flex flex-col">
          {/* Fixed Header */}
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
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentView ? renderAdminView(currentView) : null}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
