import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import api from "@/lib/api";
import { format } from "date-fns";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  CalendarClock,
  CheckCircle2,
  MapPin,
  Play,
  Video,
  XCircle,
  Users as UsersIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface Interview {
  _id: string;
  title: string;
  interview_type:
    | "hr_questionnaire"
    | "technical_interview"
    | "managerial_round";
  status: "scheduled" | "completed";
  scheduled_at: string;
  end_time: string;
  type: "online" | "offline";
  meeting_link?: string;
  address?: string;
  platform?: string;
  description?: string;
  interviewers: {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
  }[];
  scheduled_by?: { name: string; email: string; role: string };
}

/* -------------------------------------------------------------------------- */
/*                               Helper logic                                 */
/* -------------------------------------------------------------------------- */

const DISPLAY_LABEL: Record<Interview["interview_type"], string> = {
  hr_questionnaire: "HR Round",
  technical_interview: "Technical Round",
  managerial_round: "Managerial Round",
};

const computeDisplayStatus = (iv: Interview) => {
  if (iv.status === "completed") return "Completed";
  const now = Date.now();
  const start = new Date(iv.scheduled_at).getTime();
  const end = new Date(iv.end_time).getTime();

  if (now < start) return "Upcoming";
  if (now >= start && now <= end) return "Ongoing";
  return "Missed";
};

/* Badge variant type from the component’s props */
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const statusBadge = (status: string) => {
  const variants: Record<
    string,
    { color: BadgeVariant; icon: ReactElement | null; label: string }
  > = {
    Completed: {
      color: "outline",
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      label: "Completed",
    },
    Ongoing: {
      color: "default",
      icon: <Play className="h-4 w-4" />,
      label: "Ongoing",
    },
    Upcoming: {
      color: "secondary",
      icon: <CalendarClock className="h-4 w-4" />,
      label: "Upcoming",
    },
    Missed: {
      color: "destructive",
      icon: <XCircle className="h-4 w-4" />,
      label: "Missed",
    },
  };
  const v = variants[status];
  return (
    <Badge variant={v.color} className="gap-1 px-2 py-1">
      {v.icon}
      {v.label}
    </Badge>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function Interviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------------------ Fetch once ------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/candidates/interviews");
        setInterviews(res.data.data as Interview[]);
      } catch (e) {
              } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------------------ Utilities ------------------------------- */
  const canJoin = (iv: Interview) => {
    if (iv.type !== "online") return false;
    const now = Date.now();
    const start = new Date(iv.scheduled_at).getTime() - 10 * 60 * 1000; // 10 min early
    const end = new Date(iv.end_time).getTime();
    return now >= start && now <= end;
  };

  /* ------------------------------- Render --------------------------------- */
  if (loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Loading interviews…
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto w-full space-y-6">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
        Your Interviews
      </h2>

      {interviews.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No interviews found.
        </div>
      )}

      {interviews.map((iv) => {
        const status = computeDisplayStatus(iv);
        const joinable = canJoin(iv);

        return (
          <Card
            key={iv._id}
            className="group border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            {/* --------------------------- Header --------------------------- */}
            <CardHeader className="pb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                {iv.type === "online" ? (
                  <Video className="h-5 w-5 text-blue-600" />
                ) : (
                  <MapPin className="h-5 w-5 text-amber-600" />
                )}
                <CardTitle className="text-lg font-semibold">
                  {DISPLAY_LABEL[iv.interview_type] ?? iv.title}
                </CardTitle>
              </div>
              {statusBadge(status)}
            </CardHeader>

            {/* -------------------------- Content -------------------------- */}
            <CardContent className="space-y-4">
              {/* Schedule */}
              <div className="text-sm">
                <span className="font-medium">Schedule:&nbsp;</span>
                {format(new Date(iv.scheduled_at), "PPpp")} –{" "}
                {format(new Date(iv.end_time), "p")}
              </div>

              {/* Location / link */}
              <div className="text-sm">
                {iv.type === "online" ? (
                  <>
                    <span className="font-medium">Meeting&nbsp;Link:&nbsp;</span>
                    <a
                      href={iv.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline break-all"
                    >
                      {iv.meeting_link}
                    </a>
                    {iv.platform && (
                      <span className="ml-2 text-muted-foreground">
                        ({iv.platform})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-medium">Address:&nbsp;</span>
                    {iv.address ?? "—"}
                  </>
                )}
              </div>

              {/* Interviewers */}
              <div className="text-sm">
                <span className="font-medium">Interviewers:&nbsp;</span>
                {iv.interviewers.length ? (
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    {iv.interviewers.map((p) => (
                      <li key={p._id}>
                        {p.name ?? "Unnamed"} (
                        <a
                          href={`mailto:${p.email}`}
                          className="text-blue-500 dark:text-blue-400 hover:underline"
                        >
                          {p.email}
                        </a>
                        )
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Not listed"
                )}
              </div>

              {/* Description */}
              {iv.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {iv.description}
                </p>
              )}
            </CardContent>

            <Separator />

            {/* --------------------------- Footer --------------------------- */}
            <CardFooter className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UsersIcon className="h-3 w-3" />
                Scheduled by:&nbsp;
                {iv.scheduled_by?.name ?? "—"}
              </div>

              {iv.type === "online" && status !== "Missed" && (
                <Button
                  size="sm"
                  variant={joinable ? "default" : "outline"}
                  disabled={!joinable}
                  asChild
                >
                  <a
                    href={joinable ? iv.meeting_link : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {joinable ? "Join meeting" : "Not yet available"}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
