import api from "@/lib/api";
import { useEffect, useMemo, useState, type JSX } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList,
  Users,
  Timer,
  CalendarClock,
  AlertTriangle,
  Search,
  Play,
  RotateCcw,
  CheckCircle2,
  Ban,
  Copy,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type TechnicalAssessment = {
  _id: string;
  assigned_at: string;
  due_at: string;
  started_at?: string;
  completed_at?: string;
  status: "pending" | "started" | "completed" | "expired";
  exam_duration?: number;
  is_seb?: boolean;
  access_token?: string;
  time_remaining_ms?: number;
  assessment_type?: string;
  assigned_by?: { name?: string; email?: string; role?: string };
  questions_count?: number;
};

type HRAssessment = {
  id: string;
  assigned_at: string;
  due_at: string;
  status: "pending" | "submitted" | "expired";
  assessment_type: "hr";
};

type Row =
  | (TechnicalAssessment & { kind: "technical" })
  | (HRAssessment & { kind: "hr" });

/* -------------------------------------------------------------------------- */
/*                               Helper functions                             */
/* -------------------------------------------------------------------------- */

const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "—";

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

const humanRemaining = (ms?: number) => {
  if (ms === undefined) return "—";
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${plural(h, "hr")} ${plural(m, "min")}`;
  if (m) return `${plural(m, "min")} ${plural(sec, "sec")}`;
  return `${plural(sec, "sec")}`;
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "secondary" as const;
    case "started":
      return "default" as const;
    case "completed":
    case "submitted":
      return "outline" as const;
    case "expired":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export default function Assessments() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSebDialog, setShowSebDialog] = useState<null | TechnicalAssessment>(null);
  const [query, setQuery] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [filter, setFilter] =
    useState<"all" | "pending" | "started" | "completed" | "expired">("all");
  const [isDownloaded, setIsDownloaded] = useState(false);

  /* ------------------------------ Action logic ----------------------------- */

  const handleAction = (row: Row) => {
    /* HR questionnaire ------------------------------------------------------ */
    if (row.kind === "hr") {
      return navigate("/start-hrqna");
    }

    /* Technical assessment - always show dialog ----------------------------- */
    const token = row.access_token;
    if (!token) return;
    
    setShowSebDialog(row); // Always show dialog for technical assessments
  };

  /* ------------------------------ Data fetch ----------------------------- */

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        /* Technical assessments --------------------------------------------- */
        const techRes = await api.get("/candidates/assessments");
        const techList: TechnicalAssessment[] =
          techRes?.data?.data?.assessments ??
          techRes?.data?.assessments ??
          techRes?.data?.combined ??
          [];

        const techRows: Row[] = techList.map((t) => ({
          ...t,
          kind: "technical",
        }));

        /* HR questionnaire (optional) -------------------------------------- */
        let hrRows: Row[] = [];
        try {
          const hrRes = await api.get("/candidates/hrqavailable");
          const hr = hrRes?.data?.data;
          if (hr?.assigned_at && hr?.due_at && hr?.status) {
            hrRows = [
              {
                id: "hr-current",
                assigned_at: hr.assigned_at,
                due_at: hr.due_at,
                status: hr.status,
                assessment_type: "hr",
                kind: "hr",
              },
            ];
          }
        } catch {
          /* 404 = no HR questionnaire — ignore */
        }

        if (!mounted) return;
        setRows(
          [...techRows, ...hrRows].sort(
            (a, b) =>
              new Date(b.assigned_at).getTime() -
              new Date(a.assigned_at).getTime()
          )
        );
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Failed to fetch assessments");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------ Derived data ---------------------------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const statusOk =
      filter === "all"
        ? true
        : filter === "completed"
        ? r.status === "completed" || r.status === "submitted"
        : r.status === filter;
      const searchHaystack = `${r.kind} ${r.assessment_type ?? ""} ${
        r.status
      } ${fmtDateTime(r.assigned_at)} ${fmtDateTime(r.due_at)} ${
        (r as any)?.assigned_by?.name ?? ""
      }`.toLowerCase();
      const queryOk = q ? searchHaystack.includes(q) : true;
      return statusOk && queryOk;
    });
  }, [rows, query, filter]);

  const counts = useMemo(() => {
    const base = {
      all: rows.length,
      pending: 0,
      started: 0,
      completed: 0,
      expired: 0,
    } as Record<string, number>;
    rows.forEach((r) => {
      const status = r.status === "submitted" ? "completed" : r.status;
      base[status] = (base[status] || 0) + 1;
    });
    return base as {
      all: number;
      pending: number;
      started: number;
      completed: number;
      expired: number;
    };
  }, [rows]);

  /* ------------------------------- Rendering ------------------------------ */

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header / search ----------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Assigned Assessments
        </h2>
        <div className="relative w-full md:w-64">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assessments…"
            className="pl-9"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Filter buttons ------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          ["all", counts.all, "All"],
          ["pending", counts.pending, "Pending"],
          ["started", counts.started, "In Progress"],
          ["completed", counts.completed, "Completed"],
          ["expired", counts.expired, "Expired"],
        ] as const).map(([key, val, label]) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            className="justify-between"
            onClick={() => setFilter(key as any)}
          >
            <span>{label}</span>
            <Badge variant={filter === key ? "secondary" : "outline"}>
              {val}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Summary cards ------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Technical</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Items</span>
            </div>
            <Badge variant="outline">
              {rows.filter((r) => r.kind === "technical").length}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">HR</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Items</span>
            </div>
            <Badge variant="outline">
              {rows.filter((r) => r.kind === "hr").length}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Due soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Sorted by newest assignment
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Error / loading / empty states -------------------------------------- */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="animate-pulse p-6 space-y-4">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No assessments to show.
          </CardContent>
        </Card>
      ) : (
        /* ------------------------------------------------------------------ */
        /*                             Data table                             */
        /* ------------------------------------------------------------------ */
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <Table className="min-w-[900px]">
            <TableCaption className="text-sm text-gray-500 dark:text-gray-400 p-4">
              HR & Technical assessments with actions.
            </TableCaption>
            <TableHeader className="bg-gray-100 dark:bg-gray-800">
              <TableRow>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Assigned</TableHead>
                <TableHead className="text-center">Due</TableHead>
                <TableHead className="text-center">Details</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((r) => {
                const isTech = r.kind === "technical";
                const status = r.status;

                /* ------------------------------------------------------------------ */
                /*                    Determine button / label state                   */
                /* ------------------------------------------------------------------ */
                const isPending = status === "pending";
                const isStarted = status === "started";
                const isHrSubmitted =
                  r.kind === "hr" && status === "submitted";
                const isCompleted = status === "completed";
                const isExpired = status === "expired";

                /* showButton:
                   - Technical: pending & started
                   - HR: pending only                                               */
                const showButton =
                  (isTech && (isPending || isStarted)) ||
                  (r.kind === "hr" && isPending);

                /* Button text / icons --------------------------------------------- */
                const btnLabel = isPending
                  ? "Start"
                  : isStarted
                  ? "Resume"
                  : "";

                const btnIcon = isPending ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                );

                /* Badge text / icons --------------------------------------------- */
                let badgeLabel = "";
                let badgeIcon: JSX.Element = <></>;

                if (isCompleted || isHrSubmitted) {
                  badgeLabel = isTech ? "Completed" : "Submitted";
                  badgeIcon = <CheckCircle2 className="h-4 w-4" />;
                } else if (isExpired) {
                  badgeLabel = "Expired";
                  badgeIcon = <Ban className="h-4 w-4" />;
                } else if (isStarted) {
                  /* should never hit (started always button) */
                  badgeLabel = "In Progress";
                  badgeIcon = <RotateCcw className="h-4 w-4" />;
                }

                return (
                  <TableRow
                    key={(r as any)._id || (r as any).id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    {/* --------------------- Type -------------------------------- */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isTech ? (
                          <ClipboardList className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Users className="h-4 w-4 text-purple-600" />
                        )}
                        <Badge variant="outline" className="capitalize">
                          {isTech ? r.assessment_type || "technical" : "hr"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* --------------------- Status ------------------------------ */}
                    <TableCell className="text-center">
                      <Badge
                        variant={statusBadgeVariant(status)}
                        className="capitalize"
                      >
                        {status}
                      </Badge>
                    </TableCell>

                    {/* ------------------ Assigned / Due ------------------------ */}
                    <TableCell className="text-center">
                      {fmtDateTime(r.assigned_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      {fmtDateTime(r.due_at)}
                    </TableCell>

                    {/* ---------------------- Details ---------------------------- */}
                    <TableCell className="text-center">
                      {isTech ? (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <Timer className="h-3 w-3" />
                            <span>
                              Duration:{" "}
                              {r.exam_duration ? `${r.exam_duration}m` : "—"}
                            </span>
                          </div>

                          {typeof r.time_remaining_ms === "number" &&
                            isStarted && (
                              <div className="space-y-1">
                                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                                  <CalendarClock className="h-3 w-3" />
                                  <span>
                                    Remaining:{" "}
                                    {humanRemaining(r.time_remaining_ms)}
                                  </span>
                                </div>
                                <Progress
                                  value={Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      r.exam_duration
                                        ? (r.time_remaining_ms! /
                                            (r.exam_duration * 60 * 1000)) *
                                            100
                                        : 0
                                    )
                                  )}
                                  className="h-2 w-48 mx-auto"
                                />
                              </div>
                            )}

                          {r.assigned_by?.name && (
                            <div className="text-[11px] text-muted-foreground">
                              By {r.assigned_by.name}
                            </div>
                          )}
                          {typeof r.questions_count === "number" && (
                            <div className="text-[11px] text-muted-foreground">
                              Questions: {r.questions_count}
                            </div>
                          )}
                          {r.is_seb && (
                            <div className="text-[11px] text-blue-600">
                              SEB required
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          HR questionnaire
                        </div>
                      )}
                    </TableCell>

                    {/* ---------------------- Action ----------------------------- */}
                    <TableCell className="text-center">
                      {showButton ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction(r)}
                        >
                          {btnIcon}
                          {btnLabel}
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 px-2 py-1 capitalize"
                        >
                          {badgeIcon}
                          {badgeLabel}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Updated Dialog with conditional content */}
        <Dialog
          open={Boolean(showSebDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setShowSebDialog(null);
              setIsDownloaded(false);
              setCopySuccess(false); // ✅ Add this line
            } else {
              setIsDownloaded(false);
              setCopySuccess(false); // ✅ Add this line
            }
          }}
        >

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showSebDialog?.is_seb ? "Safe Exam Browser Required" : "Assessment Access Token"}
            </DialogTitle>
            <DialogDescription>
              {showSebDialog?.is_seb ? (
                <>
                  To begin this assessment, Safe Exam Browser (SEB) will be launched.
                  <br />
                  <strong>Warning:</strong> SEB will close some apps automatically for
                  security reasons, and your computer may become locked down during
                  the exam.
                  <br /><br />
                  <strong>Important:</strong> Please note down your access token below before proceeding.
                </>
              ) : (
                "Your access token for this assessment:"
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Access Token Display */}
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Access Token:</div>
            <div className="font-mono text-sm break-all select-all bg-white dark:bg-gray-900 p-2 rounded border">
              {showSebDialog?.access_token}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`mt-2 w-full transition-all duration-200 ${
                copySuccess 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : ''
              }`}
              onClick={async () => {
                if (showSebDialog?.access_token) {
                  try {
                    await navigator.clipboard.writeText(showSebDialog.access_token);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  } catch (err) {
                                      }
                }
              }}
            >
              {copySuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 animate-pulse" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Token
                </>
              )}
            </Button>
          </div>


          {/* SEB-specific content */}
          {showSebDialog?.is_seb && (
            <>
              <p>
                <input
                  type="checkbox"
                  checked={isDownloaded}
                  onChange={(e) => setIsDownloaded(e.target.checked)}
                />{" "}
                I have already downloaded Safe Exam Browser (SEB)
              </p>

              <p className="mb-2 text-sm">
                If you do not have SEB installed, download it from
                <a
                  href="https://safeexambrowser.org/download_en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 underline"
                >
                  the official SEB download page
                </a>
                .
              </p>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSebDialog(null)}>
              Cancel
            </Button>

            {showSebDialog?.is_seb ? (
              <Button
                disabled={!isDownloaded}
                onClick={() => {
                  if (!showSebDialog) return;
                  const row = showSebDialog;

                  // Resolve API base and host safely
                  const apiBase =
                    (import.meta as any).env?.VITE_API_URL || window.location.origin;
                  const host = new URL(apiBase, window.location.origin).host;

                  // Include token in SEB link (URL-encoded)
                  const sebUrl = `seb://${host}/api/candidates/seb/config?token=${row.access_token}`;
                  
                  window.location.href = sebUrl;
                  setShowSebDialog(null);
                }}
              >
                Open Safe Exam Browser
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!showSebDialog) return;
                  
                  // For non-SEB assessments, redirect without token in query
                  const feBase =
                    ((import.meta as any).env?.VITE_FRONTEND_URL || "").replace(/\/$/, "");
                  window.location.href = `${feBase}/start-assessment`;
                  setShowSebDialog(null);
                }}
              >
                Continue to Assessment
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
