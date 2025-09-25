import { useEffect, useState, useRef, useCallback } from "react";
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
  CheckCircle2,
  AlertCircle,
  Save,
  EyeClosed,
} from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

// 🆕 NEW: Manual Review Form Component for Assessment - Same UI as HR Questionnaire
const AssessmentManualReviewForm: React.FC<{
  response: AssessmentResponse;
  onUpdate: (updates: { flagged?: boolean; ai_score?: number; remarks?: string }) => Promise<void>;
  loading: boolean;
  questionIndex: number;
  assessmentId: string;
  onSaveSuccess: () => void;
}> = ({ response, onUpdate, loading, questionIndex, assessmentId, onSaveSuccess }) => {
  const [localScore, setLocalScore] = useState(response.ai_score || 0);
  const [localRemarks, setLocalRemarks] = useState(response.remarks || "");
  const [localFlagged, setLocalFlagged] = useState(response.flagged || false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [hasChanges, setHasChanges] = useState(false);
  
  const scoreInputRef = useRef<HTMLInputElement>(null);
  const remarksTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleManualSave = async () => {
    if (!hasChanges) return;
    
    // Store current focus element
    const activeElement = document.activeElement as HTMLElement;
    const wasScoreFocused = activeElement === scoreInputRef.current;
    const wasRemarksFocused = activeElement === remarksTextareaRef.current;
    
    setSaveStatus("saving");
    try {
      await onUpdate({
        ai_score: localScore,
        remarks: localRemarks.trim(),
        flagged: localFlagged
      });
      setSaveStatus("saved");
      setHasChanges(false);
      toast.success(`Question ${questionIndex + 1} review saved successfully`);
      onSaveSuccess();
      
      // Restore focus after save
      setTimeout(() => {
        if (wasScoreFocused && scoreInputRef.current) {
          scoreInputRef.current.focus();
        } else if (wasRemarksFocused && remarksTextareaRef.current) {
          remarksTextareaRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      setSaveStatus("error");
      toast.error(`Failed to save review for Question ${questionIndex + 1}`);
    }
  };
  
  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const score = parseInt(e.target.value);
    const maxScore = response.max_score || 10;
    if (!isNaN(score) && score >= 0 && score <= maxScore) {
      setLocalScore(score);
      setHasChanges(true);
      setSaveStatus("saved");
    }
  };
  
  const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setLocalRemarks(value);
      setHasChanges(true);
      setSaveStatus("saved");
    }
  };
  
  const handleFlaggedChange = (checked: boolean) => {
    setLocalFlagged(checked);
    setHasChanges(true);
    setSaveStatus("saved");
  };

  const maxScore = response.max_score || 10;

  return (
    <div className="bg-muted/30 dark:bg-muted/20 p-3 rounded-lg border border-border space-y-3">
      {/* Save Status Header */}
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-foreground">
          Manual Review - Question {questionIndex + 1}
        </h5>
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Saving...
            </div>
          )}
          {saveStatus === "saved" && !hasChanges && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Saved
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              Save failed
            </div>
          )}
          {hasChanges && (
            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
              ⚠️ Unsaved Changes
            </Badge>
          )}
        </div>
      </div>
      
      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Score Input */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">Score (0-{maxScore}) *</Label>
          <div className="relative">
            <Input
              ref={scoreInputRef}
              type="number"
              min="0"
              max={maxScore}
              step="1"
              value={localScore}
              onChange={handleScoreChange}
              className={cn(
                "text-sm",
                saveStatus === "error" && "border-red-500",
                hasChanges && "border-orange-500 focus:ring-orange-500"
              )}
              disabled={loading}
              placeholder={`0-${maxScore}`}
            />
            {hasChanges && (
              <div className="absolute right-2 top-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" 
                   title="Unsaved changes" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">Rate the answer quality</p>
        </div>
        
        {/* Flag Checkbox */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">Status</Label>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              checked={localFlagged}
              onCheckedChange={handleFlaggedChange}
              disabled={loading}
            />
            <Label className="text-xs cursor-pointer">
              🚩 Flag for review
            </Label>
          </div>
          {localFlagged && (
            <Badge variant="destructive" className="text-xs mt-1">
              Flagged for review
            </Badge>
          )}
        </div>
      </div>
      
      {/* Remarks */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">Remarks & Feedback</Label>
        <Textarea
          ref={remarksTextareaRef}
          value={localRemarks}
          onChange={handleRemarksChange}
          placeholder="Add detailed feedback about the answer quality, accuracy, and areas for improvement..."
          className={cn(
            "text-xs resize-none",
            saveStatus === "error" && "border-red-500",
            hasChanges && "border-orange-500 focus:ring-orange-500"
          )}
          rows={3}
          disabled={loading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Provide constructive feedback for the candidate</span>
          <span className={cn(
            localRemarks.length > 450 && "text-orange-600",
            localRemarks.length >= 500 && "text-red-600"
          )}>
            {localRemarks.length}/500
          </span>
        </div>
      </div>
      
      {/* Save Button and Summary */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Current Score:</span>
          <Badge 
            variant={localScore >= maxScore * 0.8 ? "default" : localScore >= maxScore * 0.6 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {localScore}/{maxScore}
          </Badge>
          {localFlagged && (
            <Badge variant="destructive" className="text-xs">
              🚩 Flagged
            </Badge>
          )}
        </div>
        
        <Button
          onClick={handleManualSave}
          disabled={!hasChanges || loading || saveStatus === "saving"}
          size="sm"
          className={cn(
            "h-8 px-4 text-xs font-medium",
            hasChanges 
              ? "bg-blue-600 hover:bg-blue-700 text-white animate-pulse"
              : "bg-gray-400 text-gray-600"
          )}
        >
          {saveStatus === "saving" ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : hasChanges ? (
            <>
              <Save className="h-3 w-3 mr-2" />
              💾 Save Review
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3 mr-2" />
              Saved
            </>
          )}
        </Button>
      </div>
      
      {/* Warning message for unsaved changes */}
      {hasChanges && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
          <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
            <AlertCircle className="h-3 w-3" />
            <span className="font-medium">You have unsaved changes.</span>
            <span>Click "Save Review" to store your evaluation.</span>
          </div>
        </div>
      )}
    </div>
  );
};

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

  // 🆕 ADDED: Function to handle save success
  const handleReviewSaveSuccess = useCallback(() => {
    console.log("[ASSESSMENT] Review saved successfully");
  }, []);

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
    setEditingResponse(null);
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

  // 🆕 UPDATED: Assessment review function with improved error handling
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

        // Don't automatically close editing - let user decide
        // setEditingResponse(null);
      }
    } catch (error: any) {
      console.error("Failed to update review:", error);
      throw error; // Re-throw so the component can handle it
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-foreground">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Assessment Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex justify-center items-center h-24 sm:h-32">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary dark:border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                          <Badge variant="outline" className="text-xs border-border dark:border-border">
                            {item.ai_score}/10
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not evaluated</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 hidden lg:table-cell">
                        {item.candidate.glory?.invigilator.grades.Overall ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-x">{item.candidate.glory?.invigilator.grades.Overall}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 sm:py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground dark:text-muted-foreground" />
                          {formatDate(item.updatedAt)}
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

      {/* Assessment Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="
          sm:inset-auto 
          sm:top-[50%] sm:left-[50%] 
          sm:translate-x-[-50%] sm:translate-y-[-50%]
          w-full h-full
          sm:w-[95vw] sm:h-[90vh]
          sm:max-w-6xl
          max-h-none
          sm:max-h-[90vh]
          m-0 rounded-none
          sm:m-2 sm:rounded-lg
          border-0 sm:border sm:border-border sm:dark:border-border
          flex flex-col
          overflow-hidden
          bg-background dark:bg-background
        ">
          <DialogHeader className="flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 border-b border-border dark:border-border">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-foreground dark:text-foreground">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              {selectedAssessment?.candidate.name || "Assessment Details"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
              Review assessment responses and provide evaluation
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center items-center flex-1">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary dark:border-primary"></div>
            </div>
          ) : selectedAssessment ? (
            <>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {/* Candidate Info Card */}
                    <Card className="bg-card dark:bg-card border-border dark:border-border">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                          <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                            <AvatarImage
                              src={selectedAssessment.candidate.profile_photo_url?.url}
                              alt={selectedAssessment.candidate.name}
                            />
                            <AvatarFallback className="text-sm sm:text-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary">
                              {getInitials(selectedAssessment.candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2 text-center sm:text-left">
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground dark:text-foreground">
                              {selectedAssessment.candidate.name}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground dark:text-muted-foreground" />
                                <span className="truncate text-foreground dark:text-foreground">
                                  {selectedAssessment.candidate.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <span className="font-medium text-foreground dark:text-foreground">Status:</span>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedAssessment.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Assessment Timeline */}
                    <Card className="bg-card dark:bg-card border-border dark:border-border">
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-foreground dark:text-foreground">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          Assessment Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="font-medium text-foreground dark:text-foreground">Assigned</p>
                            <p className="text-muted-foreground dark:text-muted-foreground">
                              {formatDate(selectedAssessment.assessment.assigned_at)}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                              by {selectedAssessment.assessment.assigned_by.name}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground dark:text-foreground">Due Date</p>
                            <p className="text-muted-foreground dark:text-muted-foreground">
                              {formatDate(selectedAssessment.assessment.due_at)}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground dark:text-foreground">Completed</p>
                            <p className="text-muted-foreground dark:text-muted-foreground">
                              {selectedAssessment.assessment.completed_at
                                ? formatDate(selectedAssessment.assessment.completed_at)
                                : "Not completed"}
                            </p>
                            <Badge variant="default" className="mt-1 text-xs">
                              {selectedAssessment.assessment.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Overall Score */}
                    {selectedAssessment.ai_score !== undefined && (
                      <Card className="bg-card dark:bg-card border-border dark:border-border">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm sm:text-base text-foreground dark:text-foreground">
                            AI Assessment Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={cn("text-xl sm:text-2xl font-bold", getScoreColor(selectedAssessment.ai_score, 100))}>
                              {selectedAssessment.ai_score}/100
                            </div>
                            <Badge variant="outline" className="text-sm sm:text-lg border-border dark:border-border">
                              AI Evaluated
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Glory Grades Display */}
                    {selectedAssessment.candidate.glory && renderFullGloryDisplay(selectedAssessment.candidate.glory)}

                    {/* Assessment Responses */}
                    <Card className="bg-card dark:bg-card border-border dark:border-border">
                      <CardHeader className="p-3 pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <CardTitle className="text-sm sm:text-base text-foreground dark:text-foreground">
                            📝 Assessment Responses
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssessmentCollapsed(!assessmentCollapsed)}
                            className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 h-6 sm:h-8 px-2 sm:px-3"
                          >
                            <span className="font-medium">
                              {assessmentCollapsed ? "Show" : "Hide"}
                            </span>
                            {assessmentCollapsed ? (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="space-y-3 sm:space-y-4">
                          {!assessmentCollapsed && selectedAssessment.responses.map((response, index) => (
                            <div
                              key={response.question_id}
                              className={cn(
                                "border border-border dark:border-border rounded-lg p-3 sm:p-4 bg-muted/20 dark:bg-muted/10 transition-all duration-200",
                                editingResponse === response.question_id && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 dark:bg-blue-900/10"
                              )}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 sm:mb-3 gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground">
                                      Q{index + 1}: {response.question_text}
                                    </h4>
                                    {getQuestionTypeBadge(response.type)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                  {response.flagged && (
                                    <Badge variant="destructive" className="text-xs">
                                      Flagged
                                    </Badge>
                                  )}
                                  {response.ai_score !== null && response.ai_score !== undefined && (
                                    <Badge variant="outline" className="text-xs border-border dark:border-border">
                                      Score: {response.ai_score}/{response.max_score || 10}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2 sm:space-y-3">
                                <div className="bg-muted/50 dark:bg-muted/30 p-2 sm:p-3 rounded text-xs sm:text-sm">
                                  {renderAnswer(response)}
                                </div>

                                {/* Review Section */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-border dark:border-border pt-2 sm:pt-3 gap-2">
                                  <div className="flex-1 min-w-0">
                                    {response.remarks && (
                                      <div className="text-xs sm:text-sm">
                                        <span className="font-medium text-foreground dark:text-foreground">Feedback:</span>
                                        <span className="text-muted-foreground dark:text-muted-foreground ml-1">
                                          {response.remarks}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setEditingResponse(
                                        editingResponse === response.question_id ? null : response.question_id
                                      )
                                    }
                                    className={cn(
                                      "text-xs h-6 sm:h-8 px-2 sm:px-3 border-border dark:border-border hover:bg-accent dark:hover:bg-accent",
                                      editingResponse === response.question_id && "bg-blue-100 dark:bg-blue-900/20 border-blue-500"
                                    )}
                                  >
                                    {editingResponse === response.question_id ? (
                                      <>
                                        <EyeClosed className="h-3 w-3 mr-1" />
                                        Close
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-3 w-3 mr-1" />
                                        Review
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* 🆕 UPDATED: Use the new AssessmentManualReviewForm */}
                                {editingResponse === response.question_id && (
                                  <AssessmentManualReviewForm
                                    response={response}
                                    onUpdate={async (updates) => {
                                      await updateResponseReview(
                                        selectedAssessment!._id,
                                        response.question_id,
                                        updates
                                      );
                                    }}
                                    loading={loadingActions[`review_${response.question_id}`]}
                                    questionIndex={index}
                                    assessmentId={selectedAssessment._id}
                                    onSaveSuccess={handleReviewSaveSuccess}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Proctoring Information */}
                    <Card className="bg-card dark:bg-card border-border dark:border-border">
                      <CardHeader className="p-3 pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <CardTitle className="text-sm sm:text-base text-foreground dark:text-foreground">
                            🔍 Proctoring Information
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProctorCollapsed(!proctorCollapsed)}
                            className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 h-6 sm:h-8 px-2 sm:px-3"
                          >
                            <span className="font-medium">
                              {proctorCollapsed ? "Show" : "Hide"}
                            </span>
                            {proctorCollapsed ? (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {!proctorCollapsed && (
                          <div className="space-y-4">
                            {/* Proctoring Logs */}
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-foreground dark:text-foreground">
                                Activity Logs
                              </h4>
                              {renderProctoringLogs()}
                            </div>

                            {/* Proctoring Snapshots */}
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-foreground dark:text-foreground">
                                Snapshots
                              </h4>
                              {renderSnapshots()}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed Footer */}
              <div className="flex flex-col sm:flex-row justify-between pt-2 sm:pt-3 border-t border-border dark:border-border flex-shrink-0 bg-background dark:bg-background px-3 sm:px-4 pb-3 sm:pb-4 gap-2 sm:gap-0">
                <div className="flex gap-2">
                  {selectedAssessment && !selectedAssessment.ai_score && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => triggerAIEvaluation(selectedAssessment._id, e)}
                      disabled={!!loadingActions[`ai_${selectedAssessment._id}`]}
                      className="flex items-center gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
                    >
                      {loadingActions[`ai_${selectedAssessment._id}`] ? (
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary dark:border-primary" />
                      ) : (
                        <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      <span className="hidden sm:inline">Run AI Evaluation</span>
                      <span className="sm:hidden">AI Eval</span>
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeAssessmentDialog}
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
                  >
                    Close
                  </Button>

                  {/* Action Buttons */}
                  {selectedAssessment &&
                    selectedAssessment.candidate.current_stage === "assessment" &&
                    selectedAssessment.candidate.status !== "rejected" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const candidate = selectedAssessment.candidate;
                          const nameParts = candidate.name.split(" ");
                          setCandidateToReject({
                            _id: candidate._id,
                            first_name: nameParts[0] || "",
                            last_name: nameParts.slice(1).join(" ") || "",
                            email: candidate.email,
                            current_stage: candidate.current_stage || "assessment",
                            profile_photo_url: candidate.profile_photo_url,
                          });
                          setRejectionReason("");
                          setRejectDialogOpen(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">❌ Reject Candidate</span>
                        <span className="sm:hidden">❌ Reject</span>
                      </Button>
                    )}

                  {selectedAssessment &&
                    selectedAssessment.candidate.current_stage === "assessment" &&
                    selectedAssessment.candidate.status !== "rejected" && (
                      <GloryButton
                        candidate={transformCandidateForGlory(selectedAssessment)}
                        onOpenGlory={() => {
                          const transformedCandidate = transformCandidateForGlory(selectedAssessment);
                          if (transformedCandidate) {
                            openGloryDialog(transformedCandidate);
                          } else {
                            toast.error("Invalid candidate data for Glory grading");
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                      />
                    )}

                  {selectedAssessment &&
                    selectedAssessment.candidate.status !== "rejected" &&
                    selectedAssessment.candidate.current_stage === "assessment" && (
                      <Button
                        size="sm"
                        onClick={() => setStageUpdateModal(true)}
                        className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">🔄 Update Stage</span>
                        <span className="sm:hidden">🔄 Stage</span>
                      </Button>
                    )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <p className="text-muted-foreground dark:text-muted-foreground text-sm sm:text-base">
                No assessment details found
              </p>
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

      {/* Stage Update Modal */}
      <Dialog open={stageUpdateModal} onOpenChange={setStageUpdateModal}>
        <DialogContent className="max-w-md bg-background dark:bg-background border-border dark:border-border">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-foreground dark:text-foreground">Update Candidate Stage</DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
              Move {selectedAssessment?.candidate.name} to the next stage of the hiring process
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedAssessment && selectedNewStage && stageFeedback) {
                updateCandidateStage(
                  selectedAssessment.candidate._id,
                  selectedNewStage,
                  stageFeedback,
                  stageUpdateReason
                );
              }
            }}
          >
            <div className="space-y-3 py-2">
              <div>
                <label className="text-sm font-medium text-foreground dark:text-foreground">New Stage</label>
                <select
                  value={selectedNewStage}
                  onChange={(e) => setSelectedNewStage(e.target.value)}
                  className="w-full p-2 border border-border dark:border-border rounded mt-1 bg-background dark:bg-background text-foreground dark:text-foreground text-sm"
                  required
                >
                  <option value="">Select Stage</option>
                  <option value="hr">HR</option>
                  <option value="assessment">Assessment</option>
                  <option value="manager">Manager Review</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground dark:text-foreground">Remarks</label>
                <textarea
                  value={stageUpdateReason}
                  onChange={(e) => setStageUpdateReason(e.target.value)}
                  placeholder="Add transition remarks..."
                  className="w-full p-2 border border-border dark:border-border rounded mt-1 bg-background dark:bg-background text-foreground dark:text-foreground text-sm"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  This reason will be stored in stage history.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground dark:text-foreground">
                  Internal Feedback <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  value={stageFeedback}
                  onChange={(e) => setStageFeedback(e.target.value)}
                  placeholder="Provide internal feedback for this stage update..."
                  className="w-full p-2 border border-border dark:border-border rounded mt-1 bg-background dark:bg-background text-foreground dark:text-foreground text-sm"
                  rows={2}
                  required
                />
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  This feedback will be attached to the candidate's profile and visible only internally.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-border dark:border-border">
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
                className="text-sm border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatingStage || !selectedNewStage || !stageFeedback}
                className="text-sm"
              >
                {isUpdatingStage && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-foreground mr-2" />
                )}
                Update Stage
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-background dark:bg-background border-border dark:border-border">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              ⚠️ Confirm Candidate Rejection
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
              This action cannot be undone. Please provide a reason for rejecting this candidate.
            </DialogDescription>
          </DialogHeader>

          {candidateToReject && (
            <div className="space-y-3 py-2">
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
                      className={`${getStageColor(candidateToReject.current_stage)} text-xs`}
                      variant="outline"
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

