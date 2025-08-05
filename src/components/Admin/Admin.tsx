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
          dispatch(setUser(res.data.user)); // Save org user info in Redux store
        }
      } catch (error) {
        console.error("Failed to fetch org user profile:", error);
        // navigate("/org/login"); // Redirect to org login if error occurs
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
      default:
        return <AdminHome />;
    }
  };

  return (
    <SidebarProvider>
      {/* Left navigation sidebar */}
      <AdminSidebar className="static md:static h-full" />

      {/* Main content wrapper */}
      <SidebarInset className=" overflow-hidden">
        {/* Top header section */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:bg-gray-900">
          <div className="flex items-center gap-2 px-4 justify-between w-full">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" /> {/* Toggle sidebar */}
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              {/* Admin breadcrumb */}
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
        {currentView ? renderAdminView(currentView) : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
