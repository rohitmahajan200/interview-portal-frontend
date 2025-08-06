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
import ThemeToggle from "@/components/themeToggle";
import HRHome from "./HRHome";
import HrQuestionsManagement from "./HrQuestionsManagement";
import HRQuestionnaireBuilder from "./HRQuestionnaireBuilder";
import CandidateReview from "./CandidateReview";
import InterviewScheduling from "./InterviewScheduling";
import HRAnalytics from "./HRAnalytics";
import InterviewManagement from "./InterviewManagement";
import { HRSidebar } from "./HRSidebar";

export default function Hr() { // Changed from AdminDashboard
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Updated to use hrView slice instead of adminView
  const currentView = useSelector((state: RootState) => state.hrView.currentHRPage);
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
    // Updated localStorage key for HR
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
      case "interview-management":
        return <InterviewManagement />;
      default:
        return <HRHome />;
    }
  };

  return (
    <SidebarProvider>
      <HRSidebar className="static md:static h-full" />

      <SidebarInset className=" overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:bg-gray-900">
          <div className="flex items-center gap-2 px-4 justify-between w-full">
            <div className="flex items-center gap-2 px-4">
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
        {currentView ? renderHRView(currentView) : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
