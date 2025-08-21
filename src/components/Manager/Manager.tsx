// src/components/Manager/Manager.tsx
import React, { useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/themeToggle";
import { ManagerSidebar } from "./ManagerSidebar";
import ManagerDashboard from "./ManagerDashboard";
import ManagerCalendar from "./ManagerCalendar";
import CandidateManagement from "./CandidateManagement";
import InterviewManagement from "./InterviewManagement";
import FeedbackManagement from "./FeedbackManagement";
import ManagerAnalytics from "./ManagerAnalytics";

const Manager: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentView = useSelector(
    (state: RootState) => state.managerView.currentManagerPage
  );
  const orgUser = useSelector((state: RootState) => state.orgAuth.user);
  const isAdmin = orgUser?.role === 'ADMIN';

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
    localStorage.setItem("managerCurrentView", currentView);
  }, [currentView]);

  const renderManagerView = (currentView: string): React.ReactNode => {
    switch (currentView) {
      case "manager-home":
        return <ManagerDashboard />;
      case "manager-calendar":
        return <ManagerCalendar />;
      case "candidate-management":
        return <CandidateManagement />;
      case "interview-management":
        return <InterviewManagement />;
      case "feedback-management":
        return <FeedbackManagement />;
      case "manager-analytics":
        return <ManagerAnalytics />;
      default:
        return <ManagerDashboard />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      <SidebarProvider>
        <ManagerSidebar className="w-64 h-full flex-shrink-0" />

        <SidebarInset className="flex-1 h-full overflow-hidden flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 px-4 justify-between w-full">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    <header className="px-1 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          {isAdmin ? 'Manager Portal - Admin View' : 'Manager Portal'}
                        </span>
                        {isAdmin && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Admin Mode
                          </span>
                        )}
                      </div>
                    </header>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
            {currentView ? renderManagerView(currentView) : null}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default Manager;
