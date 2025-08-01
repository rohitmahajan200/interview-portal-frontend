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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [assessmentRes, interviewRes] = await Promise.all([
          api.get("/candidates/assessments"),
          api.get("/candidates/interviews"),
        ]);

        const assessments: Event[] = assessmentRes.data.assessments.map(
          (a: any): Event => ({
            id: a._id,
            type: "Assessment",
            title: a.assessment_type,
            date: a.assigned_at,
          })
        );

        const interviews: Event[] = interviewRes.data.data.map(
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
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-background text-foreground">
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
