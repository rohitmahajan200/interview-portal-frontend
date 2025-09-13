// src/components/HR/index (your Hr component file)
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
import { setNotifications } from "@/features/Org/Notifications/orgNotificationSlice"; // ← add
import api from "@/lib/api";
import { useCallback, useEffect } from "react"; // ← useCallback
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/themeToggle";
import HRHome from "./HRHome";
import HrQuestionsManagement from "./HrQuestionsManagement";
import HRQuestionnaireBuilder from "./HRQuestionnaireBuilder";
import CandidateReview from "./CandidateReview";
import InterviewScheduling from "./InterviewScheduling";
import HRAnalytics from "./HRAnalytics";
import HRNotifications from "./HRNotifications";
import { HRSidebar } from "./HRSidebar";
import SystemConfiguration from "./SystemConfiguration";
import { OrgPushNotificationToggle } from "../OrgPushNotificationToggle";

export default function Hr() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentView = useSelector(
    (state: RootState) => state.hrView.currentHRPage
  );

  const fetchOrgNotifications = useCallback(async () => {
    try {
      const response = await api.get("/org/notifications");
      if (response.data?.success) {
        dispatch(setNotifications(response.data.data || []));
      }
    } catch (e) {
      console.error("Failed to fetch org notifications:", e);
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
    fetchOrgNotifications(); // load notifications so badge shows
  }, [dispatch, navigate, fetchOrgNotifications]);

  useEffect(() => {
    localStorage.setItem("hrCurrentView", currentView);
  }, [currentView]);

  const renderHRView = (currentView: string) => {
    switch (currentView) {
      case "hr-home":
        return <HRHome />;
      case "hr-questions":
        return <HrQuestionsManagement />;
      case "hr-questionnaire":
        return <HRQuestionnaireBuilder />;
      case "candidate-review":
        return <CandidateReview />;
      case "interview-scheduling":
        return <InterviewScheduling />;
      case "hr-analytics":
        return <HRAnalytics />;
      case "notifications":
        return <HRNotifications />;
      case "config":
        return <SystemConfiguration />;
      default:
        return <HRHome />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      <OrgPushNotificationToggle showTestButton={true} />
      <SidebarProvider>
        <HRSidebar className="w-64 h-full flex-shrink-0" />
        <SidebarInset className="flex-1 h-full overflow-hidden flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 px-4 justify-between w-full">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <header className="px-1 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          HR Portal - Change Networks
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
            {currentView ? renderHRView(currentView) : null}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
