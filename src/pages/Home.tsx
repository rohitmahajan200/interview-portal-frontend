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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationStatus: Stage[] = [
    {
      stage: "registered",
      date: "2025-06-01",
      status: "completed",
      comment: "User registered",
    },
    {
      stage: "hr",
      date: "2025-06-03",
      status: "completed",
      comment: "HR screening done",
    },
    {
      stage: "assessment",
      date: "2025-07-09",
      status: "completed",
      comment: "Passed",
    },
    {
      stage: "technical",
      date: "2025-08-01",
      status: "completed",
      comment: "Passed",
    },
    {
      stage: "feedback",
      date: "2025-08-01",
      status: "current",
      comment: "-",
    },
  ];

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
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

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
        console.error("Failed to fetch candidate events:", error);
        setError("Failed to load events. Please try again later.");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
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
