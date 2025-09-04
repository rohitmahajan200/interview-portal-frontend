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
import CandidateReview from "./CandidateReview";
import InterviewScheduling from "./InterviewScheduling";
import { InvigilatorSidebar } from "./InvigilatorSidebar"; // Fixed import path
import InvigilatorHome from "./InvigilatorHome";
import InvigilatorQuestionsManagement from "./InvigilatorQuestionsManagement";
import InvigilatorQuestionnaireBuilder from "./InvigilatorQuestionnaireBuilder";
import InvigilatorAnalytics from "./InvigilatorAnalytics";
import SystemConfiguration from "./SystemConfiguration";

export default function Invigilator() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentView = useSelector(
    (state: RootState) => state.invigilator.currentHRPage
  );
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
    localStorage.setItem("invigilatorCurrentView", currentView);
  }, [currentView]);

  const renderHRView = (currentView: string) => {
    switch (currentView) {
      case "invigilator-home":
        return <InvigilatorHome />;
      case "invigilator-questions":
        return <InvigilatorQuestionsManagement />;
      case "invigilator-questionnaire":
        return <InvigilatorQuestionnaireBuilder />;
      case "candidate-review":
        return <CandidateReview />;
      case "interview-scheduling":
        return <InterviewScheduling />;
      case "analytics":
        return <InvigilatorAnalytics />;
      case "config":
        return <SystemConfiguration />;
      default:
        return <InvigilatorHome />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      <SidebarProvider>
          {/* Sidebar */}
          <InvigilatorSidebar className="w-64 h-full flex-shrink-0" />

          {/* Main Content Area */}
          <SidebarInset className="flex-1 h-full overflow-hidden flex flex-col">
            {/* Header */}
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
                            Invigilator Portal - Change Networks
                          </span>
                        </div>
                      </header>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                <ThemeToggle />
              </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
              {currentView ? renderHRView(currentView) : null}
            </main>
          </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
