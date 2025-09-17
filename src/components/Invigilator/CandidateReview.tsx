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
  grades: GloryData; // ✅ Use plain object instead of Map
  gradedAt: string;
}

interface CandidateGlory {
  [role: string]: GloryRoleData;
}

// TypeScript interfaces for Assessment Review
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

// Add interface for candidate to reject
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

  const [assessmentsList, setAssessmentsList] = useState<AssessmentListItem[]>(
    []
  );
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statistics, setStatistics] = useState<AssessmentStatistics | null>(
    null
  );
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>(
    {}
  );
  const [stageUpdateModal, setStageUpdateModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);

  // Rejection related state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] =
    useState<CandidateToReject | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Stage update state
  const [stageUpdateReason, setStageUpdateReason] = useState("");
  const [stageFeedback, setStageFeedback] = useState("");
  const [selectedNewStage, setSelectedNewStage] = useState("");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const [assessmentCollapsed, setAssessmentCollapsed] = useState(false);
  const [proctorCollapsed, setProctorCollapsed] = useState(false);

  // ✅ FIXED: Helper function to safely render Glory grades
  const renderFullGloryDisplay = (glory: CandidateGlory | undefined) => {
    if (!glory || Object.keys(glory).length === 0) {
      return null;
    }
    const gloryObj = glory instanceof Map ? Object.fromEntries(glory) : glory;
    return (
      <>
        <GloryDisplay glory={gloryObj} />
      </>
    );
  };

  // ✅ ADD: Transform candidate for Glory system
  const transformCandidateForGlory = (
    assessmentDetail: AssessmentDetail
  ): any => {
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
      // ✅ FIXED: Now includes proper job data from backend
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

  // ✅ FIXED: Transform CandidateDetail to match Glory's expected candidate structure

  const fetchStatistics = async () => {
    try {
      const response = await api.get("/org/assessment-responses/statistics"); // ✅ Correct endpoint
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const triggerAIEvaluation = async (
    responseId: string,
    event?: React.MouseEvent
  ) => {
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
      console.log("AI evaluation completed:", response.data.message);
    } catch (error: any) {
      console.error("AI evaluation failed:", error);
      toast.error(
        error?.response?.data?.message || "Failed to evaluate assessment"
      );
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
      const invigilatorGlory =
        selectedAssessment?.candidate?.glory?.invigilator;
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
      toast.error(
        error?.response?.data?.message ||
          error ||
          "Failed to update candidate stage"
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const rejectCandidate = async (candidateId: string, reason: string) => {
    setIsRejecting(true);
    try {
      const response = await api.patch(
        `/org/candidates/${candidateId}/reject`,
        {
          rejection_reason: reason,
        }
      );

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
      toast.error(
        error?.response?.data?.message || "Failed to reject candidate"
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const fetchAssessmentsList = async () => {
    setLoadingList(true);
    try {
      const response = await api.get("/org/assessment-responses"); // ✅ Correct endpoint
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
      const response = await api.get(`/org/assessment-responses/${id}`); // ✅ Correct endpoint
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
        // Update local state with the new values
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

  // Proctoring helpers
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
      <ScrollArea className="h-56 rounded-lg border border-gray-200 bg-muted/30 px-0 py-0">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700 px-3 py-2">
                Event
              </TableHead>
              <TableHead className="font-semibold text-gray-700 px-3 py-2">
                Severity
              </TableHead>
              <TableHead className="font-semibold text-gray-700 px-3 py-2 text-right">
                Timestamp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedAssessment.proctoring_logs.map((log, idx) => (
              <TableRow
                key={idx}
                className={log.severity === "warn" ? "bg-red-50" : ""}
              >
                <TableCell className="whitespace-pre-wrap px-3 py-2">
                  {log.event}
                </TableCell>
                <TableCell className="px-3 py-2">
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
                        ? "bg-red-200 text-red-700"
                        : log.severity === "error"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  >
                    {log.severity.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-3 py-2 font-mono text-xs text-gray-600">
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {shots.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src={url}
              alt={`Proctoring snapshot ${idx + 1}`}
              className="w-full h-full object-cover block"
              style={{ minHeight: "160px", maxHeight: "224px" }}
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
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Enhanced Header with Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment Reviews</h1>
          <p className="text-muted-foreground">
            Review and evaluate candidate assessment responses
          </p>
        </div>
        <div className="flex items-center gap-4">
          {statistics && (
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                Total: {statistics.totalAssessments}
              </Badge>
              <Badge variant="secondary">
                Pending: {statistics.pendingAssessments}
              </Badge>
              <Badge variant="default">
                Completed: {statistics.completedAssessments}
              </Badge>
              <Badge variant="outline">
                Avg Score: {statistics.averageScore.toFixed(1)}
              </Badge>
            </div>
          )}
          <Badge variant="outline" className="text-sm">
            {assessmentsList.length} Total Assessments
          </Badge>
        </div>
      </div>

      {/* Assessments Table */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessment Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Glory</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentsList.map((item) => (
                    <TableRow
                      key={item._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openAssessmentDialog(item._id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={item.candidate.profile_photo_url?.url}
                              alt={item.candidate.name}
                            />
                            <AvatarFallback>
                              {getInitials(item.candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{item.candidate.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.candidate.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className={cn(
                            item.status === "completed" &&
                              "bg-green-100 text-green-800 hover:bg-green-200"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.ai_score !== undefined ? (
                          <span className="font-medium">{item.ai_score}</span>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-orange-600"
                          >
                            Not evaluated
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {item.candidate.glory &&
                        Object.keys(item.candidate.glory).length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xl text-blue-600">
                              {item.candidate.glory?.invigilator?.grades
                                ?.Overall || "No Grades"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No grades
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(item.updatedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.ai_score === undefined && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => triggerAIEvaluation(item._id, e)}
                              disabled={!!loadingActions[`ai_${item._id}`]}
                              className="flex items-center gap-2 mr-2"
                            >
                              {loadingActions[`ai_${item._id}`] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                <Brain className="h-3 w-3" />
                              )}
                              {loadingActions[`ai_${item._id}`]
                                ? "Evaluating..."
                                : "Evaluate"}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssessmentDialog(item._id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedAssessment?.candidate.name || "Assessment Details"}
            </DialogTitle>
            <DialogDescription>
              Review assessment responses and provide evaluation
            </DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center items-center flex-1">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : selectedAssessment ? (
            <>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6 pb-4">
                    {/* Candidate Info */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={
                                selectedAssessment.candidate.profile_photo_url
                                  ?.url
                              }
                              alt={selectedAssessment.candidate.name}
                            />
                            <AvatarFallback className="text-lg">
                              {getInitials(selectedAssessment.candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <h3 className="text-xl font-semibold">
                              {selectedAssessment.candidate.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedAssessment.candidate.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="font-medium">Status: </span>
                                <Badge
                                  variant={
                                    selectedAssessment.status === "completed"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {selectedAssessment.status}
                                </Badge>
                              </div>
                              {selectedAssessment.candidate.current_stage && (
                                <div>
                                  <span className="font-medium">
                                    Current Stage:{" "}
                                  </span>
                                  <Badge variant="outline">
                                    {selectedAssessment.candidate.current_stage}
                                  </Badge>
                                </div>
                              )}
                              <div>
                                <span className="font-medium">
                                  Evaluation:{" "}
                                </span>
                                {selectedAssessment.ai_score !== undefined ? (
                                  <Badge
                                    variant="default"
                                    className="bg-green-100 text-green-800"
                                  >
                                    AI Evaluated
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-orange-600"
                                  >
                                    Not Evaluated
                                  </Badge>
                                )}
                              </div>
                              {selectedAssessment.ai_score !== undefined && (
                                <div>
                                  <span className="font-medium">
                                    Score Obtain:{" "}
                                  </span>
                                  <span className="text-lg font-bold">
                                    {selectedAssessment.ai_score}
                                  </span>
                                </div>
                              )}
                              {selectedAssessment.total_score !== undefined && (
                                <div>
                                  <span className="font-medium">Out Of: </span>
                                  <span className="text-lg font-bold">
                                    {selectedAssessment.total_score}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ✅ FIXED: Glory Grades Display with proper rendering */}
                    {selectedAssessment.candidate.glory &&
                      renderFullGloryDisplay(
                        selectedAssessment.candidate.glory
                      )}

                    {/* Assessment Timeline */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Assessment Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Assigned</p>
                            <p className="text-muted-foreground">
                              {formatDate(
                                selectedAssessment.assessment.assigned_at
                              )}
                            </p>
                            <p className="text-xs">
                              by{" "}
                              {selectedAssessment.assessment.assigned_by.name}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Due Date</p>
                            <p className="text-muted-foreground">
                              {formatDate(selectedAssessment.assessment.due_at)}
                            </p>
                          </div>
                          {selectedAssessment.assessment.started_at && (
                            <div>
                              <p className="font-medium">Started</p>
                              <p className="text-muted-foreground">
                                {formatDateTime(
                                  selectedAssessment.assessment.started_at
                                )}
                              </p>
                            </div>
                          )}
                          {selectedAssessment.assessment.completed_at && (
                            <div>
                              <p className="font-medium">Completed</p>
                              <p className="text-muted-foreground">
                                {formatDateTime(
                                  selectedAssessment.assessment.completed_at
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Responses */}
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <CardTitle>Assessment Questions</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setAssessmentCollapsed(!assessmentCollapsed)
                            }
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className="text-sm font-medium">
                              {assessmentCollapsed ? "Show" : "Hide"}
                            </span>
                            {assessmentCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {!assessmentCollapsed &&
                            selectedAssessment.responses.map(
                              (response, index) => (
                                <div
                                  key={response.question_id}
                                  className="border rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">
                                          Q{index + 1}
                                        </span>
                                        {getQuestionTypeBadge(response.type)}
                                        {response.max_score && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            Max: {response.max_score} pts
                                          </Badge>
                                        )}
                                      </div>
                                      <h4 className="font-medium text-sm mb-2">
                                        {response.question_text}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {response.flagged && (
                                        <Badge variant="destructive">
                                          Flagged
                                        </Badge>
                                      )}
                                      {response.ai_score !== undefined &&
                                        response.max_score && (
                                          <Badge
                                            variant="outline"
                                            className={getScoreColor(
                                              response.ai_score,
                                              response.max_score
                                            )}
                                          >
                                            Score: {response.ai_score}/
                                            {response.max_score}
                                          </Badge>
                                        )}
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <h5 className="text-sm font-medium mb-2">
                                        Answer:
                                      </h5>
                                      <div className="bg-muted/50 p-3 rounded">
                                        {renderAnswer(response)}
                                      </div>
                                    </div>
                                    {response.remarks && (
                                      <div>
                                        <h5 className="text-sm font-medium mt-4 mb-2">
                                          AI Feedback:
                                        </h5>
                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                          {response.remarks}
                                        </p>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setEditingResponse(
                                            editingResponse ===
                                              response.question_id
                                              ? null
                                              : response.question_id
                                          )
                                        }
                                        // disabled={response.question.input_type === 'audio'}
                                      >
                                        {editingResponse ===
                                        response.question_id
                                          ? "Cancel"
                                          : "Review"}
                                      </Button>
                                    </div>
                                  </div>
                                  {editingResponse === response.question_id && (
                                    <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">
                                            Score (0-{response.max_score})
                                          </label>
                                          <input
                                            type="number"
                                            min="0"
                                            max={response.max_score}
                                            defaultValue={
                                              response.ai_score || 0
                                            }
                                            className="w-full px-3 py-1 border rounded text-sm"
                                            onBlur={(e) => {
                                              const score = parseInt(
                                                e.target.value
                                              );
                                              if (
                                                score >= 0 &&
                                                score <= response.max_score
                                              ) {
                                                updateResponseReview(
                                                  selectedAssessment!._id,
                                                  response.question_id,
                                                  { ai_score: score }
                                                );
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            id={`flag-${response.question_id}`}
                                            defaultChecked={response.flagged}
                                            onChange={(e) =>
                                              updateResponseReview(
                                                selectedAssessment!._id,
                                                response.question_id,
                                                { flagged: e.target.checked }
                                              )
                                            }
                                          />
                                          <label
                                            htmlFor={`flag-${response.question_id}`}
                                            className="text-sm"
                                          >
                                            Flag for review
                                          </label>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                          Remarks
                                        </label>
                                        <textarea
                                          defaultValue={response.remarks || ""}
                                          placeholder="Add your feedback..."
                                          className="w-full px-3 py-2 border rounded text-sm"
                                          rows={3}
                                          onBlur={(e) =>
                                            updateResponseReview(
                                              selectedAssessment!._id,
                                              response.question_id,
                                              { remarks: e.target.value }
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Proctoring logs & snapshots */}
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <CardTitle>Proctoring Review</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setProctorCollapsed(!proctorCollapsed)
                            }
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className="text-sm font-medium">
                              {proctorCollapsed ? "Show" : "Hide"}
                            </span>
                            {proctorCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Snapshots
                          </h4>
                          {!proctorCollapsed && renderSnapshots()}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Event Logs
                          </h4>
                          {!proctorCollapsed && renderProctoringLogs()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed Footer */}
              <div className="flex justify-between pt-4 border-t flex-shrink-0 bg-background">
                <div className="flex gap-2">
                  {selectedAssessment &&
                    selectedAssessment.ai_score === undefined && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          triggerAIEvaluation(selectedAssessment._id)
                        }
                        disabled={
                          !!loadingActions[`ai_${selectedAssessment._id}`]
                        }
                        className="flex items-center gap-2"
                      >
                        {loadingActions[`ai_${selectedAssessment._id}`] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                        {loadingActions[`ai_${selectedAssessment._id}`]
                          ? "Evaluating..."
                          : "Run AI Evaluation"}
                      </Button>
                    )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={closeAssessmentDialog}>
                    Close
                  </Button>

                  {/* Reject Button - Added */}
                  {selectedAssessment &&
                    selectedAssessment.candidate.status !== "rejected" &&
                    selectedAssessment.ai_score !== undefined && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setCandidateToReject({
                            _id: selectedAssessment.candidate._id,
                            first_name:
                              selectedAssessment.candidate.name.split(" ")[0] ||
                              "",
                            last_name:
                              selectedAssessment.candidate.name
                                .split(" ")
                                .slice(1)
                                .join(" ") || "",
                            email: selectedAssessment.candidate.email,
                            current_stage:
                              selectedAssessment.candidate.current_stage || "",
                            profile_photo_url:
                              selectedAssessment.candidate.profile_photo_url,
                          });
                          setRejectionReason("");
                          setRejectDialogOpen(true);
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        ❌ Reject Candidate
                      </Button>
                    )}

                  {/* ✅ FIXED: Use transformed candidate data */}
                  <GloryButton
                    candidate={transformCandidateForGlory(selectedAssessment)}
                    onOpenGlory={(transformedCandidate) => {
                      if (transformedCandidate) {
                        openGloryDialog(transformedCandidate);
                      } else {
                        toast.error(
                          "Failed to prepare candidate data for Glory"
                        );
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-purple-600 hover:text-purple-700"
                  />

                  {/* Only show Update Stage if AI evaluated */}
                  {selectedAssessment &&
                    selectedAssessment.ai_score !== undefined && (
                      <Button
                        onClick={() => setStageUpdateModal(true)}
                        className="flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Update Stage
                      </Button>
                    )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">
                No assessment details found
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ Add Glory Dialog */}
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
        role="invigilator" // Hardcoded role
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

      {/* Stage Update Modal - Updated with HR Home logic */}
      <Dialog open={stageUpdateModal} onOpenChange={setStageUpdateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              🔄 Update Candidate Stage
            </DialogTitle>
            <DialogDescription>
              Move this candidate to a different stage in the hiring process.
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={selectedAssessment.candidate.profile_photo_url?.url}
                    />
                    <AvatarFallback>
                      {getInitials(selectedAssessment.candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedAssessment.candidate.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAssessment.candidate.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Current:
                      </span>
                      <Badge
                        className={getStageColor(
                          selectedAssessment.candidate.current_stage || ""
                        )}
                        variant="outline"
                      >
                        {selectedAssessment.candidate.current_stage?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Stage Selection */}
              <div className="space-y-2">
                <Label htmlFor="new-stage">
                  New Stage <span className="text-red-500">*</span>
                </Label>
                <select
                  id="new-stage"
                  value={selectedNewStage}
                  onChange={(e) => setSelectedNewStage(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                  disabled={isUpdatingStage}
                >
                  <option value="">Select new stage</option>
                  <option
                    value="hr"
                    disabled={
                      selectedAssessment.candidate.current_stage === "hr"
                    }
                  >
                    👥 HR Review
                  </option>
                  <option
                    value="manager"
                    disabled={
                      selectedAssessment.candidate.current_stage === "manager"
                    }
                  >
                    👔 Manager Review
                  </option>
                  <option
                    value="feedback"
                    disabled={
                      selectedAssessment.candidate.current_stage === "feedback"
                    }
                  >
                    📋 Final Feedback
                  </option>
                </select>
              </div>

              {/* Reason for Stage Update */}
              <div className="space-y-2">
                <Label htmlFor="stage-reason">Reason for Stage Update</Label>
                <Textarea
                  id="stage-reason"
                  placeholder="Enter reason for moving candidate to this stage..."
                  value={stageUpdateReason}
                  onChange={(e) => setStageUpdateReason(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isUpdatingStage}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be recorded in the candidate's stage history.
                </p>
              </div>

              {/* Internal Feedback (compulsory) */}
              <div className="space-y-2">
                <Label htmlFor="stage-feedback">
                  Internal Feedback <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="stage-feedback"
                  placeholder="Provide your feedback for this stage update..."
                  value={stageFeedback}
                  onChange={(e) => setStageFeedback(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isUpdatingStage}
                />
                <p className="text-xs text-muted-foreground">
                  This feedback will be attached to the candidate's profile and
                  visible internally.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStageUpdateModal(false);
                setSelectedNewStage("");
                setStageUpdateReason("");
                setStageFeedback("");
              }}
              disabled={isUpdatingStage}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (
                  selectedAssessment &&
                  selectedNewStage &&
                  stageFeedback.trim()
                ) {
                  updateCandidateStage(
                    selectedAssessment.candidate._id,
                    selectedNewStage,
                    stageFeedback,
                    stageUpdateReason.trim() ||
                      `Stage updated to ${selectedNewStage}`
                  );
                }
              }}
              disabled={
                isUpdatingStage || !selectedNewStage || !stageFeedback.trim()
              }
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUpdatingStage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>🔄 Update Stage</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              ⚠️ Confirm Candidate Rejection
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please provide a reason for
              rejecting this candidate.
            </DialogDescription>
          </DialogHeader>

          {candidateToReject && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={candidateToReject.profile_photo_url?.url}
                    />
                    <AvatarFallback>
                      {candidateToReject.first_name[0]}
                      {candidateToReject.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {candidateToReject.first_name}{" "}
                      {candidateToReject.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidateToReject.email}
                    </p>
                    <Badge
                      className={getStageColor(candidateToReject.current_stage)}
                      variant="outline"
                    >
                      {candidateToReject.current_stage?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a detailed reason for rejecting this candidate..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isRejecting}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be recorded in the candidate's history for
                  future reference.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setCandidateToReject(null);
                setRejectionReason("");
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (candidateToReject && rejectionReason.trim()) {
                  rejectCandidate(
                    candidateToReject._id,
                    rejectionReason.trim()
                  );
                }
              }}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
