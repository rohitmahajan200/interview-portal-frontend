import { useEffect, useState } from "react";
import JobList from "@/components/JobList";
import { ProgressBar } from "@/components/ProgressBar";
import EventNotificationCard from "@/components/ui/EventNotificationCard";
import api from "@/lib/api";

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
  // Add these to your existing state declarations
  const [user, setUser] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add this function in your Home component before useEffect
  const convertStageHistoryToProgress = (stageHistory: any[], currentStage: string): Stage[] => {
    // Sort stage history by changed_at (oldest first)
    const sortedHistory = stageHistory.sort((a, b) => 
      new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );

    // Convert stage history to progress format
    const progressStages: Stage[] = sortedHistory.map((historyItem, index) => {
      const isCurrentStage = historyItem.to_stage === currentStage;
      
      return {
        stage: historyItem.to_stage, // Keep original stage name - component will map it
        date: historyItem.changed_at.split('T')[0],
        status: isCurrentStage ? "current" : "completed",
        comment: historyItem.remarks || historyItem.action || "-"
      };
    });

    return progressStages;
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

  // Replace your existing useEffect with this updated version
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data first
        const userRes = await api.get("/candidates/me");
        setUser(userRes.data.user);

        // Convert stage history to progress bar format
        if (userRes.data.user.stage_history && userRes.data.user.current_stage) {
          const progressStages = convertStageHistoryToProgress(
            userRes.data.user.stage_history,
            userRes.data.user.current_stage
          );
          setApplicationStatus(progressStages);
        }

        // Fetch events data
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
        <ProgressBar stages={applicationStatus} />
      </div>
    </div>
  );
};

export default Home;
