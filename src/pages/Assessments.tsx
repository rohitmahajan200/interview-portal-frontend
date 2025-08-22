import api from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
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
  Eye,
} from "lucide-react";

// ---------------- Types ----------------

type TechnicalAssessment = {
  _id: string;
  assigned_at: string;
  due_at: string;
  started_at?: string;
  completed_at?: string;
  status: "pending" | "started" | "completed" | "expired";
  exam_duration?: number; // minutes
  is_seb?: boolean;
  access_token?: string;
  time_remaining_ms?: number;
  assessment_type?: string; // "technical" (from backend)
  assigned_by?: { name?: string; email?: string; role?: string };
  questions_count?: number;
};

type HRAssessment = {
  id: string; // synthetic key for UI (no id required to start)
  assigned_at: string;
  due_at: string;
  status: "pending" | "submitted" | "expired";
  assessment_type: "hr";
};

type Row =
  | (TechnicalAssessment & { kind: "technical" })
  | (HRAssessment & { kind: "hr" });

// --------------- Helpers ---------------

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function plural(n: number, w: string) {
  return `${n} ${w}${n === 1 ? "" : "s"}`;
}

function humanRemaining(ms?: number) {
  if (!ms && ms !== 0) return "—";
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${plural(h, "hr")} ${plural(m, "min")}`;
  if (m > 0) return `${plural(m, "min")} ${plural(sec, "sec")}`;
  return `${plural(sec, "sec")}`;
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "pending":
      return "secondary" as const;
    case "started":
      return "default" as const;
    case "completed":
      return "outline" as const;
    case "expired":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

// ------------- Component ---------------

export default function Assessments() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "started" | "completed" | "expired">("all");

  // ---- action handler
  const handleAction = (row: Row) => {
    // HR → local route as before
    if (row.kind === "hr") {
      return navigate("/start-hrqna");
    }

    // Technical → SEB or normal
    const token = row.access_token;
    if (!token) {
      console.warn("Missing access_token for technical assessment");
    }

    if (row.is_seb) {
      const apiBase = (import.meta as any).env?.VITE_API_URL || ""; // e.g. https://api.example.com or http://localhost:3000
      const hostNoProto = apiBase.replace(/^https?:\/\//, "").replace(/\/$/, "");
      // NOTE: If your API_URL already includes "/api", keep it. Otherwise, add it in the path below if needed.
      const sebUrl = `seb://${hostNoProto}/candidates/seb/config?token=${token}`;
      window.location.href = sebUrl;
      return;
    }

    const feBase = ((import.meta as any).env?.VITE_FRONTEND_URL || "").replace(/\/$/, "");
    window.location.href = `${feBase}/start-assessment?token=${token}`;
  };

  // ---- fetcher
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Technical assessments
        const techRes = await api.get("/candidates/assessments");
        const techList: TechnicalAssessment[] =
          techRes?.data?.data?.assessments || techRes?.data?.assessments || techRes?.data?.combined || [];

        // Map → Row with kind
        const techRows: Row[] = (techList || []).map((t) => ({ ...t, kind: "technical" }));

        // 2) HR assessment meta (optional)
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
        } catch (e: any) {
          // 404 means no HR questionnaire assigned — silently ignore
        }

        if (!mounted) return;
        // Combine and sort by assigned_at desc
        const combined = [...techRows, ...hrRows].sort((a, b) =>
          new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
        );
        setRows(combined);
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

  // ---- derived
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const statusOk = filter === "all" ? true : r.status === filter;
      const hay = `${r.kind === "technical" ? "technical" : "hr"} ${r.assessment_type || ""} ${r.status} ${fmtDateTime(r.assigned_at)} ${fmtDateTime(r.due_at)} ${(r as any)?.assigned_by?.name || ""}`.toLowerCase();
      const qOk = q ? hay.includes(q) : true;
      return statusOk && qOk;
    });
  }, [rows, query, filter]);

  const counts = useMemo(() => {
    const base = { all: rows.length, pending: 0, started: 0, completed: 0, expired: 0 } as Record<string, number>;
    rows.forEach((r) => (base[r.status] = (base[r.status] || 0) + 1));
    return base as { all: number; pending: number; started: number; completed: number; expired: number };
  }, [rows]);

  // ---- UI
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Assigned Assessments</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
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
      </div>

      {/* Filters / Counters */}
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
            <Badge variant={filter === key ? "secondary" : "outline"}>{val}</Badge>
          </Button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Technical</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /><span>Items</span></div>
            <Badge variant="outline">{rows.filter((r) => r.kind === "technical").length}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">HR</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>Items</span></div>
            <Badge variant="outline">{rows.filter((r) => r.kind === "hr").length}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Due soon</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Sorted by newest assignment</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Errors / Empty / Loading */}
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
                const status = r.status as string;
                const actionLabel = status === "pending" ? "Start" : status === "started" ? "Resume" : status === "completed" ? "View" : "Completed";
                const actionIcon = status === "pending" ? <Play className="h-4 w-4" /> : status === "started" ? <RotateCcw className="h-4 w-4" /> : status === "completed" ? <Eye className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;

                const disabled = status === "expired";

                return (
                  <TableRow key={(r as any)._id || (r as any).id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isTech ? (
                          <ClipboardList className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Users className="h-4 w-4 text-purple-600" />
                        )}
                        <Badge variant="outline" className="capitalize">
                          {isTech ? (r.assessment_type || "technical") : "hr"}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={statusBadgeVariant(status)} className="capitalize">
                        {status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">{fmtDateTime(r.assigned_at)}</TableCell>
                    <TableCell className="text-center">{fmtDateTime(r.due_at)}</TableCell>

                    <TableCell className="text-center">
                      {isTech ? (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <Timer className="h-3 w-3" />
                            <span>
                              Duration: {r.exam_duration ? `${r.exam_duration}m` : "—"}
                            </span>
                          </div>
                          {typeof r.time_remaining_ms === "number" && status === "started" && (
                            <div className="space-y-1">
                              <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                                <CalendarClock className="h-3 w-3" />
                                <span>Remaining: {humanRemaining(r.time_remaining_ms)}</span>
                              </div>
                              <Progress
                                value={Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    r.exam_duration
                                      ? (r.time_remaining_ms! / (r.exam_duration * 60 * 1000)) * 100
                                      : 0
                                  )
                                )}
                                className="h-2 w-48 mx-auto"
                              />
                            </div>
                          )}
                          {r.assigned_by?.name && (
                            <div className="text-[11px] text-muted-foreground">By {r.assigned_by.name}</div>
                          )}
                          {typeof r.questions_count === "number" && (
                            <div className="text-[11px] text-muted-foreground">Questions: {r.questions_count}</div>
                          )}
                          {isTech && r.is_seb && (
                            <div className="text-[11px] text-blue-600">SEB required</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">HR questionnaire</div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant={disabled ? "outline" : "default"}
                        className={disabled ? "opacity-60 cursor-not-allowed" : ""}
                        disabled={disabled}
                        onClick={() => handleAction(r)}
                      >
                        <span className="sr-only">{actionLabel}</span>
                        <div className="flex items-center gap-2">
                          {actionIcon}
                          <span>{actionLabel}</span>
                        </div>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
