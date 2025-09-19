import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Eye,
  FileText,
  User,
  Mail,
  Code,
  PenTool,
  CheckCircle,
  Brain,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import GloryDialog from "../GloryDialog";
import GloryButton from "../GloryButton";
import { useGlory } from "@/hooks/useGlory";
import GloryDisplay from "../GloryDisplay";

interface GloryData {
  [parameter: string]: string;
}

interface GloryRoleData {
  graderId?: string;
  graderName?: string;
  graderRole: "hr" | "manager" | "invigilator" | "admin";
  grades: GloryData;
  gradedAt: string;
}

interface CandidateGlory {
  [role: string]: GloryRoleData;
}

interface AssessmentStatistics {
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageScore: number;
  recentEvaluations: RecentEvaluation[];
}

interface RecentEvaluation {
  _id: string;
  candidate: {
    _id: string;
    email: string;
  };
  totalScore: number;
  evaluatedAt: string;
}

interface AssessmentListItem {
  _id: string;
  candidate: {
    _id: string;
    email: string;
    profile_photo_url?: {
      url: string;
      publicId: string;
    };
    applied_job: {
      _id: string;
      name: string;
      description: {
        time: string;
        country: string;
        location: string;
        expInYears: string;
        salary: string;
      };
      gradingParameters?: string[];
    };
    glory?: { [role: string]: GloryRoleData };
    name: string;
    status: string;
  };
  assessment: {
    _id: string;
    assigned_at: string;
    due_at: string;
    status: string;
    assigned_by: {
      name: string;
      email: string;
    };
  };
  status: "pending" | "completed" | "started" | "expired";
  total_score?: number;
  ai_score?: number;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResponse {
  question_id: string;
  type: "mcq" | "coding" | "essay";
  question_text: string;
  answer?: any;
  ai_score?: number;
  flagged?: boolean;
  max_score?: number;
  remarks?: string;
}

interface ProctoringLog {
  event: string;
  severity: "info" | "warn" | "error";
  timestamp: string;
}

interface AssessmentDetail {
  _id: string;
  candidate: {
    _id: string;
    name: string;
    email: string;
    profile_photo_url?: {
      url: string;
      publicId: string;
    };
    current_stage?: string;
    status?: string;
    glory?: CandidateGlory;
    applied_job?: {
      _id: string;
      name: string;
      description?: any;
      gradingParameters?: string[];
    };
  };
  assessment: {
    _id: string;
    assigned_at: string;
    due_at: string;
    started_at?: string;
    completed_at?: string;
    status: string;
    assigned_by: {
      name: string;
      email: string;
    };
  };
  responses: AssessmentResponse[];
  total_score?: number;
  ai_score?: number;
  status: "pending" | "completed" | "started" | "expired";
  createdAt: string;
  updatedAt: string;
  proctoring_logs?: ProctoringLog[];
  proctoring_snapshots?: string[];
}

interface CandidateToReject {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_stage: string;
  profile_photo_url?: {
    url: string;
  };
}

const AssessmentReview = () => {
  const {
    gloryDialogOpen,
    candidateForGlory,
    gloryGrades,
    selectedRole,
    submittingGlory,
    loadingGlory,
    gradeOptions,
    currentUser,
    openGloryDialog,
    closeGloryDialog,
    handleGloryGradeChange,
    submitGloryGrades,
    getGradingParameters,
  } = useGlory("invigilator");

  const [assessmentsList, setAssessmentsList] = useState<AssessmentListItem[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statistics, setStatistics] = useState<AssessmentStatistics | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [stageUpdateModal, setStageUpdateModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);

  // Rejection related state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<CandidateToReject | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Stage update state
  const [stageUpdateReason, setStageUpdateReason] = useState("");
  const [stageFeedback, setStageFeedback] = useState("");
  const [selectedNewStage, setSelectedNewStage] = useState("");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const [assessmentCollapsed, setAssessmentCollapsed] = useState(false);
  const [proctorCollapsed, setProctorCollapsed] = useState(false);

  // Helper function to safely render Glory grades
  const renderFullGloryDisplay = (glory: CandidateGlory | undefined) => {
    if (!glory || Object.keys(glory).length === 0) {
      return null;
    }
    const gloryObj = glory instanceof Map ? Object.fromEntries(glory) : glory;
    return <GloryDisplay glory={gloryObj} />;
  };

  // Transform candidate for Glory system
  const transformCandidateForGlory = (assessmentDetail: AssessmentDetail): any => {
    if (!assessmentDetail?.candidate) {
      console.warn("Invalid candidate structure for Glory:", assessmentDetail);
      return null;
    }

    const candidate = assessmentDetail.candidate;
    const nameParts = candidate.name?.split(" ") || [];

    return {
      _id: candidate._id,
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      email: candidate.email,
      profile_photo_url: candidate.profile_photo_url,
      applied_job: candidate.applied_job
        ? {
            _id: candidate.applied_job._id,
            name: candidate.applied_job.name,
            description: candidate.applied_job.description,
            gradingParameters: candidate.applied_job.gradingParameters || [],
          }
        : null,
      current_stage: candidate.current_stage,
      glory: candidate.glory,
    };
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get("/org/assessment-responses/statistics");
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const triggerAIEvaluation = async (responseId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setLoadingActions((prev) => ({ ...prev, [`ai_${responseId}`]: true }));
    try {
      const response = await api.post(`/org/assessment/evaluate/${responseId}`);
      if (selectedAssessment && selectedAssessment._id === responseId) {
        await fetchAssessmentDetail(responseId);
      }
      await fetchAssessmentsList();
      await fetchStatistics();
      toast.success("AI evaluation completed successfully");
    } catch (error: any) {
      console.error("AI evaluation failed:", error);
      toast.error(error?.response?.data?.message || "Failed to evaluate assessment");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`ai_${responseId}`]: false }));
    }
  };

  const updateCandidateStage = async (
    candidateId: string,
    newStage: string,
    internal_feedback: string,
    remarks?: string
  ) => {
    setIsUpdatingStage(true);
    try {
      const invigilatorGlory = selectedAssessment?.candidate?.glory?.invigilator;
      if (
        !invigilatorGlory ||
        !invigilatorGlory.grades ||
        Object.keys(invigilatorGlory.grades).length === 0
      ) {
        toast.error("Glory Required To Stage Update");
        return;
      }
      const response = await api.patch(`/org/candidates/${candidateId}/stage`, {
        newStage,
        remarks,
        internal_feedback: { feedback: internal_feedback },
      });

      if (response.data.success) {
        toast.success(`Candidate stage updated to ${newStage.toUpperCase()}`);
        await Promise.all([
          fetchAssessmentDetail(selectedAssessment!._id),
          fetchAssessmentsList(),
        ]);
        setStageUpdateModal(false);
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Failed to update stage:", error);
      toast.error(error?.response?.data?.message || "Failed to update candidate stage");
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const rejectCandidate = async (candidateId: string, reason: string) => {
    setIsRejecting(true);
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/reject`, {
        rejection_reason: reason,
      });

      if (response.data.success) {
        toast.success("Candidate rejected successfully");
        await fetchAssessmentsList();
        setIsDialogOpen(false);
        setRejectDialogOpen(false);
        setCandidateToReject(null);
        setRejectionReason("");
      }
    } catch (error: any) {
      console.error("Failed to reject candidate:", error);
      toast.error(error?.response?.data?.message || "Failed to reject candidate");
    } finally {
      setIsRejecting(false);
    }
  };

  const fetchAssessmentsList = async () => {
    setLoadingList(true);
    try {
      const response = await api.get("/org/assessment-responses");
      setAssessmentsList(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch assessments list:", error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchAssessmentDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/org/assessment-responses/${id}`);
      setSelectedAssessment(response.data.data);
    } catch (error) {
      console.error("Failed to fetch assessment details:", error);
      setSelectedAssessment(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openAssessmentDialog = async (id: string) => {
    setIsDialogOpen(true);
    await fetchAssessmentDetail(id);
  };

  const closeAssessmentDialog = () => {
    setIsDialogOpen(false);
    setSelectedAssessment(null);
    setStageUpdateModal(false);
    setRejectDialogOpen(false);
    setCandidateToReject(null);
    setRejectionReason("");
    setStageUpdateReason("");
    setStageFeedback("");
    setSelectedNewStage("");
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  const getInitials = (name?: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "??";

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "registered":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "hr":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "assessment":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "tech":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "manager":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "feedback":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "mcq":
        return <CheckCircle className="h-4 w-4" />;
      case "coding":
        return <Code className="h-4 w-4" />;
      case "essay":
        return <PenTool className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    const config = {
      mcq: { label: "MCQ", variant: "default" as const },
      coding: { label: "Coding", variant: "secondary" as const },
      essay: { label: "Essay", variant: "outline" as const },
    };
    const { label, variant } = config[type as keyof typeof config] || {
      label: type.toUpperCase(),
      variant: "outline" as const,
    };
    return (
      <Badge variant={variant} className="text-xs">
        {getQuestionTypeIcon(type)}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  const renderAnswer = (response: AssessmentResponse) => {
    const { type, answer } = response;
    if (!answer)
      return (
        <span className="text-muted-foreground italic">No answer provided</span>
      );
    switch (type) {
      case "mcq":
        return <Badge variant="outline">{String(answer)}</Badge>;
      case "coding":
        return (
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
            <pre>{String(answer)}</pre>
          </div>
        );
      case "essay":
      default:
        return <p className="whitespace-pre-wrap text-sm">{String(answer)}</p>;
    }
  };

  const updateResponseReview = async (
    responseId: string,
    questionId: string,
    updates: {
      flagged?: boolean;
      ai_score?: number;
      remarks?: string;
    }
  ) => {
    setLoadingActions((prev) => ({ ...prev, [`review_${questionId}`]: true }));
    try {
      const response = await api.patch(
        `/org/assessment-responses/${responseId}/review`,
        {
          questionId,
          ...updates,
        }
      );

      if (response.data.success) {
        setSelectedAssessment((prev) => {
          if (!prev) return prev;

          const updatedResponses = prev.responses.map((r) => {
            if (r.question_id === questionId) {
              return {
                ...r,
                ...response.data.data.updatedFields,
              };
            }
            return r;
          });

          return { ...prev, responses: updatedResponses };
        });

        toast.success("Review updated successfully");
        setEditingResponse(null);
      }
    } catch (error: any) {
      console.error("Failed to update review:", error);
      toast.error(error?.response?.data?.message || "Failed to update review");
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        [`review_${questionId}`]: false,
      }));
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const renderProctoringLogs = () => {
    if (
      !selectedAssessment?.proctoring_logs ||
      selectedAssessment.proctoring_logs.length === 0
    ) {
      return (
        <p className="text-sm text-muted-foreground italic">
          No proctoring logs captured
        </p>
      );
    }
    return (
      <ScrollArea className="h-40 sm:h-56 rounded-lg border border-gray-200 bg-muted/30 px-0 py-0">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-3 py-2">
                Event
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-3 py-2 hidden sm:table-cell">
                Severity
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300 px-3 py-2 text-right">
                Time
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedAssessment.proctoring_logs.map((log, idx) => (
              <TableRow
                key={idx}
                className={log.severity === "warn" ? "bg-red-50 dark:bg-red-900/20" : ""}
              >
                <TableCell className="whitespace-pre-wrap px-3 py-2 text-xs sm:text-sm">
                  {log.event}
                  {/* Mobile: Show severity inline */}
                  <div className="sm:hidden mt-1">
                    <Badge
                      variant={
                        log.severity === "warn"
                          ? "destructive"
                          : log.severity === "error"
                          ? "outline"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {log.severity.toUpperCase()}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2 hidden sm:table-cell">
                  <Badge
                    variant={
                      log.severity === "warn"
                        ? "destructive"
                        : log.severity === "error"
                        ? "outline"
                        : "secondary"
                    }
                    className={
                      log.severity === "warn"
                        ? "bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : log.severity === "error"
                        ? "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }
                  >
                    {log.severity.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {formatDateTime(log.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  const renderSnapshots = () => {
    const shots = selectedAssessment?.proctoring_snapshots;
    if (!shots || shots.length === 0) {
      return (
        <p className="text-sm text-muted-foreground italic">
          No snapshots captured
        </p>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {shots.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src={url}
              alt={`Proctoring snapshot ${idx + 1}`}
              className="w-full h-full object-cover block"
              style={{ minHeight: "120px", maxHeight: "180px" }}
            />
          </a>
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchAssessmentsList();
    fetchStatistics();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-3 sm:space-y-6 p-3 sm:p-6 bg-background dark:bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground dark:text-foreground">
            Assessment Reviews
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground">
            Review and evaluate candidate assessment responses
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          {statistics && (
            <div className="flex flex-wrap gap-1.5 sm:gap-4 text-xs sm:text-sm">
              <Badge variant="outline" className="text-xs border-border dark:border-border">
                Total: {statistics.totalAssessments}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Pending: {statistics.pendingAssessments}
              </Badge>
              <Badge variant="default" className="text-xs">
                Completed: {statistics.completedAssessments}
              </Badge>
              <Badge variant="outline" className="text-xs border-border dark:border-border">
                Avg: {statistics.averageScore.toFixed(1)}
              </Badge>
            </div>
          )}
          <Badge variant="outline" className="text-xs sm:text-sm border-border dark:border-border">
            {assessmentsList.length} Total
          </Badge>
        </div>
      </div>

      {/* Mobile-Responsive Assessments Table */}
      <Card className="flex-1 bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-foreground">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Assessment Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingList ? (
            <div className="flex justify-center items-center h-24 sm:h-32">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary dark:border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <div className="h-[400px] overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border dark:border-border">
                    <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3">
                      Candidate
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3 hidden sm:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3 hidden md:table-cell">
                      Score
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3 hidden lg:table-cell">
                      Glory
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3 hidden md:table-cell">
                      Completed
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentsList.map((item) => (
                    <TableRow
                      key={item._id}
                      className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/50 border-border dark:border-border"
                      onClick={() => openAssessmentDialog(item._id)}
                    >
                      <TableCell className="py-2 sm:py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage
                              src={item.candidate.profile_photo_url?.url}
                              alt={item.candidate.name}
                            />
                            <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-xs">
                              {getInitials(item.candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground truncate">
                              {item.candidate.name}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
                              {item.candidate.email}
                            </p>
                            {/* Mobile: Show status and score here */}
                            <div className="flex items-center gap-2 mt-1 sm:hidden">
                              <Badge
                                variant={item.status === "completed" ? "default" : "secondary"}
                                className={cn(
                                  "text-xs",
                                  item.status === "completed" &&
                                    "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
                                )}
                              >
                                {item.status}
                              </Badge>
                              {item.ai_score !== undefined && (
                                <span className="text-xs font-medium text-foreground dark:text-foreground">
                                  Score: {item.ai_score}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 hidden sm:table-cell">
                        <Badge
                          variant={item.status === "completed" ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            item.status === "completed" &&
                              "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 hidden md:table-cell">
                        {item.ai_score !== undefined ? (
                          <span className="font-medium text-sm text-foreground dark:text-foreground">
                            {item.ai_score}
                          </span>
                        ) : (
                          <Badge variant="secondary" className="text-orange-600 text-xs">
                            Not evaluated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 hidden lg:table-cell">
                        {item.candidate.glory && Object.keys(item.candidate.glory).length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-lg sm:text-xl text-blue-600 dark:text-blue-400">
                              {item.candidate.glory?.invigilator?.grades?.Overall || "No Grades"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                            No grades
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground dark:text-muted-foreground" />
                          <span className="text-foreground dark:text-foreground">
                            {formatDate(item.updatedAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {item.ai_score === undefined && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => triggerAIEvaluation(item._id, e)}
                              disabled={!!loadingActions[`ai_${item._id}`]}
                              className="flex items-center gap-1 sm:gap-2 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                              {loadingActions[`ai_${item._id}`] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                <Brain className="h-3 w-3" />
                              )}
                              <span className="hidden sm:inline">
                                {loadingActions[`ai_${item._id}`] ? "Eval..." : "Evaluate"}
                              </span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssessmentDialog(item._id);
                            }}
                            className="flex items-center gap-1 sm:gap-2 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Review</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    {/* Mobile-Responsive Detail Dialog - FIXED */}
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="
    w-screen h-screen max-w-none max-h-none
    sm:w-[95vw] sm:h-[90vh] sm:max-w-6xl sm:max-h-none
    flex flex-col overflow-hidden
    bg-background
    border-0 sm:border
    rounded-none sm:rounded-lg
    m-0 sm:m-2
    p-0
  ">
    <DialogHeader className="flex-shrink-0 px-2 py-3 sm:px-6 sm:py-4 border-b">
      <DialogTitle className="text-sm sm:text-xl font-semibold truncate pr-8">
        <User className="inline h-4 w-4 mr-2" />
        {selectedAssessment?.candidate.name || "Assessment Details"}
      </DialogTitle>
      <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
        Review assessment responses and provide evaluation
      </DialogDescription>
    </DialogHeader>

    {loadingDetail ? (
      <div className="flex justify-center items-center flex-1">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ) : selectedAssessment ? (
      <>
        <div className="flex-1 overflow-auto">
          <div className="px-2 py-3 sm:px-6 sm:py-4 space-y-3">
            
            {/* Candidate Info Card - FIXED WIDTH */}
            <div className="flex">
            <div className="w-xl m-2 bg-card border rounded-lg p-2 space-y-3">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  <AvatarImage src={selectedAssessment.candidate.profile_photo_url?.url} />
                  <AvatarFallback className="text-sm bg-primary/10">
                    {getInitials(selectedAssessment.candidate.name)}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="font-semibold text-base mb-2 px-2">
                  {selectedAssessment.candidate.name}
                </h3>
                
                {/* EMAIL - FIXED OVERFLOW */}
                <div className="flex items-center justify-center gap-2 mb-3 px-2">
                  <Mail className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  <span className="text-xs break-all text-center leading-relaxed">
                    {selectedAssessment.candidate.email}
                  </span>
                </div>
                
                {/* Status Grid - FIXED */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-1">Status</span>
                    <Badge variant={selectedAssessment.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {selectedAssessment.status}
                    </Badge>
                  </div>
                  
                  {selectedAssessment.candidate.current_stage && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Stage</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedAssessment.candidate.current_stage}
                      </Badge>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-muted-foreground block mb-1">Evaluation</span>
                    {selectedAssessment.ai_score !== undefined ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                        AI Done
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-orange-600 text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  {selectedAssessment.ai_score !== undefined && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Score</span>
                      <span className="font-bold text-sm">
                        {selectedAssessment.ai_score}
                        {selectedAssessment.total_score && `/${selectedAssessment.total_score}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Timeline - FIXED WIDTH */}
            <div className="w-xl m-2 bg-card border rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Assessment Timeline
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-medium block">Assigned</span>
                  <span className="text-muted-foreground">
                    {formatDate(selectedAssessment.assessment.assigned_at)}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    by {selectedAssessment.assessment.assigned_by.name}
                  </div>
                </div>
                <div>
                  <span className="font-medium block">Due Date</span>
                  <span className="text-muted-foreground">
                    {formatDate(selectedAssessment.assessment.due_at)}
                  </span>
                </div>
                {selectedAssessment.assessment.started_at && (
                  <div>
                    <span className="font-medium block">Started</span>
                    <span className="text-muted-foreground">
                      {formatDateTime(selectedAssessment.assessment.started_at)}
                    </span>
                  </div>
                )}
                {selectedAssessment.assessment.completed_at && (
                  <div>
                    <span className="font-medium block">Completed</span>
                    <span className="text-muted-foreground">
                      {formatDateTime(selectedAssessment.assessment.completed_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Glory Grades - LET COMPONENT HANDLE */}
            {selectedAssessment.candidate.glory &&
              renderFullGloryDisplay(selectedAssessment.candidate.glory)}

            

            {/* Assessment Questions - FIXED WIDTH */}
            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Assessment Questions</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssessmentCollapsed(!assessmentCollapsed)}
                  className="h-6 px-2 text-xs"
                >
                  {assessmentCollapsed ? "Show" : "Hide"}
                  {assessmentCollapsed ? (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </div>
              
              {!assessmentCollapsed && (
                <div className="space-y-3">
                  {selectedAssessment.responses.map((response, index) => (
                    <div key={response.question_id} className="border rounded p-2 bg-muted/10">
                      <div className="mb-2">
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span className="text-xs font-medium">Q{index + 1}</span>
                          {getQuestionTypeBadge(response.type)}
                          {response.max_score && (
                            <Badge variant="outline" className="text-xs">
                              Max: {response.max_score}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs break-words leading-relaxed mb-2">
                          {response.question_text}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          {response.flagged && (
                            <Badge variant="destructive" className="text-xs">Flagged</Badge>
                          )}
                          {response.ai_score !== undefined && response.max_score && (
                            <Badge variant="outline" className={`text-xs ${getScoreColor(response.ai_score, response.max_score)}`}>
                              {response.ai_score}/{response.max_score}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium block mb-1">Answer:</span>
                          <div className="bg-muted/30 p-2 rounded text-xs break-words">
                            {renderAnswer(response)}
                          </div>
                        </div>
                        
                        {response.remarks && (
                          <div>
                            <span className="text-xs font-medium block mb-1">AI Feedback:</span>
                            <div className="text-xs text-muted-foreground break-words">
                              {response.remarks}
                            </div>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingResponse(
                            editingResponse === response.question_id ? null : response.question_id
                          )}
                          className="h-6 px-2 text-xs"
                        >
                          {editingResponse === response.question_id ? "Cancel" : "Review"}
                        </Button>
                      </div>

                      {editingResponse === response.question_id && (
                        <div className="mt-2 p-2 bg-muted/20 rounded space-y-2">
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium block mb-1">
                                Score (0-{response.max_score})
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={response.max_score}
                                defaultValue={response.ai_score || 0}
                                className="w-full px-2 py-1 border rounded text-xs bg-background"
                                onBlur={(e) => {
                                  const score = parseInt(e.target.value);
                                  if (score >= 0 && score <= response.max_score) {
                                    updateResponseReview(selectedAssessment!._id, response.question_id, { ai_score: score });
                                  }
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`flag-${response.question_id}`}
                                defaultChecked={response.flagged}
                                onChange={(e) => updateResponseReview(selectedAssessment!._id, response.question_id, { flagged: e.target.checked })}
                              />
                              <label htmlFor={`flag-${response.question_id}`} className="text-xs">
                                Flag for review
                              </label>
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Remarks</label>
                              <textarea
                                defaultValue={response.remarks || ""}
                                placeholder="Add feedback..."
                                className="w-full px-2 py-1 border rounded text-xs bg-background"
                                rows={2}
                                onBlur={(e) => updateResponseReview(selectedAssessment!._id, response.question_id, { remarks: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proctoring Review - FIXED WIDTH */}
            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Proctoring Review</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProctorCollapsed(!proctorCollapsed)}
                  className="h-6 px-2 text-xs"
                >
                  {proctorCollapsed ? "Show" : "Hide"}
                  {proctorCollapsed ? (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </div>
              
              {!proctorCollapsed && (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-medium mb-2">Snapshots</h5>
                    {renderSnapshots()}
                  </div>
                  <div>
                    <h5 className="text-xs font-medium mb-2">Event Logs</h5>
                    {renderProctoringLogs()}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Footer - FIXED */}
        <div className="flex-shrink-0 border-t bg-background p-2 sm:p-3">
          <div className="space-y-2">
            {selectedAssessment && selectedAssessment.ai_score === undefined && (
              <Button
                variant="outline"
                onClick={() => triggerAIEvaluation(selectedAssessment._id)}
                disabled={!!loadingActions[`ai_${selectedAssessment._id}`]}
                className="w-full h-8 text-xs"
              >
                {loadingActions[`ai_${selectedAssessment._id}`] ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />
                ) : (
                  <Brain className="h-3 w-3 mr-2" />
                )}
                {loadingActions[`ai_${selectedAssessment._id}`] ? "Evaluating..." : "Run AI Evaluation"}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={closeAssessmentDialog} className="h-8 text-xs">
                Close
              </Button>
              
              {selectedAssessment?.candidate.status !== "rejected" && selectedAssessment?.ai_score !== undefined && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setCandidateToReject({
                      _id: selectedAssessment.candidate._id,
                      first_name: selectedAssessment.candidate.name.split(" ")[0] || "",
                      last_name: selectedAssessment.candidate.name.split(" ").slice(1).join(" ") || "",
                      email: selectedAssessment.candidate.email,
                      current_stage: selectedAssessment.candidate.current_stage || "",
                      profile_photo_url: selectedAssessment.candidate.profile_photo_url,
                    });
                    setRejectionReason("");
                    setRejectDialogOpen(true);
                  }}
                  className="bg-red-600 h-8 text-xs"
                >
                  ❌ Reject
                </Button>
              )}
              
              <GloryButton
                candidate={transformCandidateForGlory(selectedAssessment)}
                onOpenGlory={(transformedCandidate) => {
                  if (transformedCandidate) {
                    openGloryDialog(transformedCandidate);
                  } else {
                    toast.error("Failed to prepare candidate data for Glory");
                  }
                }}
                variant="outline"
                size="sm"
                className="text-purple-600 h-8 text-xs"
              />
              
              {selectedAssessment?.ai_score !== undefined && (
                <Button
                  onClick={() => setStageUpdateModal(true)}
                  className="h-8 text-xs"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Stage
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="text-center py-8 flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No assessment details found</p>
      </div>
    )}
  </DialogContent>
</Dialog>
   

      {/* Glory Dialog */}
      <GloryDialog
        isOpen={gloryDialogOpen}
        candidate={candidateForGlory}
        gloryGrades={gloryGrades}
        selectedRole={selectedRole}
        submittingGlory={submittingGlory}
        loadingGlory={loadingGlory}
        gradeOptions={gradeOptions}
        currentUser={currentUser}
        onClose={closeGloryDialog}
        role="invigilator"
        onGradeChange={handleGloryGradeChange}
        onSubmit={() =>
          submitGloryGrades(() => {
            fetchAssessmentsList();
            if (selectedAssessment) {
              fetchAssessmentDetail(selectedAssessment._id);
            }
          })
        }
        getGradingParameters={getGradingParameters}
      />

      {/* Compact Stage Update Modal */}
      <Dialog open={stageUpdateModal} onOpenChange={setStageUpdateModal}>
        <DialogContent className="w-full sm:max-w-lg bg-background dark:bg-background border-0 sm:border sm:border-border sm:dark:border-border rounded-none sm:rounded-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-lg sm:text-xl">
              🔄 Update Candidate Stage
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground dark:text-muted-foreground">
              Move this candidate to a different stage in the hiring process.
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <div className="space-y-3 sm:space-y-4">
              {/* Compact Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                    <AvatarImage src={selectedAssessment.candidate.profile_photo_url?.url} />
                    <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-xs">
                      {getInitials(selectedAssessment.candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base text-foreground dark:text-foreground truncate">
                      {selectedAssessment.candidate.name}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground truncate">
                      {selectedAssessment.candidate.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Current:
                      </span>
                      <Badge
                        className={getStageColor(selectedAssessment.candidate.current_stage || "")}
                        variant="outline"
                      >
                        {selectedAssessment.candidate.current_stage?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-stage" className="text-sm font-medium text-foreground dark:text-foreground">
                  New Stage <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <select
                  id="new-stage"
                  value={selectedNewStage}
                  onChange={(e) => setSelectedNewStage(e.target.value)}
                  className="w-full p-2 border border-border dark:border-border rounded-md bg-background dark:bg-background text-foreground dark:text-foreground text-sm"
                  disabled={isUpdatingStage}
                >
                  <option value="">Select new stage</option>
                  <option value="hr" disabled={selectedAssessment.candidate.current_stage === "hr"}>
                    👥 HR Review
                  </option>
                  <option value="manager" disabled={selectedAssessment.candidate.current_stage === "manager"}>
                    👔 Manager Review
                  </option>
                  <option value="feedback" disabled={selectedAssessment.candidate.current_stage === "feedback"}>
                    📋 Final Feedback
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage-reason" className="text-sm font-medium text-foreground dark:text-foreground">
                  Reason for Stage Update
                </Label>
                <Textarea
                  id="stage-reason"
                  placeholder="Enter reason for moving candidate to this stage..."
                  value={stageUpdateReason}
                  onChange={(e) => setStageUpdateReason(e.target.value)}
                  className="min-h-[80px] text-sm bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground"
                  disabled={isUpdatingStage}
                />
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  This reason will be recorded in the candidate's stage history.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage-feedback" className="text-sm font-medium text-foreground dark:text-foreground">
                  Internal Feedback <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <Textarea
                  id="stage-feedback"
                  placeholder="Provide your feedback for this stage update..."
                  value={stageFeedback}
                  onChange={(e) => setStageFeedback(e.target.value)}
                  className="min-h-[80px] text-sm bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground"
                  disabled={isUpdatingStage}
                />
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  This feedback will be attached to the candidate's profile and visible internally.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-border dark:border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStageUpdateModal(false);
                setSelectedNewStage("");
                setStageUpdateReason("");
                setStageFeedback("");
              }}
              disabled={isUpdatingStage}
              className="text-sm border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (selectedAssessment && selectedNewStage && stageFeedback.trim()) {
                  updateCandidateStage(
                    selectedAssessment.candidate._id,
                    selectedNewStage,
                    stageFeedback,
                    stageUpdateReason.trim() || `Stage updated to ${selectedNewStage}`
                  );
                }
              }}
              disabled={isUpdatingStage || !selectedNewStage || !stageFeedback.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-sm"
            >
              {isUpdatingStage ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>🔄 Update Stage</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compact Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="w-full sm:max-w-lg bg-background dark:bg-background border-0 sm:border sm:border-border sm:dark:border-border rounded-none sm:rounded-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              ⚠️ Confirm Candidate Rejection
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
              This action cannot be undone. Please provide a reason for rejecting this candidate.
            </DialogDescription>
          </DialogHeader>

          {candidateToReject && (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                    <AvatarImage src={candidateToReject.profile_photo_url?.url} />
                    <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-xs">
                      {candidateToReject.first_name[0]}{candidateToReject.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground dark:text-foreground">
                      {candidateToReject.first_name} {candidateToReject.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
                      {candidateToReject.email}
                    </p>
                    <Badge
                      className={getStageColor(candidateToReject.current_stage)}
                      variant="outline"
                      className="mt-1 text-xs border-border dark:border-border"
                    >
                      {candidateToReject.current_stage?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason" className="text-sm font-medium text-foreground dark:text-foreground">
                  Reason for Rejection <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a detailed reason for rejecting this candidate..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[80px] text-sm bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground"
                  disabled={isRejecting}
                />
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  This reason will be recorded in the candidate's history for future reference.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-border dark:border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectDialogOpen(false);
                setCandidateToReject(null);
                setRejectionReason("");
              }}
              disabled={isRejecting}
              className="text-sm border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (candidateToReject && rejectionReason.trim()) {
                  rejectCandidate(candidateToReject._id, rejectionReason.trim());
                }
              }}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-sm"
            >
              {isRejecting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Rejecting...
                </>
              ) : (
                <>❌ Confirm Rejection</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentReview;
