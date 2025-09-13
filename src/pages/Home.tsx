// src/components/Candidate/Home.tsx
import { useEffect, useState } from "react";
import JobList from "@/components/JobList";
import StageHistoryViewer from "@/components/ProgressBar";
import EventNotificationCard from "@/components/ui/EventNotificationCard";
import api from "@/lib/api";
import pushNotificationService from "@/services/pushNotificationService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";

type EventType = "Assessment" | "Interview";

interface Event {
  id: string;
  type: EventType;
  title: string;
  date: string;
}

interface Stage {
  stage: string;
  date: string;
  status: "completed" | "current" | "pending";
  comment: string;
}

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔔 push notification dialog
  const supported = pushNotificationService.isSupported;
  const [open, setOpen] = useState(Notification.permission === "default");

  useEffect(() => {
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
  }, [supported]);

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

  const convertStageHistoryToProgress = (
    stageHistory: any[],
    currentStage: string
  ): Stage[] => {
    const sortedHistory = stageHistory.sort(
      (a, b) =>
        new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );
    return sortedHistory.map((historyItem) => {
      const isCurrentStage = historyItem.to_stage === currentStage;
      return {
        stage: historyItem.to_stage,
        date: historyItem.changed_at.split("T")[0],
        status: isCurrentStage ? "current" : "completed",
        comment: historyItem.remarks || historyItem.action || "-",
      };
    });
  };

  const getAssessmentTitle = (assessmentType: string): string => {
    switch (assessmentType) {
      case "domain-specific":
        return "Technical Assessment";
      case "hr":
        return "HR Assessment";
      default:
        return "Assessment";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userRes = await api.get("/candidates/me");
        setUser(userRes.data.user);

        if (userRes.data.user.stage_history && userRes.data.user.current_stage) {
          const progressStages = convertStageHistoryToProgress(
            userRes.data.user.stage_history,
            userRes.data.user.current_stage
          );
          setApplicationStatus(progressStages);
        }

        const [assessmentRes, interviewRes] = await Promise.all([
          api.get("/candidates/assessments"),
          api.get("/candidates/interviews"),
        ]);

        const assessments: Event[] = (assessmentRes.data.combined || []).map(
          (a: any): Event => ({
            id: a._id,
            type: "Assessment",
            title: getAssessmentTitle(a.assessment_type),
            date: a.assigned_at,
          })
        );

        const interviews: Event[] = (interviewRes.data.data || []).map(
          (i: any): Event => ({
            id: i._id,
            type: "Interview",
            title: `${i.interview_type} Round ${i.round}`,
            date: i.scheduled_at,
          })
        );

        setEvents([...assessments, ...interviews]);
      } catch (error) {
        console.error("Failed to fetch candidate data:", error);
        setError("Failed to load data. Please try again later.");
        setEvents([]);
        setApplicationStatus([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-background text-foreground">
      <Toaster position="bottom-right" />

      {/* 🔔 Notification dialog */}
      <Dialog
        open={open && Notification.permission === "default"}
        onOpenChange={setOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable notifications?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Stay updated with interview schedules and assessment alerts.
          </p>
          <DialogFooter>
            <Button onClick={handleEnableNotifications}>
              Allow notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <JobList />
        <div className="rounded-xl bg-muted/50 dark:bg-muted/30">
          <EventNotificationCard events={events} />
        </div>
      </div>
      <div className="min-h-[200px] rounded-xl bg-muted/50 dark:bg-muted/30 p-4">
        <StageHistoryViewer stages={applicationStatus} />
      </div>
    </div>
  );
};

export default Home;
