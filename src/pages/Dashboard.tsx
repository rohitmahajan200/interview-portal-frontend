import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { setUser } from "@/features/Candidate/auth/authSlice";
import { setNotifications } from "@/features/Candidate/notifications/notificationSlice";
import api from "@/lib/api";
import { useEffect, useState, useRef, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, FileText, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NotificationsPage from "./NotificationsPage";

interface CandidateData {
  _id: string;
  status: string;
  hired_docs_present?: boolean;
  [key: string]: unknown;
}

export default function Page() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [candidateData, setCandidateData] = useState<CandidateData | null>(
    null
  );
  const [showDocumentBanner, setShowDocumentBanner] = useState(false);
  const [documentsSubmitted, setDocumentsSubmitted] = useState(false);

  // 🔔 Ref for notification polling
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🔔 Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/candidates/notifications");
      if (res.data.success) {
        dispatch(setNotifications(res.data.data || []));
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/candidates/me");
        if (res.data.user) {
          dispatch(setUser(res.data.user));
          setCandidateData(res.data.user);

          // Check if candidate is hired and needs to upload documents
          const candidate = res.data.user;
          if (candidate.status === "hired") {
            if (!candidate.hired_docs_present) {
              setShowDocumentBanner(true);
              setDocumentsSubmitted(false);
            } else {
              setDocumentsSubmitted(true);
              setShowDocumentBanner(false);
            }
          }

          // 🔔 Fetch notifications initially
          await fetchNotifications();

          // 🔔 Start polling every 1 min
          notificationIntervalRef.current = setInterval(
            fetchNotifications,
            60000
          );
        }
      } catch (error) {
        console.error("Failed to fetch candidate profile:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidate();

    // Cleanup interval on unmount
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, [dispatch, navigate, fetchNotifications]);

  const currentView = useSelector((state: RootState) => state.view.currentView);

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
        setDocumentsSubmitted(true);
      }
      setShowDocumentUpload(false);
      setShowDocumentBanner(false);

      alert("🎉 Documents submitted successfully!");
    } catch (error) {
      console.error("Failed to refresh candidate data:", error);
      setShowDocumentUpload(false);
    }
  };

  const handleOpenDocumentForm = () => {
    setShowDocumentUpload(true);
  };

  const handleCloseDocumentForm = () => {
    setShowDocumentUpload(false);
  };

  const handleDismissBanner = () => {
    setShowDocumentBanner(false);
  };

  const renderView = (currentView: string) => {
    switch (currentView) {
      case "home":
        return <Home />;
      case "notifications":
        return <NotificationsPage />;
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

        {/* Document Upload Banner */}
        {showDocumentBanner && candidateData && (
          <div className="mx-4 mt-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <Upload className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      🎉 Congratulations! You've been hired!
                    </span>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      Complete your onboarding by uploading the required
                      documents.
                    </p>
                  </div>
                  <Button
                    onClick={handleOpenDocumentForm}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissBanner}
                  className="text-green-600 hover:text-green-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Documents Submitted Success Banner */}
        {documentsSubmitted && candidateData?.status === "hired" && (
          <div className="mx-4 mt-4">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <span className="font-semibold text-blue-800 dark:text-blue-200">
                  ✅ Documents Successfully Submitted!
                </span>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Your onboarding documents have been received.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {currentView ? renderView(currentView) : null}
      </SidebarInset>

      {/* Document Upload Form Modal */}
      {showDocumentUpload && candidateData && (
        <DocumentUploadForm
          candidateId={candidateData._id}
          onSubmissionComplete={handleDocumentSubmissionComplete}
          isOpen={showDocumentUpload}
          onClose={handleCloseDocumentForm}
        />
      )}
    </SidebarProvider>
  );
}
