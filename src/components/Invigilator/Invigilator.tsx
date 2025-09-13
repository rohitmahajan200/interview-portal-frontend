// src/components/Invigilator/Invigilator.tsx
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

import { InvigilatorSidebar } from "./InvigilatorSidebar";
import InvigilatorHome from "./InvigilatorHome";
import InvigilatorQuestionsManagement from "./InvigilatorQuestionsManagement";
import InvigilatorQuestionnaireBuilder from "./InvigilatorQuestionnaireBuilder";
import CandidateReview from "./CandidateReview";
import InterviewScheduling from "./InterviewScheduling";
import InvigilatorAnalytics from "./InvigilatorAnalytics";
import InvigilatorNotifications from "./InvigilatorNotifications";
import SystemConfiguration from "./SystemConfiguration";

// toasts
import { Toaster, toast } from "react-hot-toast";

export default function Invigilator() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentView = useSelector(
    (state: RootState) => state.invigilator.currentHRPage
  );
  const user = useSelector((state: RootState) => state.orgAuth.user);

  const supported = pushNotificationService.isSupported;
  const [open, setOpen] = useState(Notification.permission === "default");

  // 🔔 Notifications only if role = invigilator
  useEffect(() => {
    if (!user || user.role !== "INVIGILATOR") return;

    if (!supported) {
      toast.error("This browser doesn’t support push notifications.");
      return;
    }

    const perm = Notification.permission;
    if (perm === "default") setOpen(true);
    else if (perm === "denied") {
      setOpen(false);
      toast("Notifications are blocked. Enable them in browser settings.", {
        icon: "⚠️",
      });
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
        toast("Notifications blocked. Enable them in settings.", {
          icon: "⚠️",
        });
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
        if (res.data.user) dispatch(setUser(res.data.user));
      } catch (error) {
        console.error("Failed to fetch org user profile:", error);
      }
    };

    fetchOrgUser();
    fetchOrgNotifications();
  }, [dispatch, navigate, fetchOrgNotifications]);

  useEffect(() => {
    localStorage.setItem("invigilatorCurrentView", currentView);
  }, [currentView]);

  const renderInvigilatorView = (view: string) => {
    switch (view) {
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
      case "invigilator-analytics":
        return <InvigilatorAnalytics />;
      case "notifications":
        return <InvigilatorNotifications />;
      case "config":
        return <SystemConfiguration />;
      default:
        return <InvigilatorHome />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      <Toaster position="bottom-right" />

      <SidebarProvider>
        <InvigilatorSidebar className="w-64 h-full flex-shrink-0" />

        <SidebarInset className="flex-1 h-full overflow-hidden flex flex-col">
          {user?.role === "INVIGILATOR" && (
            <Dialog
              open={open && Notification.permission === "default"}
              onOpenChange={setOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enable notifications?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600">
                  Get real-time updates for candidates and monitoring.
                </p>
                <DialogFooter>
                  <Button onClick={handleEnableNotifications}>
                    Allow notifications
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 px-4 justify-between w-full">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <header className="px-1 rounded-xl">
                      <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Invigilator Portal - Change Networks
                      </span>
                    </header>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4">
            {currentView ? renderInvigilatorView(currentView) : null}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
