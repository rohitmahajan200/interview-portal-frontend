import { AppSidebar } from "@/components/app-sidebar";
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
import { setUser } from "@/features/Candidate/auth/authSlice";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Importing page views
import Home from "./Home";
import Assessments from "./Assessments";
import Interviews from "./Interviews";
import Feedback from "./Feedback";
import Profile from "./Profile";
import Settings from "./Settings";
import ThemeToggle from "@/components/themeToggle";
import Spinner from "@/components/ui/spinner";
import DocumentUploadForm from "./DocumentUploadForm";

export default function Page() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [candidateData, setCandidateData] = useState<any>(null);
  
  const currentView = useSelector((state: RootState) => state.view.currentView);
  // const user = useSelector((state: RootState) => state.auth.user); // Get user from Redux

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/candidates/me");
        if (res.data.user) {
          dispatch(setUser(res.data.user)); // Save user info in Redux store
          setCandidateData(res.data.user);
          
          // Check if candidate is hired and needs to upload documents
          const candidate = res.data.user;
          if (candidate.status === 'hired' && !candidate.documents_submitted) {
            setShowDocumentUpload(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch candidate profile:", error);
        navigate("/login"); // Redirect to login if error occurs
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidate();
  }, [dispatch, navigate]);

  useEffect(() => {
    localStorage.setItem("currentView", currentView);
  }, [currentView]);

  // Handle document upload completion
  const handleDocumentSubmissionComplete = async () => {
    try {
      // Refresh candidate data to get updated status
      const res = await api.get("/candidates/me");
      if (res.data.user) {
        dispatch(setUser(res.data.user));
        setCandidateData(res.data.user);
      }
      setShowDocumentUpload(false);
    } catch (error) {
      console.error("Failed to refresh candidate data:", error);
      setShowDocumentUpload(false);
    }
  };

  const renderView = (currentView: string) => {
    switch (currentView) {
      case "home":
        return <Home />;
      case "assessments":
        return <Assessments />;
      case "interviews":
        return <Interviews />;
      case "feedback":
        return <Feedback />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <Home />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Spinner />
        </div>
      </div>
    );
  }

  // Show document upload form if candidate is hired and hasn't submitted documents
  if (showDocumentUpload && candidateData) {
    return (
      <div>
        <DocumentUploadForm
          candidateId={candidateData._id}
          onSubmissionComplete={handleDocumentSubmissionComplete}
          isOpen={showDocumentUpload}
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* Left navigation sidebar */}
      <AppSidebar />

      {/* Main content wrapper */}
      <SidebarInset>
        {/* Top header section */}
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
                        Welcome To Change Networks!
                      </span>
                    </div>
                  </header>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <ThemeToggle />
          </div>
        </header>
        {currentView ? renderView(currentView) : null}
      </SidebarInset>

      {/* Document Upload Form Modal - Only show if needed */}
      {showDocumentUpload && candidateData && (
        <DocumentUploadForm
          candidateId={candidateData._id}
          onSubmissionComplete={handleDocumentSubmissionComplete}
          isOpen={showDocumentUpload}
        />
      )}
    </SidebarProvider>
  );
}
