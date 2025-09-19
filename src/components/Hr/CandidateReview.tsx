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
  FileText,
  Play,
  User,
  Mail,
  Briefcase,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import api from "@/lib/api";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import GloryDialog from "../GloryDialog";
import GloryButton from "../GloryButton";
import { useGlory } from "@/hooks/useGlory";
import GloryDisplay from "../GloryDisplay";

// Keep all existing interfaces
interface CandidateStatistics {
  _id: string;
  first_name: string;
  last_name: string;
}

interface RecentResponse {
  _id: string;
  candidate: CandidateStatistics;
  submitted_at: string;
  overallScore: number;
}

interface HRResponseStatistics {
  totalResponses: number;
  aiEvaluatedResponses: number;
  pendingEvaluation: number;
  averageScore: number;
  recentResponses: RecentResponse[];
}

interface StatisticsAPIResponse {
  success: boolean;
  data: HRResponseStatistics;
}

interface GloryData {
  [parameter: string]: string;
}

interface GloryRoleData {
  graderId?: string;
  graderName?: string;
  graderRole: 'hr' | 'manager' | 'invigilator' | 'admin';
  grades: GloryData; // ✅ Use plain object instead of Map
  gradedAt: string;
}

interface CandidateGlory {
  [role: string]: GloryRoleData;
}

interface CandidateListItem {
  _id: string;
  candidate: {
    name: string;
    email: string;
    profile_photo_url: {
      url: string;
      publicId: string;
    };
    applied_job: string;
  };
  submitted_at: string;
  questionnaire_status: string;
  assigned_at: string;
  response_count: number;
}

interface QuestionResponse {
  _id: string;
  question: {
    _id: string;
    text: string;
    input_type: "text" | "audio" | "mcq" | "checkbox";
    options: string[];
    tags: string[];
  };
  answer: string;
  attachment?: string;
  flagged: boolean;
  ai_score?: number;
  remarks?: string;
}

interface CandidateDetail {
  _id: string;
  candidate: {
    _id: string;
    name: string;
    email: string;
    profile_photo_url: {
      url: string;
      publicId: string;
    };
    current_stage: string;
    status: string;
    glory?: CandidateGlory; // Updated to use the new structure
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
  };
  questionnaire: {
    assigned_at: string;
    due_at: string;
    status: string;
    assigned_by: {
      name: string;
      email: string;
    };
  };
  responses: QuestionResponse[];
  submitted_at: string;
  overallScore?: number;
  summary?: string;
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

const CandidateReview = () => {
  // ✅ Use the Glory hook with hardcoded 'hr' role
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
  } = useGlory('hr'); // Hardcoded as 'hr' for this component

  // All existing state variables
  const [responsesList, setResponsesList] = useState<CandidateListItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statistics, setStatistics] = useState<HRResponseStatistics | null>(null);
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [stageUpdateModal, setStageUpdateModal] = useState(false);

  // Rejection related state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<CandidateToReject | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [responsesCollapsed,setResponsesCollapsed] = useState(false)

 // ✅ FIXED: Helper function to safely render Glory grades
const renderFullGloryDisplay = (glory: CandidateGlory | undefined) => {
  if (!glory || Object.keys(glory).length === 0) {
    return null;
  }
const rawGlory = glory;
const gloryObj = rawGlory instanceof Map ? Object.fromEntries(rawGlory) : rawGlory;
 return(
      <>
      <GloryDisplay glory={gloryObj} />
      </>
    )
};

// ✅ FIXED: Transform CandidateDetail to match Glory's expected candidate structure
const transformCandidateForGlory = (candidate: CandidateDetail): any => {
  if (!candidate?.candidate) {
    console.warn("Invalid candidate structure for Glory:", candidate);
    return null;
  }

  // Helper function to safely convert grades to plain object
  const convertGrades = (grades: any): GloryData => {
    if (grades instanceof Map) {
      return Object.fromEntries(grades);
    }
    if (typeof grades === 'object' && grades !== null) {
      // Ensure all values are strings
      const result: GloryData = {};
      for (const [key, value] of Object.entries(grades)) {
        result[key] = String(value);
      }
      return result;
    }
    return {};
  };

  // Transform glory data to ensure compatibility
  const transformedGlory: CandidateGlory = {};
  if (candidate.candidate.glory) {
    for (const [role, roleData] of Object.entries(candidate.candidate.glory)) {
      transformedGlory[role] = {
        graderId: roleData.graderId,
        graderName: roleData.graderName,
        graderRole: roleData.graderRole,
        grades: convertGrades(roleData.grades), // ✅ Convert to plain object
        gradedAt: roleData.gradedAt
      };
    }
  }

  try {
    const transformed = {
      _id: candidate.candidate._id || "",
      first_name: candidate.candidate.name?.split(" ")[0] || "",
      last_name: candidate.candidate.name?.split(" ").slice(1).join(" ") || "",
      email: candidate.candidate.email || "",
      profile_photo_url: candidate.candidate.profile_photo_url || { url: "", publicId: "" },
      applied_job: {
        _id: candidate.candidate.applied_job?._id || "",
        name: candidate.candidate.applied_job?.name || "",
        description: candidate.candidate.applied_job?.description || {},
        gradingParameters: candidate.candidate.applied_job?.gradingParameters || []
      },
      current_stage: candidate.candidate.current_stage || "",
      glory: transformedGlory
    };

    console.log("Transformed candidate for Glory:", transformed);
    return transformed;
  } catch (error) {
    console.error("Error transforming candidate for Glory:", error);
    return null;
  }
};

  // ✅ FIXED: Glory dialog opener with proper error handling
  const handleOpenGlory = (candidate: CandidateDetail) => {
    try {
      const transformedCandidate = transformCandidateForGlory(candidate);
      
      if (!transformedCandidate) {
        toast.error("Invalid candidate data for Glory grading");
        return;
      }

      console.log("Opening Glory dialog for:", transformedCandidate);
      openGloryDialog(transformedCandidate);
    } catch (error) {
      console.error("Error opening Glory dialog:", error);
      toast.error("Failed to open Glory grading dialog");
    }
  };

  // ✅ Keep all existing functions unchanged
  const fetchStatistics = async () => {
    try {
      const response = await api.get<StatisticsAPIResponse>("/org/hr-responses/statistics");
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const triggerAIEvaluation = async (responseId: string) => {
    setLoadingActions((prev) => ({ ...prev, [`ai_${responseId}`]: true }));
    try {
      const response = await api.post(`/org/hr-responses/${responseId}/evaluate`);

      if (selectedCandidate && selectedCandidate._id === responseId) {
        await fetchCandidateDetail(responseId);
      }

      await fetchResponsesList();
      console.log("AI evaluation completed:", response.data.message);
    } catch (error) {
      console.error("AI evaluation failed:", error);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`ai_${responseId}`]: false }));
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
      await api.patch(`/org/hr-responses/${responseId}/review`, {
        questionId,
        ...updates,
      });

      if (selectedCandidate) {
        await fetchCandidateDetail(selectedCandidate._id);
      }

      setEditingResponse(null);
    } catch (error) {
      console.error("Failed to update review:", error);
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        [`review_${questionId}`]: false,
      }));
    }
  };

  const updateCandidateStage = async (
    responseId: string,
    candidateId: string,
    newStage: string,
    feedback: string,
    remarks?: string
  ) => {
    setLoadingActions((prev) => ({ ...prev, [`stage_${responseId}`]: true }));
    try {
      console.log("HR Glory Grades=>",gloryGrades);
      const hrGlory = selectedCandidate?.candidate?.glory?.hr;
      if (!hrGlory || !hrGlory.grades || Object.keys(hrGlory.grades).length === 0) {
      toast.error("Glory Required To Stage Update");
      return;
      }
      await api.patch(`/org/candidates/${candidateId}/stage`, {
        newStage,
        remarks,
        internal_feedback: { feedback: feedback },
      });

      await Promise.all([
        fetchCandidateDetail(responseId),
        fetchResponsesList(),
      ]);

      setStageUpdateModal(false);
      setIsDialogOpen(false);
      toast.success(`Candidate stage updated to ${newStage.toUpperCase()}`);
    } catch (error: any) {
      console.error("Failed to update stage:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update candidate stage"
      );
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        [`stage_${responseId}`]: false,
      }));
    }
  };

  const fetchResponsesList = async () => {
    setLoadingList(true);
    try {
      const response = await api.get("/org/hr-responses");
      setResponsesList(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch responses list:", error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchCandidateDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/org/hr-responses/${id}`);
      setSelectedCandidate(response.data.data);
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
      setSelectedCandidate(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCandidateDialog = async (id: string) => {
    setIsDialogOpen(true);
    await fetchCandidateDetail(id);
  };

  const closeCandidateDialog = () => {
    setIsDialogOpen(false);
    setSelectedCandidate(null);
    setEditingResponse(null);
    setStageUpdateModal(false);
    setRejectDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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

  const renderAnswer = (response: QuestionResponse) => {
    const { question, answer, attachment } = response;

    switch (question.input_type) {
      case "audio":
        return (
          <div className="space-y-2">
            {answer && (
              <audio controls className="w-full">
                <source src={answer} type="audio/webm" />
                <source src={answer} type="audio/wav" />
                <source src={answer} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
            )}
            {attachment && (
              <a
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
              >
                <Play className="h-4 w-4" />
                Play Audio
              </a>
            )}
          </div>
        );
      case "checkbox":
        try {
          const selectedOptions = JSON.parse(answer);
          return (
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map((option: string, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {option}
                </Badge>
              ))}
            </div>
          );
        } catch {
          return <span>{answer}</span>;
        }
      case "mcq":
        return <Badge variant="outline">{answer}</Badge>;
      default:
        return <p className="whitespace-pre-wrap text-sm">{answer}</p>;
    }
  };

  useEffect(() => {
    fetchResponsesList();
    fetchStatistics();
  }, []);

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
        await fetchResponsesList();
        setIsDialogOpen(false);
        setRejectDialogOpen(false);
        setCandidateToReject(null);
        setRejectionReason("");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to reject candidate"
      );
    } finally {
      setIsRejecting(false);
    }
  };

  return (
<div className="h-full flex flex-col space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 bg-background dark:bg-background min-h-screen">
  {/* Compact Header with Statistics */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div className="space-y-1">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground dark:text-foreground">
        Candidate Reviews
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground">
        Review and evaluate candidate questionnaire responses
      </p>
    </div>
    
    {/* Responsive Stats Layout */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
      {statistics && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <Badge variant="outline" className="text-xs border-border dark:border-border">
            Total: {statistics.totalResponses}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Pending: {statistics.pendingEvaluation}
          </Badge>
          <Badge variant="default" className="text-xs">
            AI: {statistics.aiEvaluatedResponses}
          </Badge>
          <Badge variant="outline" className="text-xs border-border dark:border-border">
            Avg: {statistics.averageScore.toFixed(1)}/10
          </Badge>
        </div>
      )}
      <Badge variant="outline" className="text-xs sm:text-sm border-border dark:border-border">
        {responsesList.length} Responses
      </Badge>
    </div>
  </div>

  {/* Compact Responses Table */}
  <Card className="flex-1 bg-card dark:bg-card border-border dark:border-border">
    <CardHeader className="pb-2 sm:pb-3">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-foreground">
        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
        HR Questionnaire Responses
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
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
                  Applied Job
                </TableHead>
                <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3">
                  Status
                </TableHead>
                <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3 hidden md:table-cell">
                  Submitted
                </TableHead>
                <TableHead className="text-xs sm:text-sm text-foreground dark:text-foreground py-2 sm:py-3">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsesList.map((item) => (
                <TableRow
                  key={item._id}
                  className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/50 border-border dark:border-border"
                  onClick={() => openCandidateDialog(item._id)}
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
                        {/* Mobile: Show job here */}
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate sm:hidden">
                          {item.candidate.applied_job}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 sm:py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground dark:text-muted-foreground" />
                      <span className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground truncate">
                        {item.candidate.applied_job}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 sm:py-3">
                    <Badge
                      variant={
                        item.questionnaire_status === "submitted"
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        "text-xs",
                        item.questionnaire_status === "submitted" &&
                          "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300"
                      )}
                    >
                      {item.questionnaire_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 sm:py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground dark:text-muted-foreground" />
                      {formatDate(item.submitted_at)}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 sm:py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCandidateDialog(item._id);
                      }}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Review</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>

  {/* Compact Detail Dialog */}
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
          {selectedCandidate?.candidate.name || "Candidate Details"}
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
          Review questionnaire responses and provide evaluation
        </DialogDescription>
      </DialogHeader>

      {loadingDetail ? (
        <div className="flex justify-center items-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary dark:border-primary"></div>
        </div>
      ) : selectedCandidate ? (
        <>
          {/* Compact Scrollable Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto overscroll-contain">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Compact Candidate Info */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                        <AvatarImage
                          src={selectedCandidate.candidate.profile_photo_url?.url}
                          alt={selectedCandidate.candidate.name}
                        />
                        <AvatarFallback className="text-sm sm:text-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary">
                          {getInitials(selectedCandidate.candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground dark:text-foreground">
                          {selectedCandidate.candidate.name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground dark:text-muted-foreground" />
                            <span className="truncate text-foreground dark:text-foreground">
                              {selectedCandidate.candidate.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground dark:text-muted-foreground" />
                            <span className="truncate text-foreground dark:text-foreground">
                              {selectedCandidate.candidate.applied_job.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="font-medium text-foreground dark:text-foreground">Stage:</span>
                            <Badge variant="outline" className="text-xs border-border dark:border-border">
                              {selectedCandidate.candidate.current_stage}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="font-medium text-foreground dark:text-foreground">Status:</span>
                            <Badge variant="secondary" className="text-xs">
                              {selectedCandidate.candidate.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm space-y-1">
                          <p className="text-foreground dark:text-foreground">
                            <span className="font-medium">Location:</span>{" "}
                            {selectedCandidate.candidate.applied_job.description.location}
                          </p>
                          <p className="text-foreground dark:text-foreground">
                            <span className="font-medium">Experience:</span>{" "}
                            {selectedCandidate.candidate.applied_job.description.expInYears}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compact Timeline */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-foreground dark:text-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="font-medium text-foreground dark:text-foreground">Assigned</p>
                        <p className="text-muted-foreground dark:text-muted-foreground">
                          {formatDate(selectedCandidate.questionnaire.assigned_at)}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          by {selectedCandidate.questionnaire.assigned_by.name}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground dark:text-foreground">Due Date</p>
                        <p className="text-muted-foreground dark:text-muted-foreground">
                          {formatDate(selectedCandidate.questionnaire.due_at)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground dark:text-foreground">Submitted</p>
                        <p className="text-muted-foreground dark:text-muted-foreground">
                          {formatDate(selectedCandidate.submitted_at)}
                        </p>
                        <Badge variant="default" className="mt-1 text-xs">
                          {selectedCandidate.questionnaire.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compact Overall Score */}
                {selectedCandidate.overallScore && (
                  <Card className="bg-card dark:bg-card border-border dark:border-border">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm sm:text-base text-foreground dark:text-foreground">
                        Overall Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground">
                          {selectedCandidate.overallScore}/10
                        </div>
                        <Badge variant="outline" className="text-sm sm:text-lg border-border dark:border-border">
                          Overall Score
                        </Badge>
                      </div>
                      {selectedCandidate.summary && (
                        <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                          {selectedCandidate.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Glory Grades Display */}
                {selectedCandidate.candidate.glory && renderFullGloryDisplay(selectedCandidate.candidate.glory)}

                {/* Compact Responses */}
                <Card className="bg-card dark:bg-card border-border dark:border-border">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <CardTitle className="text-sm sm:text-base text-foreground dark:text-foreground">
                        📝 HR Questionnaire Responses
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResponsesCollapsed(!responsesCollapsed)}
                        className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 h-6 sm:h-8 px-2 sm:px-3"
                      >
                        <span className="font-medium">
                          {responsesCollapsed ? "Show" : "Hide"}
                        </span>
                        {responsesCollapsed ? (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      {!responsesCollapsed && selectedCandidate.responses.map((response, index) => (
                        <div
                          key={response._id}
                          className="border border-border dark:border-border rounded-lg p-3 sm:p-4 bg-muted/20 dark:bg-muted/10"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 sm:mb-3 gap-2">
                            <h4 className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground leading-relaxed">
                              Q{index + 1}: {response.question.text}
                            </h4>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              {response.flagged && (
                                <Badge variant="destructive" className="text-xs">
                                  Flagged
                                </Badge>
                              )}
                              {response.ai_score !== null && response.ai_score !== undefined && (
                                <Badge variant="outline" className="text-xs border-border dark:border-border">
                                  Score: {response.ai_score}/5
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 sm:space-y-3">
                            <div className="bg-muted/50 dark:bg-muted/30 p-2 sm:p-3 rounded text-xs sm:text-sm">
                              {renderAnswer(response)}
                            </div>

                            {/* Compact Review Section */}
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
                                    editingResponse === response._id ? null : response._id
                                  )
                                }
                                disabled={response.question.input_type === "audio"}
                                className="text-xs h-6 sm:h-8 px-2 sm:px-3 border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
                              >
                                {editingResponse === response._id ? "Cancel" : "Review"}
                              </Button>
                            </div>

                            {/* Compact Inline Edit Form */}
                            {editingResponse === response._id && (
                              <div className="bg-muted/30 dark:bg-muted/20 p-2 sm:p-3 rounded-lg border border-border dark:border-border space-y-2 sm:space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <div className="space-y-1">
                                    <label className="text-xs sm:text-sm font-medium text-foreground dark:text-foreground">
                                      Score (0-5)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="5"
                                      defaultValue={response.ai_score || 0}
                                      className="w-full px-2 py-1 border border-border dark:border-border rounded text-xs sm:text-sm bg-background dark:bg-background text-foreground dark:text-foreground"
                                      onBlur={(e) => {
                                        const score = parseInt(e.target.value);
                                        if (score >= 0 && score <= 5) {
                                          updateResponseReview(
                                            selectedCandidate!._id,
                                            response.question._id,
                                            { ai_score: score }
                                          );
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`flag-${response._id}`}
                                      defaultChecked={response.flagged}
                                      onChange={(e) =>
                                        updateResponseReview(
                                          selectedCandidate!._id,
                                          response.question._id,
                                          { flagged: e.target.checked }
                                        )
                                      }
                                      className="border-border dark:border-border"
                                    />
                                    <label
                                      htmlFor={`flag-${response._id}`}
                                      className="text-xs sm:text-sm text-foreground dark:text-foreground"
                                    >
                                      Flag for review
                                    </label>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs sm:text-sm font-medium text-foreground dark:text-foreground">
                                    Remarks
                                  </label>
                                  <textarea
                                    defaultValue={response.remarks || ""}
                                    placeholder="Add your feedback..."
                                    className="w-full px-2 py-1 border border-border dark:border-border rounded text-xs sm:text-sm bg-background dark:bg-background text-foreground dark:text-foreground"
                                    rows={2}
                                    onBlur={(e) =>
                                      updateResponseReview(
                                        selectedCandidate!._id,
                                        response.question._id,
                                        { remarks: e.target.value }
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Compact Fixed Footer */}
          <div className="flex flex-col sm:flex-row justify-between pt-2 sm:pt-3 border-t border-border dark:border-border flex-shrink-0 bg-background dark:bg-background px-3 sm:px-4 pb-3 sm:pb-4 gap-2 sm:gap-0">
            <div className="flex gap-2">
              {selectedCandidate && !selectedCandidate.overallScore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerAIEvaluation(selectedCandidate._id)}
                  disabled={!!loadingActions[`ai_${selectedCandidate._id}`]}
                  className="flex items-center gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
                >
                  {loadingActions[`ai_${selectedCandidate._id}`] ? (
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary dark:border-primary" />
                  ) : (
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
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
                onClick={closeCandidateDialog}
                className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
              >
                Close
              </Button>

              {/* Compact Action Buttons */}
              {selectedCandidate &&
                selectedCandidate.candidate.current_stage === "hr" &&
                selectedCandidate.candidate.status !== "rejected" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setCandidateToReject({
                      _id: selectedCandidate.candidate._id,
                      first_name: selectedCandidate.candidate.name.split(" ")[0] || "",
                      last_name: selectedCandidate.candidate.name.split(" ").slice(1).join(" ") || "",
                      email: selectedCandidate.candidate.email,
                      current_stage: selectedCandidate.candidate.current_stage,
                      profile_photo_url: selectedCandidate.candidate.profile_photo_url,
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
              
              {selectedCandidate &&
                selectedCandidate.candidate.current_stage === "hr" && 
                selectedCandidate.candidate.status !== "rejected" && (
                <GloryButton
                  candidate={transformCandidateForGlory(selectedCandidate)}
                  onOpenGlory={() => handleOpenGlory(selectedCandidate)}
                  variant="outline"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                />
              )}
              
              {selectedCandidate && 
                selectedCandidate.candidate.status !== "rejected" &&
                selectedCandidate.candidate.current_stage === "hr" && (
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
            No candidate details found
          </p>
        </div>
      )}
    </DialogContent>
  </Dialog>

  {/* Glory Dialog - Keep existing */}
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
    role="hr"
    onGradeChange={handleGloryGradeChange}
    onSubmit={() => submitGloryGrades(()=>{
      fetchResponsesList();
      if (selectedCandidate) {
        fetchCandidateDetail(selectedCandidate._id);
      }
    })}
    getGradingParameters={getGradingParameters}
  />

  {/* Compact Stage Update Modal */}
  <Dialog open={stageUpdateModal} onOpenChange={setStageUpdateModal}>
    <DialogContent className="max-w-md bg-background dark:bg-background border-border dark:border-border">
      <DialogHeader className="pb-2">
        <DialogTitle className="text-foreground dark:text-foreground">Update Candidate Stage</DialogTitle>
        <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
          Move {selectedCandidate?.candidate.name} to the next stage of the hiring process
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const newStage = formData.get("stage") as string;
          const remarks = formData.get("remarks") as string;
          const feedback = formData.get("feedback") as string;

          if (selectedCandidate) {
            updateCandidateStage(
              selectedCandidate._id,
              selectedCandidate.candidate._id,
              newStage,
              feedback,
              remarks
            );
          }
        }}
      >
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium text-foreground dark:text-foreground">New Stage</label>
            <select
              name="stage"
              className="w-full p-2 border border-border dark:border-border rounded mt-1 bg-background dark:bg-background text-foreground dark:text-foreground text-sm"
              required
            >
              <option value="">Select Stage</option>
              <option value="hr">HR</option>
              <option value="assessment">Assessment</option>
              <option value="manager">Manager Review</option>
              <option value="feedback">Final Feedback</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground dark:text-foreground">Remarks</label>
            <textarea
              name="remarks"
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
              name="feedback"
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
            onClick={() => setStageUpdateModal(false)}
            className="text-sm border-border dark:border-border hover:bg-accent dark:hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!!selectedCandidate && !!loadingActions[`stage_${selectedCandidate._id}`]}
            className="text-sm"
          >
            {selectedCandidate && loadingActions[`stage_${selectedCandidate._id}`] && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-foreground mr-2" />
            )}
            Update Stage
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>

  {/* Compact Rejection Dialog */}
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
                  className={getStageColor(candidateToReject.current_stage)}
                  variant="outline"
                  size="sm"
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

export default CandidateReview;
