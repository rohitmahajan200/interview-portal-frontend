// src/components/HR/index.tsx
import { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/app/store";

import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/themeToggle";

import { setUser } from "@/features/Org/Auth/orgAuthSlice";
import { setNotifications } from "@/features/Org/Notifications/orgNotificationSlice";
import api from "@/lib/api";
import pushNotificationService from "@/services/pushNotificationService";

import HRHome from "./HRHome";
import HrQuestionsManagement from "./HrQuestionsManagement";
import HRQuestionnaireBuilder from "./HRQuestionnaireBuilder";
import CandidateReview from "./CandidateReview";
import InterviewScheduling from "./InterviewScheduling";
import HRAnalytics from "./HRAnalytics";
import HRNotifications from "./HRNotifications";
import { HRSidebar } from "./HRSidebar";
import SystemConfiguration from "./SystemConfiguration";

// toasts
import { Toaster, toast } from "react-hot-toast";

export default function Hr() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentView = useSelector(
    (state: RootState) => state.hrView.currentHRPage
  );
  const user = useSelector((state: RootState) => state.orgAuth.user);

  const supported = pushNotificationService.isSupported;
  const [open, setOpen] = useState(Notification.permission === "default");

  // 🔔 Ask permission only if role is HR
  useEffect(() => {
    if (!user || user.role !== "HR") return;

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

    pushNotificationService.initializeServiceWorker().catch((e) => {
      console.error("SW init failed:", e);
      toast.error("Failed to initialize notifications.");
    });
  }, [supported, user]);

  const handleEnableNotifications = async () => {
    try {
      await pushNotificationService.subscribe();
      if (Notification.permission === "granted") {
        toast.success("Notifications enabled!");
      } else if (Notification.permission === "denied") {
        toast(
          "Notifications were blocked. Enable them in site settings to receive alerts.",
          { icon: "⚠️" }
        );
      }
      setOpen(false);
    } catch (e) {
      console.error("Subscribe failed:", e);
      toast.error("Couldn’t enable notifications.");
    }
  };

  const fetchOrgNotifications = useCallback(async () => {
    try {
      const response = await api.get("/org/notifications");
      if (response.data?.success) {
        dispatch(setNotifications(response.data.data || []));
      }
    } catch (e) {
      console.error("Failed to fetch org notifications:", e);
      toast.error("Failed to fetch notifications.");
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
        toast.error("Failed to load profile.");
      }
    };

    fetchOrgUser();
    fetchOrgNotifications();
  }, [dispatch, navigate, fetchOrgNotifications]);

  useEffect(() => {
    localStorage.setItem("hrCurrentView", currentView);
  }, [currentView]);

  const renderHRView = (view: string) => {
    switch (view) {
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
      <Toaster position="bottom-right" />

      <SidebarProvider>
        <HRSidebar className="w-64 h-full flex-shrink-0" />
        <SidebarInset className="flex-1 h-full overflow-hidden flex flex-col">
          {/* Only show dialog when user is HR and permission is 'default' */}
          {user?.role === "HR" && (
            <Dialog
              open={open && Notification.permission === "default"}
              onOpenChange={setOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enable notifications?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600">
                  Get real-time updates for candidates, scheduling, and alerts.
                </p>
                <DialogFooter>
                  <Button onClick={handleEnableNotifications}>
                    Allow notifications
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

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
