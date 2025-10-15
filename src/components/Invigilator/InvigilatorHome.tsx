import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Search,
  Users,
  UserCheck,
  UserX,
  Check,
  Filter,
  ClipboardCheck,
  Copy,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import GloryDialog from "../GloryDialog";

import { useGlory } from "@/hooks/useGlory";
import GloryDisplay from "../GloryDisplay";
import { differenceInYears } from "date-fns";

interface InterviewRemark {
  _id: string;
  provider: string;
  remark: string;
  grade: string;
  created_at: string;
}

// Assessment status type definition (matching your backend model)
type BackendAssessmentStatus = "pending" | "started" | "completed" | "expired";
type FrontendAssessmentStatus =
  | "completed"
  | "assigned"
  | "not-assigned"
  | "expired";

// Updated Zod Schema - matching backend bulk format with SEB and exam duration
const assessmentCreateSchema = z.object({
  assessments: z
    .array(
      z.object({
        candidate: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid candidate ID format"),
        questions: z
          .array(
            z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID format")
          )
          .min(1, "At least one question is required")
          .max(50, "Cannot assign more than 50 questions"),
        days_to_complete: z
          .number()
          .min(1, "Must be at least 1 day")
          .max(30, "Cannot exceed 30 days")
          .optional(),
        is_seb: z.boolean(),
        is_aiproctored: z.boolean(),
        exam_duration: z
          .number()
          .min(1, "Must be at least 1 minute")
          .max(600, "Cannot exceed 10 hours"),
      })
    )
    .min(1, "At least one assessment is required"),
});

type AssignmentFormData = z.infer<typeof assessmentCreateSchema>;

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

interface Question {
  _id: string;
  text: string;
  type: "mcq" | "coding" | "essay";
  options?: string[];
  correct_answers?: string[];
  explanation?: string;
  is_must_ask?: boolean;
  max_score?: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type Candidate = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  shortlisted: boolean;
  profile_photo_url: {
    url: string;
    publicId: string;
  };
  applied_job: {
    _id: string;
    name: string;
    description: string;
    location: string;
    country: string;
    time: string;
    expInYears: string;
    salary: string;
    jobId: string;
    title: string;
  };
  current_stage:
    | "registered"
    | "hr"
    | "assessment"
    | "tech"
    | "manager"
    | "feedback";
  glory?: { [role: string]: GloryRoleData };
  status:
    | "active"
    | "inactive"
    | "withdrawn"
    | "rejected"
    | "hired"
    | "deleted";
  email_verified: boolean;
  registration_date: string;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
  documents?: { _id: string; documenttype: string; documenturl: string }[];
  hrQuestionnaire?: {
    _id: string;
    status: string;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
  }[];
  assessments?: {
    _id: string;
    status: BackendAssessmentStatus;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
  }[];
  interviews?: {
    _id: string;
    title: string;
    status: string;
    type: string;
    meeting_link?: string;
    platform?: string;
    description?: string;
    interviewers: {
      _id: string;
      name: string;
      role: string;
    }[];
    scheduled_by: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    remarks?: InterviewRemark[];
  }[];
  stage_history?: {
    _id: string;
    from_stage?: string;
    to_stage: string;
    changed_by?: {
      _id: string;
      name: string;
      role: string;
    };
    action: string;
    remarks: string;
    changed_at: string;
  }[];
  internal_feedback?: {
    _id: string;
    feedback_by: {
      _id: string;
      name: string;
      role: string;
    };
    feedback: string;
    feedback_at?: string;
  }[];
};

const InvigilatorHome = () => {
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

  // State management for candidates and filters
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<
    FrontendAssessmentStatus | "all"
  >("all");

  // Dialog states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Assignment Dialog States
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [targetCandidate, setTargetCandidate] = useState<Candidate | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Rejection Dialog States
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Stage Update Dialog States
  const [stageUpdateModal, setStageUpdateModal] = useState(false);
  const [stageUpdateReason, setStageUpdateReason] = useState("");
  const [stageFeedback, setStageFeedback] = useState("");
  const [selectedNewStage, setSelectedNewStage] = useState("");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Dialog states for Feedback - FIXED naming consistency
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [candidateForFeedback, setCandidateForFeedback] =
    useState<Candidate | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [personalCollapsed, setPersonalInfoCollapsed] = useState(false);
  const [interviewsCollapsed, setInterviewsCollapsed] = useState(false);
  const [feedBackCollapsed, setFeedBackCollapsed] = useState(false);
  const [timeLineCollapsed, setTimeLineCollapsed] = useState(false);

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A+":
        return "bg-blue-300 text-blue-700 dark:bg-blue-900/30 dark:text-blue-700";
      case "A":
        return "bg-green-300 text-green-700 dark:bg-green-900/30 dark:text-green-700";
      case "B":
        return "bg-lime-300 text-lime-700 dark:bg-lime-900/30 dark:text-lime-700";
      case "C":
        return "bg-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-700";
      case "D":
        return "bg-orange-300 text-orange-700 dark:bg-orange-900/30 dark:text-orange-700";
      case "E":
        return "bg-red-300 text-red-700 dark:bg-red-900/30 dark:text-red-700";
      default:
        return "bg-gray-300 text-gray-700 dark:bg-gray-900/30 dark:text-gray-700";
    }
  };
  // Updated Glory helper functions
  const renderGloryGrades = (glory: any) => {
    if (
      !glory ||
      (glory instanceof Map && glory.size === 0) ||
      (typeof glory === "object" && Object.keys(glory).length === 0)
    ) {
      return <span className="text-xs text-muted-foreground">No grades</span>;
    }
    // Convert Map to Object if needed
    let gloryObj = glory;
    if (glory instanceof Map) {
      gloryObj = Object.fromEntries(glory);
    }

    // Get the first role that has grades to display in table - FIXED TYPE ASSERTION
    const firstRoleWithGrades = Object.entries(gloryObj).find(
      ([, data]: [string, any]) => {
        const roleData = data as {
          grades?: Record<string, string> | Map<string, string>;
        };
        const grades =
          roleData?.grades instanceof Map
            ? Object.fromEntries(roleData.grades)
            : roleData?.grades || {};
        return Object.keys(grades).length > 0;
      }
    );
    if (!firstRoleWithGrades) {
      return <span className="text-xs text-muted-foreground">No grades</span>;
    }

    const [role, roleData] = firstRoleWithGrades;
    const typedRoleData = roleData as {
      grades?: Record<string, string> | Map<string, string>;
    };

    const grades =
      typedRoleData?.grades instanceof Map
        ? Object.fromEntries(typedRoleData.grades)
        : typedRoleData?.grades || {};

    // Show overall grade if available, otherwise show first grade
    const displayGrade = grades.Overall || Object.values(grades)[0] || "N/A";

    return (
      <div className="flex items-center gap-1">
        <Badge
          variant="outline"
          className={`text-xs ${getGradeColor(displayGrade)}`}
        >
          {displayGrade}
        </Badge>
        
      </div>
    );
  };
    function useIsCompact(breakpoint = 1220) {
      const [isCompact, setIsCompact] = useState(false);
  
      useEffect(() => {
        const checkWidth = () => setIsCompact(window.innerWidth < breakpoint);
        checkWidth(); // run on mount
        window.addEventListener("resize", checkWidth);
        return () => window.removeEventListener("resize", checkWidth);
      }, [breakpoint]);
  
      return isCompact;
    }
    const isMobile = useIsCompact(430);
  // Helper function to render full Glory display in details
  const renderFullGloryDisplay = (glory: any) => {
    if (
      !glory ||
      (glory instanceof Map && glory.size === 0) ||
      (typeof glory === "object" && Object.keys(glory).length === 0)
    ) {
      return null;
    }

    // Convert Map to Object if needed
    let gloryObj = glory;
    if (glory instanceof Map) {
      gloryObj = Object.fromEntries(glory);
    }

    return (
      <>
        <GloryDisplay glory={gloryObj} />
      </>
    );
  };

  // Helper function to get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "hr":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "invigilator":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "admin":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // FIXED: Submit feedback function without parameters
  const submitFeedback = async () => {
    if (!candidateForFeedback?._id || !feedbackContent.trim()) {
      toast.error("Please provide feedback content");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await api.post(
        `/org/candidates/${candidateForFeedback._id}/feedback`,
        {
          content: feedbackContent.trim(),
          feedback_type: feedbackType,
        }
      );

      if (response.data.success) {
        toast.success("Feedback added successfully");
        // Close dialog and reset state
        setFeedbackDialogOpen(false);
        setCandidateForFeedback(null);
        setFeedbackContent("");
        setFeedbackType("general");
        // Refresh data
        await fetchCandidates();
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to add feedback";
      toast.error(errorMessage || "Failed to add feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Define allowed question types - ONLY MCQ, Coding, Essay
  const allowedQuestionTypes = ["mcq", "coding", "essay"];

  // Form for assessment assignment - Updated to match backend schema with SEB and exam duration
  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assessmentCreateSchema),
    defaultValues: {
      assessments: [
        {
          candidate: "",
          questions: [],
          days_to_complete: 7,
          is_seb: false,
          is_aiproctored: true,
          exam_duration: 60,
        },
      ],
    },
  });

  // FIXED: Use useWatch for reactive total marks calculation
  const selectedQuestionIds =
    useWatch({
      control: assignmentForm.control,
      name: "assessments.0.questions",
    }) || [];

  const totalMarks = useMemo(() => {
    if (!Array.isArray(selectedQuestionIds) || selectedQuestionIds.length === 0)
      return 0;
    const scoreById = new Map(questions.map((q) => [q._id, q?.max_score ?? 0]));
    return selectedQuestionIds.reduce(
      (sum, id) => sum + (scoreById.get(id) ?? 0),
      0
    );
  }, [selectedQuestionIds, questions]);

  const copyToClipboard = async (
    url: string,
    docId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(url);
      setCopiedDocId(docId);
      toast.success("Document link copied to clipboard");

      setTimeout(() => setCopiedDocId(null), 2000);
    } catch (error) {
            toast.error("Failed to copy link");
    }
  };

  // Rejection Handler
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
        // Refresh candidates data
        await fetchCandidates();
        setDialogOpen(false);
        setRejectDialogOpen(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to reject candidate";
      toast.error(errorMessage || "Failed to reject candidate");
    } finally {
      setIsRejecting(false);
    }
  };

  // Stage Update Handler
  const updateCandidateStage = async (
    candidateId: string,
    newStage: string,
    internal_feedback: string,
    remarks?: string
  ) => {
    setIsUpdatingStage(true);
    try {
      const invigilatorGlory = selectedCandidate?.glory?.invigilator;
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
        // Refresh candidates data
        await fetchCandidates();
        setDialogOpen(false);
        setStageUpdateModal(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to update candidate stage";
      toast.error(errorMessage || "Failed to update candidate stage");
    } finally {
      setIsUpdatingStage(false);
    }
  };

  /**
   * Helper function to map backend status to frontend display status
   */
  const getAssessmentStatus = (
    candidate: Candidate
  ): FrontendAssessmentStatus => {
    
    if (!candidate.assessments || candidate.assessments.length === 0) {
      return "not-assigned";
    }

    // ✅ Check for completed first (highest priority)
    const hasCompleted = candidate.assessments.some(
      (a) => a.status === "completed"
    );
    if (hasCompleted) {
      return "completed";
    }

    // ✅ Check for active assessments (started/pending) next
    const hasActiveAssessments = candidate.assessments.some(
      (a) => a.status === "started" || a.status === "pending"
    );
    if (hasActiveAssessments) {
      return "assigned";
    }

    // ✅ Only check for expired if no active assessments exist (lowest priority)
    const hasExpired = candidate.assessments.some(
      (a) => a.status === "expired"
    );
    if (hasExpired) {
      return "expired";
    }

    // Fallback (shouldn't normally reach here)
    return "assigned";
  };

  /**
   * Filter questions to only include allowed types
   */
  const getFilteredQuestions = (): Question[] => {
    return questions.filter((question) =>
      allowedQuestionTypes.includes(question.type)
    );
  };

  // FIXED: Create fetchCandidates function
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/org/candidates");
      setCandidates(response.data.data);
      setFilteredCandidates(response.data.data);
    } catch (error) {
            toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all candidates from the API
   */
  useEffect(() => {
    fetchCandidates();
  }, []);

  /**
   * Fetch questions for assignment and filter them
   */
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get("/org/question");
        const allQuestions = response.data.data || [];

        // Filter to only include allowed question types
        const filteredQuestions = allQuestions.filter((question: Question) =>
          allowedQuestionTypes.includes(question.type)
        );

        setQuestions(filteredQuestions);
      } catch (error) {
                toast.error("Failed to load questions");
      }
    };
    fetchQuestions();
  }, []);

  const closeViewDialog = () => {
    setDialogOpen(false);
    setSelectedCandidate(null);
  };

  /**
   * Filter candidates based on search term and assessment status
   */
  useEffect(() => {
    let filtered = candidates;

    // Filter by current stage - only show assessment stage candidates
    filtered = filtered.filter(
      (candidate) => candidate.current_stage === "assessment"
    );

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.first_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          candidate.last_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply assessment status filter
    if (assessmentStatusFilter !== "all") {
      filtered = filtered.filter((candidate) => {
        const status = getAssessmentStatus(candidate);
        return status === assessmentStatusFilter;
      });
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, assessmentStatusFilter]);

  // Open assignment dialog with single candidate pre-selected
  const openSingleCandidateAssignment = (candidate: Candidate) => {
    if (!candidate) {
      toast.error("No candidate selected");
      return;
    }

    setTargetCandidate(candidate);
    setDialogOpen(false);
    setAssignmentDialogOpen(true);

    // Auto-select the candidate in the bulk format
    assignmentForm.reset({
      assessments: [
        {
          candidate: candidate._id,
          questions: [],
          days_to_complete: 7,
          is_seb: false,
          is_aiproctored: true,
          exam_duration: 60,
        },
      ],
    });
    setSelectedTags(new Set());
  };

  // Close assignment dialog
  const closeAssignmentDialog = () => {
    setAssignmentDialogOpen(false);
    setTargetCandidate(null);
    assignmentForm.reset({
      assessments: [
        {
          candidate: "",
          questions: [],
          days_to_complete: 7,
          is_seb: false,
          is_aiproctored: true,
          exam_duration: 60,
        },
      ],
    });
    setSelectedTags(new Set());
  };

  // Get unique tags from filtered questions
  const getUniqueTags = (): string[] => {
    const filteredQuestions = getFilteredQuestions();
    if (!filteredQuestions) return [];
    const tagsSet = new Set<string>();
    filteredQuestions.forEach((question) => {
      question.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  // Toggle tag selection for filtered questions
  const toggleTagSelection = (
    tag: string,
    field: { value: string[]; onChange: (value: string[]) => void }
  ) => {
    const filteredQuestions = getFilteredQuestions();
    const newSelectedTags = new Set(selectedTags);
    if (selectedTags.has(tag)) {
      newSelectedTags.delete(tag);
      const updatedQuestions = field.value.filter(
        (qid: string) =>
          !filteredQuestions.find((q) => q._id === qid)?.tags?.includes(tag)
      );
      field.onChange(updatedQuestions);
    } else {
      newSelectedTags.add(tag);
      const questionsToAdd = filteredQuestions
        .filter((q) => q.tags?.includes(tag) && !field.value.includes(q._id))
        .map((q) => q._id);
      field.onChange([...field.value, ...questionsToAdd]);
    }
    setSelectedTags(newSelectedTags);
  };

  // Updated submit handler to match backend bulk format with SEB and exam duration
  const onAssignmentSubmit = async (data: AssignmentFormData) => {
    if (!targetCandidate) {
      toast.error("No candidate selected");
      return;
    }

    try {
      setSubmitting(true);

      // Validate that we have questions selected
      if (data.assessments[0]?.questions.length === 0) {
        toast.error("Please select at least one question to assign");
        return;
      }

      
      const response = await api.post("/org/assessment", data);

      if (response.data.success) {
        toast.success(
          `Assessment assigned to ${targetCandidate.first_name} ${targetCandidate.last_name}`
        );
        closeAssignmentDialog();
        // Refresh candidates data
        await fetchCandidates();
      } else {
        toast.error(response.data.message || "Failed to assign assessment");
      }
    } catch (error: unknown) {
            const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to assign assessment";
      toast.error(errorMessage || "Failed to assign assessment");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle assignment action
  const handleAssignAssessment = (candidate: Candidate) => {
    openSingleCandidateAssignment(candidate);
  };

  /**
   * Badge styling for different assessment statuses
   */
  const getAssessmentStatusColor = (status: FrontendAssessmentStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "not-assigned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  /**
   * Badge styling for candidate stages
   */
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

  /**
   * Format date strings for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Fetch detailed candidate information for the modal
   */
  const fetchCandidateDetails = async (candidateId: string) => {
    try {
      setLoadingCandidate(true);
      const response = await api.get(`/org/candidates/${candidateId}`);
      setSelectedCandidate(response.data.data);
      setDialogOpen(true);
    } catch (error) {
            toast.error("Failed to load candidate details");
    } finally {
      setLoadingCandidate(false);
    }
  };

  /**
   * Calculate statistics for the dashboard
   */
  const stats = {
    total: candidates.filter((c) => c.current_stage === "assessment").length,
    completed: candidates.filter(
      (c) =>
        c.current_stage === "assessment" &&
        getAssessmentStatus(c) === "completed"
    ).length,
    assigned: candidates.filter(
      (c) =>
        c.current_stage === "assessment" &&
        getAssessmentStatus(c) === "assigned"
    ).length,
    notAssigned: candidates.filter(
      (c) =>
        c.current_stage === "assessment" &&
        getAssessmentStatus(c) === "not-assigned"
    ).length,
    expired: candidates.filter(
      (c) =>
        c.current_stage === "assessment" && getAssessmentStatus(c) === "expired"
    ).length,
  };

  /**
   * Get question type display name and color
   */
  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case "mcq":
        return "MCQ";
      case "coding":
        return "CODING";
      case "essay":
        return "ESSAY";
      default:
        return type.toUpperCase();
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "mcq":
        return "bg-blue-50 text-blue-700";
      case "coding":
        return "bg-green-50 text-green-700";
      case "essay":
        return "bg-purple-50 text-purple-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  /**
   * Loading state display
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Invigilator Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage candidate assessments during the evaluation process
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total in Assessment
            </CardTitle>
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Candidates in assessment stage
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Completed
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed assessments
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Assigned
            </CardTitle>
            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {stats.assigned}
            </div>
            <p className="text-xs text-muted-foreground">
              Assessments in progress
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Not Assigned
            </CardTitle>
            <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {stats.notAssigned}
            </div>
            <p className="text-xs text-muted-foreground">Pending assignment</p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Expired
            </CardTitle>
            <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
            <p className="text-xs text-muted-foreground">Expired assessments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            View and manage candidate assessments. Use filters to focus on
            specific assessment statuses.
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters and Search Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Assessment Status Filter */}
            <div className="min-w-[200px]">
              <Select
                value={assessmentStatusFilter}
                onValueChange={(value: FrontendAssessmentStatus | "all") =>
                  setAssessmentStatusFilter(value)
                }
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by assessment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="not-assigned">Not Assigned</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Candidates Table */}
          {!isMobile && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Glory</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => {
                    const assessmentStatus = getAssessmentStatus(candidate);

                    return (
                      <TableRow
                        key={candidate._id}
                        onClick={() => fetchCandidateDetails(candidate._id)}
                        className="cursor-pointer hover:bg-muted"
                      >
                        {/* Candidate Information */}
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage
                                src={candidate.profile_photo_url.url}
                              />
                              <AvatarFallback>
                                {candidate.first_name[0]}
                                {candidate.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {candidate.first_name} {candidate.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {candidate.gender} •{" "}
                                {formatDate(candidate.date_of_birth)}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Contact Information */}
                        <TableCell>
                          <div>
                            <div className="text-sm">{candidate.email}</div>
                            <div className="text-sm text-muted-foreground">
                              {candidate.phone}
                            </div>
                          </div>
                        </TableCell>

                        {/* Assessment Status Badge */}
                        <TableCell>
                          <Badge
                            className={getAssessmentStatusColor(assessmentStatus)}
                          >
                            {assessmentStatus.replace("-", " ").toUpperCase()}
                          </Badge>
                        </TableCell>

                        {/* Glory */}
                        <TableCell>
                          {renderGloryGrades(candidate.glory)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile Candidates Table */}
          {isMobile && (
            <div className="border rounded-lg overflow-hidden">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full">Candidate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => {
                    const assessmentStatus = getAssessmentStatus(candidate);

                    return (
                      <TableRow
                        key={candidate._id}
                        onClick={() => fetchCandidateDetails(candidate._id)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="w-full pr-2">
                          <div className="flex items-center space-x-3 min-w-0">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage
                                src={candidate.profile_photo_url.url}
                              />
                              <AvatarFallback className="text-xs font-medium">
                                {candidate.first_name[0]}
                                {candidate.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate text-sm">
                                {candidate.first_name} {candidate.last_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Empty State */}
          {filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No candidates found matching your criteria.
                {assessmentStatusFilter !== "all" && (
                  <span className="block mt-2">
                    Try changing the assessment status filter or search term.
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="h-screen max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full max-h-none sm:max-h-none flex flex-col overflow-hidden bg-background border-0 sm:border rounded-none sm:rounded-lg m-0 sm:m-2 p-0">

          {/* Main Content - NO SCROLL */}
          <div className="flex-1 min-h-0 px-4 py-3 sm:px-6 sm:py-4 flex flex-col overflow-hidden">
            <div className="flex flex-col h-full space-y-4 sm:space-y-6 overflow-hidden">

              {/* Compact Candidate Info - Fixed Height */}
              {targetCandidate && (
                <div className="flex-shrink-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Label className="text-xs font-medium block mb-1">
                    Assigning assessment to:
                  </Label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={targetCandidate.profile_photo_url?.url} />
                        <AvatarFallback>
                          {targetCandidate.first_name[0]}
                          {targetCandidate.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight min-w-0 flex-1">
                        <div className="font-medium text-sm text-foreground dark:text-foreground truncate">
                          {targetCandidate.first_name} {targetCandidate.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
                          {targetCandidate.email}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
                          {targetCandidate.applied_job?.title}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={getStageColor(targetCandidate.current_stage)}
                      variant="outline"
                    >
                      {targetCandidate.current_stage?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Form Content - Fills remaining space */}
              <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="flex-1 min-h-0 flex flex-col space-y-4 sm:space-y-6 overflow-hidden">
                
                {/* Questions Selection - Takes remaining space */}
                <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-hidden">
                  <Label className="text-sm font-medium flex-shrink-0">
                    Select Questions 
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground ml-2">
                      (Showing only: MCQ, Coding, Essay types)
                    </span>
                  </Label>
                  
                  {/* Compact Tag Selection - Always Visible on All Screens */}
                  {getUniqueTags().length > 0 && (
                    <div className="flex-shrink-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Quick Select by Tags:</Label>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {getUniqueTags().map((tag) => (
                          <Controller
                            key={tag}
                            name="assessments.0.questions"
                            control={assignmentForm.control}
                            render={({ field }) => {
                              const isTagSelected = selectedTags.has(tag);
                              return (
                                <Button
                                  type="button"
                                  variant={isTagSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleTagSelection(tag, field)}
                                  className="text-xs h-6 px-2 sm:h-7"
                                >
                                  {isTagSelected && "✓ "}{tag}
                                  <Badge variant="secondary" className="ml-1 text-xs h-4">
                                    {getFilteredQuestions().filter((q) => q.tags?.includes(tag)).length}
                                  </Badge>
                                </Button>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions List - Only this scrolls, takes remaining space */}
                  <Controller
                    name="assessments.0.questions"
                    control={assignmentForm.control}
                    render={({ field }) => {
                      const filteredQuestions = getFilteredQuestions();
                      
                      return (
                        <div className="flex-1 min-h-0 border border-border dark:border-border rounded-lg flex flex-col overflow-hidden">
                          
                          {/* Header - Always Visible with Mobile-Friendly Buttons */}
                          <div className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 border-b border-border dark:border-border bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-0">
                            <span className="text-xs sm:text-sm font-medium">
                              Select Questions 
                              <span className="hidden sm:inline">(Filtered for allowed types)</span>
                            </span>
                            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange(filteredQuestions.map(q => q._id));
                                  setSelectedTags(new Set(getUniqueTags()));
                                }}
                                className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                              >
                                <span className="sm:hidden">All</span>
                                <span className="hidden sm:inline">Select All</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange([]);
                                  setSelectedTags(new Set());
                                }}
                                className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                              >
                                Clear
                              </Button>
                            </div>
                          </div>

                          {/* ONLY SCROLLABLE AREA - Questions List */}
                          <div className="flex-1 min-h-0 overflow-y-auto">
                            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                              {filteredQuestions.length === 0 ? (
                                <p className="text-center text-muted-foreground dark:text-muted-foreground py-4 text-xs sm:text-sm">
                                  No questions found for allowed types (MCQ, Coding, Essay)
                                </p>
                              ) : (
                                filteredQuestions.map((question) => {
                                  const isChecked = field.value?.includes(question._id) || false;

                                  return (
                                    <div key={question._id} className="flex items-start space-x-3">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const currentValue = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentValue, question._id]);
                                          } else {
                                            field.onChange(currentValue.filter((id: string) => id !== question._id));
                                          }
                                        }}
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-foreground dark:text-foreground line-clamp-2">
                                          {question.text}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          <Badge
                                            variant="outline"
                                            className={`text-xs h-4 ${getQuestionTypeColor(question.type)}`}
                                          >
                                            {getQuestionTypeDisplay(question.type)}
                                          </Badge>
                                          {question.max_score && (
                                            <Badge variant="secondary" className="text-xs h-4">
                                              {question.max_score} pts
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Footer - Fixed */}
                          <div className="flex-shrink-0 p-2 sm:p-3 border-t border-border dark:border-border bg-gray-50 dark:bg-gray-800 text-xs text-muted-foreground dark:text-muted-foreground">
                            Selected: {field.value?.length || 0} of {filteredQuestions.length} questions
                            <span className="ml-2 text-blue-600 dark:text-blue-400">
                              (Filtered: MCQ, Coding, Essay only)
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>

                {/* Assessment Configuration - Fixed at bottom */}
                <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* SEB Field */}
                  <div className="space-y-2">
                    <Label htmlFor="is_seb" className="text-sm font-medium">
                      Safe Exam Browser (SEB)
                    </Label>
                    <Controller
                      name="assessments.0.is_seb"
                      control={assignmentForm.control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 p-2 border border-border dark:border-border rounded-lg bg-gray-50 dark:bg-gray-800">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="is_seb"
                          />
                          <Label htmlFor="is_seb" className="text-sm font-normal">
                            Required
                          </Label>
                        </div>
                      )}
                    />
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Secure browser requirement
                    </p>
                  </div>

                  {/* AI Proctoring Field - NEW */}
                  <div className="space-y-2">
                    <Label htmlFor="is_aiproctored" className="text-sm font-medium">
                      AI Proctoring
                    </Label>
                    <Controller
                      name="assessments.0.is_aiproctored"
                      control={assignmentForm.control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 p-2 border border-border dark:border-border rounded-lg bg-gray-50 dark:bg-gray-800">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="is_aiproctored"
                          />
                          <Label htmlFor="is_aiproctored" className="text-sm font-normal">
                            Enabled
                          </Label>
                        </div>
                      )}
                    />
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      AI-based monitoring
                    </p>
                  </div>

                  {/* Exam Duration Field */}
                  <div className="space-y-2">
                    <Label htmlFor="exam_duration" className="text-sm font-medium">
                      Exam Duration (Required)
                    </Label>
                    <Input
                      type="number"
                      {...assignmentForm.register("assessments.0.exam_duration", { valueAsNumber: true })}
                      min={1}
                      max={600}
                      placeholder="60"
                      className="w-full h-8"
                    />
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {assignmentForm.watch("assessments.0.exam_duration")
                        ? `${Math.floor((assignmentForm.watch("assessments.0.exam_duration") || 60) / 60)}h ${(assignmentForm.watch("assessments.0.exam_duration") || 60) % 60}m`
                        : "Time in minutes"
                      }
                    </p>
                    {assignmentForm.formState.errors.assessments?.[0]?.exam_duration && (
                      <p className="text-red-600 text-sm">
                        {assignmentForm.formState.errors.assessments[0].exam_duration.message}
                      </p>
                    )}
                  </div>

                  {/* Days to Complete Field */}
                  <div className="space-y-2">
                    <Label htmlFor="days_to_complete" className="text-sm font-medium">
                      Days to Complete
                    </Label>
                    <Input
                      type="number"
                      {...assignmentForm.register("assessments.0.days_to_complete", { valueAsNumber: true })}
                      min={1}
                      max={30}
                      className="w-full h-8"
                      defaultValue={7}
                    />
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {assignmentForm.watch("assessments.0.days_to_complete")
                        ? `Due: ${new Date(Date.now() + (assignmentForm.watch("assessments.0.days_to_complete") || 7) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : "Deadline calculation"
                      }
                    </p>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border dark:border-border bg-background">
            <div className="flex gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAssignmentDialog}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={assignmentForm.handleSubmit(onAssignmentSubmit)}
                disabled={submitting}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                )}
                <span className="sm:hidden">Assign</span>
                <span className="hidden sm:inline">Assign Assessment</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Candidate Details Dialog with Action Buttons on Top */}
      <Dialog open={dialogOpen} onOpenChange={closeViewDialog}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <div className="space-y-3">
              <DialogTitle>Candidate Details</DialogTitle>
              
              {selectedCandidate && (
                <div className="flex flex-col gap-2">
                  {/* Primary Actions Row */}
                  <div className="flex flex-wrap gap-2">
                    {/* Assign Assessment Button - Primary Action for Invigilators */}
                    {selectedCandidate && !selectedCandidate.assessments?.some(assessment => 
                      assessment.status === "pending" || assessment.status === "started"
                    ) && (
                      <Button
                        onClick={() => handleAssignAssessment(selectedCandidate)}
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg flex-1 min-w-[120px]"
                      >
                        <ClipboardCheck className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline ml-1">Assign Assessment</span>
                        <span className="sm:hidden ml-1">Assess</span>
                      </Button>
                    )}

                    {/* Update Stage Button */}
                    <Button
                      onClick={() => {
                        setSelectedNewStage("");
                        setStageUpdateReason("");
                        setStageUpdateModal(true);
                      }}
                      variant="default"
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg flex-1 min-w-[120px]"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline ml-1">Update Stage</span>
                      <span className="sm:hidden ml-1">Stage</span>
                    </Button>

                    {/* Reject Button - Only if not already rejected */}
                    {selectedCandidate.status !== "rejected" && (
                      <Button
                        onClick={() => {
                          setCandidateToReject(selectedCandidate);
                          setRejectionReason("");
                          setRejectDialogOpen(true);
                        }}
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg flex-1 min-w-[100px]"
                      >
                        <span className="hidden sm:inline ml-1">Reject</span>
                        <span className="sm:hidden ml-1">✗</span>
                      </Button>
                    )}
                  </div>

                  {/* Secondary Actions Row */}
                  <div className="flex flex-wrap gap-2">

                    {/* Add Feedback Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCandidateForFeedback(selectedCandidate);
                        setFeedbackContent("");
                        setFeedbackType("general");
                        setFeedbackDialogOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 flex-1 min-w-[100px]"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Feedback
                    </Button>

                    {/* Glory Button */}
                    <Button
                      onClick={() => openGloryDialog(selectedCandidate)}
                      variant="outline"
                      size="sm"
                      className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300 flex-1 min-w-[90px]"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Glory
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6">
              {/* Personal Information Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>Personal Information</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPersonalInfoCollapsed(!personalCollapsed)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <span className="text-sm font-medium">
                        {personalCollapsed ? "Show" : "Hide"}
                      </span>
                      {personalCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Profile Info */}
                  {!personalCollapsed && (
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Avatar and Basic Info - Mobile Stack */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 border-2 border-gray-200 dark:border-gray-700 p-3 sm:p-4 rounded-xl w-full lg:w-auto">
                        <Avatar className="w-32 h-32 sm:w-40 sm:h-37 ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden rounded-md flex-shrink-0">
                          <AvatarImage
                            src={selectedCandidate.profile_photo_url?.url}
                            className="object-cover w-full h-full"
                          />
                          <AvatarFallback className="text-lg font-semibold flex items-center justify-center">
                            {selectedCandidate.first_name?.[0]}
                            {selectedCandidate.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
                          <p className="text-xs sm:text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                            <strong>
                              Applied For - {selectedCandidate.applied_job?.title}
                            </strong>
                          </p>
                          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
                            {selectedCandidate.first_name} {selectedCandidate.last_name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:justify-start items-center gap-2">
                            <span className="text-xs sm:text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                              <strong>Current Stage -</strong>
                            </span>
                            <Badge
                              className={getStageColor(selectedCandidate.current_stage)}
                              variant="secondary"
                            >
                              {selectedCandidate.current_stage?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <strong className="text-purple-600 dark:text-purple-400">Status:</strong>{" "}
                              <span
                                className={`inline-flex items-center gap-1 px-1 ${
                                  selectedCandidate.status.toLowerCase() === "hired"
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-yellow-700 dark:text-yellow-300"
                                }`}
                              >
                                {selectedCandidate.status.toUpperCase()}
                                {selectedCandidate.status.toLowerCase() === "hired" && (
                                  <Check className="w-3 h-3" />
                                )}
                              </span>
                            </div>
                          </div>
                          {/* Contact Info - Mobile Stack */}
                          <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="break-all">📧 {selectedCandidate.email}</span>
                            <span>📱 {selectedCandidate.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Personal Details Grid - Mobile Responsive */}
                      <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        {/* Personal Details Grid - Mobile Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {selectedCandidate.date_of_birth && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                                DATE OF BIRTH
                                <sup>
                                  <i className="text-blue-400">
                                    {differenceInYears(
                                      new Date(),
                                      new Date(selectedCandidate.date_of_birth)
                                    ) + " year"}
                                  </i>
                                </sup>
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                                {formatDate(selectedCandidate.date_of_birth)}
                              </p>
                            </div>
                          )}

                          {selectedCandidate.gender && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                                GENDER
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCandidate.gender}
                              </p>
                            </div>
                          )}

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                              REGISTRATION
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                              {formatDate(selectedCandidate.registration_date)}
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                              SHORTLISTED
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {selectedCandidate.shortlisted ? "✅ Yes" : "❌ No"}
                            </p>
                          </div>
                        </div>

                        {/* Address - Mobile Responsive */}
                        {selectedCandidate.address && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide">
                              Address
                            </p>
                            <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                              {selectedCandidate.address}
                            </p>
                          </div>
                        )}

                        {/* Job Details Grid - Mobile Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
                          {selectedCandidate.applied_job?.title && (
                            <div className="sm:col-span-2 font-semibold text-sm text-gray-800 dark:text-gray-200 break-words">
                              📌 {selectedCandidate.applied_job.title}
                            </div>
                          )}
                          {selectedCandidate.applied_job?.location && (
                            <div className="break-words">📍 {selectedCandidate.applied_job?.location}</div>
                          )}
                          {selectedCandidate.applied_job?.country && (
                            <div className="break-words">🌍 {selectedCandidate.applied_job.country}</div>
                          )}
                          {selectedCandidate.applied_job?.time && (
                            <div className="break-words">⏰ {selectedCandidate.applied_job.time}</div>
                          )}
                          {selectedCandidate.applied_job?.expInYears && (
                            <div className="break-words">💼 {selectedCandidate.applied_job.expInYears}Years</div>
                          )}
                          {selectedCandidate.applied_job?.salary && (
                            <div className="sm:col-span-2 break-words">
                              💰 {selectedCandidate.applied_job.salary}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Documents - Compact One Line Version */}
              {selectedCandidate.documents &&
                selectedCandidate.documents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Documents ({selectedCandidate.documents.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 overflow-x-auto">
                        {selectedCandidate.documents.map((doc) => (
                          <div
                            key={doc._id}
                            className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 whitespace-nowrap transition-colors"
                          >
                            {/* Document Name - Clickable */}
                            <span
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer underline decoration-dotted hover:decoration-solid transition-all"
                              title={`View ${doc.documenttype}`}
                              onClick={() =>
                                window.open(doc.documenturl, "_blank")
                              }
                            >
                              {doc.documenttype}
                            </span>

                            {/* Copy Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(doc.documenturl, doc._id, e);
                              }}
                              title="Copy document link"
                            >
                              {copiedDocId === doc._id ? (
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                              )}
                            </Button>

                            {/* View Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.documenturl, "_blank");
                              }}
                              title="View document"
                            >
                              <Eye className="w-3 h-3 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* HR Questionnaire */}
              {selectedCandidate.hrQuestionnaire &&
                selectedCandidate.hrQuestionnaire.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>HR Questionnaire</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCandidate.hrQuestionnaire.map(
                          (questionnaire) => (
                            <div
                              key={questionnaire._id}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  Questionnaire
                                </span>
                                <Badge
                                  className={
                                    questionnaire.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : questionnaire.status === "submitted"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  }
                                >
                                  {questionnaire.status.toUpperCase()}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Assigned by:
                                  </span>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {questionnaire.assigned_by.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {questionnaire.assigned_by.role}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Due date:
                                  </span>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatDate(questionnaire.due_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Assessment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.assessments &&
                  selectedCandidate.assessments.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCandidate.assessments.map((assessment) => (
                        <div
                          key={assessment._id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Technical Assessment
                            </span>
                            <Badge
                              className={
                                assessment.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : assessment.status === "started"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : assessment.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }
                            >
                              {assessment.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Assigned by:
                              </span>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {assessment.assigned_by.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {assessment.assigned_by.role}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Due date:
                              </span>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(assessment.due_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No technical assessments assigned yet
                      </p>
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => {
                          closeViewDialog();
                          handleAssignAssessment(selectedCandidate);
                        }}
                      >
                        Assign Technical Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Glory Grades Display */}
              {selectedCandidate.glory &&
                renderFullGloryDisplay(selectedCandidate.glory)}

              {/* Interviews Status - MERGED VERSION */}
              {selectedCandidate.interviews &&
                selectedCandidate.interviews.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                          <span>Interviews Overview</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedCandidate.interviews?.length || 0}{" "}
                            Scheduled
                          </Badge>
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setInterviewsCollapsed(!interviewsCollapsed)
                          }
                          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <span className="text-sm font-medium">
                            {interviewsCollapsed ? "Show" : "Hide"}
                          </span>
                          {interviewsCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {!interviewsCollapsed ? (
                        <div className="space-y-6">
                          {selectedCandidate.interviews.map((interview) => (
                            <div
                              key={interview._id}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-sm"
                            >
                              {/* Top Header */}
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {interview.title}
                                  </h4>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {interview.type.toUpperCase()}
                                    </Badge>
                                    {interview.platform && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {interview.platform}
                                      </Badge>
                                    )}
                                    <Badge
                                      className={
                                        interview.status === "scheduled"
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      }
                                    >
                                      {interview.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Scheduled by{" "}
                                  <span className="font-medium">
                                    {interview.scheduled_by.name}
                                  </span>
                                </div>
                              </div>

                              {/* Description */}
                              {interview.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {interview.description}
                                </p>
                              )}

                              {/* Interviewers Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Interviewers:
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {interview.interviewers.map(
                                      (interviewer) => (
                                        <Badge
                                          key={interviewer._id}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {interviewer.name} ({interviewer.role}
                                          )
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Meeting link */}
                              {interview.meeting_link && (
                                <div className="mb-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(
                                        interview.meeting_link,
                                        "_blank"
                                      )
                                    }
                                    className="text-xs"
                                  >
                                    Join Meeting
                                  </Button>
                                </div>
                              )}

                              {/* Remarks Section - FROM FIRST VERSION */}
                              {interview.remarks &&
                                interview.remarks.length > 0 && (
                                  <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <h5 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                      Remarks & Grades
                                    </h5>
                                    <div className="space-y-3">
                                      {interview.remarks.map((remark) => {
                                        const interviewer =
                                          interview.interviewers.find(
                                            (int) => int._id === remark.provider
                                          ) || interview.scheduled_by;

                                        return (
                                          <div
                                            key={remark._id}
                                            className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                                          >
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                  {interviewer?.name ||
                                                    "Unknown"}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                  {interviewer?.role ||
                                                    "Interviewer"}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                  "{remark.remark}"
                                                </p>
                                              </div>
                                              <Badge
                                                className={`text-xs font-bold ${getGradeColor(
                                                  remark.grade
                                                )}`}
                                              >
                                                {remark.grade}
                                              </Badge>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground text-sm">
                            {selectedCandidate.interviews.length} interview
                            {selectedCandidate.interviews.length !== 1
                              ? "s"
                              : ""}{" "}
                            scheduled
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Internal Feedback Section - Enhanced with Stage Information */}
                {selectedCandidate.internal_feedback &&
                  selectedCandidate.internal_feedback.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <CardTitle>
                            Internal Feedback{" "}
                            <Badge variant="secondary" className="text-xs ml-2">
                              {selectedCandidate.internal_feedback.length}
                            </Badge>
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFeedBackCollapsed(!feedBackCollapsed)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className="text-sm font-medium">
                              {feedBackCollapsed ? "Show" : "Hide"}
                            </span>
                            {feedBackCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {!feedBackCollapsed &&
                            selectedCandidate.internal_feedback.map((feedback) => (
                              <div
                                key={feedback._id}
                                className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 flex-shrink-0">
                                      <AvatarFallback className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                        {feedback.feedback_by.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 break-words">
                                        {feedback.feedback_by.name}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                        >
                                          {feedback.feedback_by.role}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right flex-shrink-0">
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                      Feedback
                                    </div>
                                    <div className="flex flex-wrap sm:justify-end items-center gap-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        At
                                      </span>
                                      <Badge
                                        className={`text-xs ${getStageColor(feedback.feedback_at)}`}
                                      >
                                        {feedback.feedback_at
                                          ? feedback.feedback_at.replace("_", " ").toUpperCase()
                                          : "UNKNOWN"}
                                      </Badge>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        stage
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                                    {feedback.feedback}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}


                {/* Stage History */}
                {selectedCandidate.stage_history &&
                  selectedCandidate.stage_history.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <CardTitle>Application Time-Line</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTimeLineCollapsed(!timeLineCollapsed)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className="text-sm font-medium">
                              {timeLineCollapsed ? "Show" : "Hide"}
                            </span>
                            {timeLineCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {!timeLineCollapsed &&
                            selectedCandidate.stage_history.map((stage) => (
                              <div
                                key={stage._id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 hover:shadow transition"
                              >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {stage.action?.toUpperCase() || "STAGE_CHANGE"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100 break-words">
                                      {stage.from_stage
                                        ? `${stage.from_stage} → ${stage.to_stage}`
                                        : stage.to_stage}
                                    </p>
                                    {stage.changed_by ? (
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Changed by{" "}
                                        <span className="font-medium break-words">
                                          {stage.changed_by.name}
                                        </span>
                                        <span className="ml-1 text-gray-500 dark:text-gray-500">
                                          ({stage.changed_by.role})
                                        </span>
                                      </p>
                                    ) : (
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        System generated
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {formatDate(stage.changed_at)}
                                  </span>
                                </div>
                                {stage.remarks && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 italic break-words">
                                      {stage.remarks}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
        role="invigilator" // Pass hardcoded role instead of onRoleChange
        onGradeChange={handleGloryGradeChange}
        onSubmit={() =>
          submitGloryGrades(() => {
            fetchCandidates();
            if (selectedCandidate) {
              fetchCandidateDetails(selectedCandidate._id);
            }
          })
        }
        getGradingParameters={getGradingParameters}
      />

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

      {/* Stage Update Dialog */}
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

          {selectedCandidate && (
            <div className="space-y-2">
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
                    disabled={selectedCandidate.current_stage === "hr"}
                  >
                    👥 HR Review
                  </option>
                  <option
                    value="manager"
                    disabled={selectedCandidate.current_stage === "manager"}
                  >
                    👔 Manager Review
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
                  selectedCandidate &&
                  selectedNewStage &&
                  stageFeedback.trim()
                ) {
                  updateCandidateStage(
                    selectedCandidate._id,
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

      <Dialog
        open={feedbackDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmittingFeedback) {
            setFeedbackDialogOpen(false);
            setCandidateForFeedback(null);
            setFeedbackContent("");
            setFeedbackType("general");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg bg-background dark:bg-background border-border dark:border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              💬 Add Feedback
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
              Provide feedback for this candidate's performance and evaluation.
            </DialogDescription>
          </DialogHeader>

          {candidateForFeedback && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={candidateForFeedback.profile_photo_url?.url}
                    />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {candidateForFeedback.first_name?.[0]}
                      {candidateForFeedback.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground dark:text-foreground">
                      {candidateForFeedback.first_name}{" "}
                      {candidateForFeedback.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {candidateForFeedback.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="feedback-type" className="text-foreground dark:text-foreground">
                  Feedback Type
                </Label>
                <Select
                  value={feedbackType}
                  onValueChange={setFeedbackType}
                  disabled={isSubmittingFeedback}
                >
                  <SelectTrigger className="bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background dark:bg-background border-border dark:border-border">
                    <SelectItem 
                      value="general"
                      className="text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
                    >
                      General
                    </SelectItem>
                    <SelectItem 
                      value="manager_review"
                      className="text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
                    >
                      Manager Review
                    </SelectItem>
                    <SelectItem 
                      value="interview_feedback"
                      className="text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
                    >
                      Interview Feedback
                    </SelectItem>
                    <SelectItem 
                      value="technical_review"
                      className="text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
                    >
                      Technical Review
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback Content */}
              <div className="space-y-2">
                <Label 
                  htmlFor="feedback-content"
                  className="text-foreground dark:text-foreground"
                >
                  Feedback Content
                </Label>
                <Textarea
                  id="feedback-content"
                  placeholder="Enter your detailed feedback about the candidate..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  disabled={isSubmittingFeedback}
                  rows={6}
                  className="bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackDialogOpen(false);
                setCandidateForFeedback(null);
                setFeedbackContent("");
                setFeedbackType("general");
              }}
              disabled={isSubmittingFeedback}
              className="bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white dark:text-white"
              onClick={submitFeedback}
              disabled={isSubmittingFeedback || !feedbackContent.trim()}
            >
              {isSubmittingFeedback ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                "💬 Submit Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default InvigilatorHome;
