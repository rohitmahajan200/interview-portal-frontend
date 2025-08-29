import { useEffect, useMemo, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, MessageSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, Users, UserCheck, UserX, Calendar, FileText } from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from 'react-redux';
import z from 'zod';
import { setCurrentHRPage } from '@/features/Org/View/HrViewSlice';
import { setPreSelectedCandidate } from '@/features/Org/HR/interviewSchedulingSlice';
import { DialogDescription } from '@radix-ui/react-dialog';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Label } from '@radix-ui/react-label';
import { Textarea } from '../ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';

type StageHistory = { 
  _id: string; 
  from_stage?: string;
  to_stage: string; 
  changed_by?: {
    _id: string; 
    name: string; 
    email?: string;
    role: string;
  }; 
  action: string;
  remarks: string; 
  changed_at: string;
}

const assessmentCreateSchema = z.object({
  assessments: z.array(z.object({
    candidate: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid candidate ID format"),
    questions: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID format"))
      .min(1, "At least one question is required")
      .max(50, "Cannot assign more than 50 questions"),
    days_to_complete: z.number().min(1, "Must be at least 1 day").max(30, "Cannot exceed 30 days").optional(),
    is_seb: z.boolean(),
    exam_duration: z.number().min(1, "Must be at least 1 minute").max(600, "Cannot exceed 10 hours")
  })).min(1, "At least one assessment is required")
});

type AssessmentFormData = z.infer<typeof assessmentCreateSchema>;

// HR Question Interface (for questionnaires)
interface HRQuestion {
  _id: string;
  question: string;
  input_type: string;
  tags?: string[];
}

// Technical Question Interface (for assessments)
interface TechnicalQuestion {
  _id: string;
  text: string;
  type: 'mcq' | 'coding' | 'essay';
  options?: string[];
  correct_answers?: string[];
  explanation?: string;
  is_must_ask?: boolean;
  max_score?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface HRQuestionnaireFormData {
  assigned_questions: string[];
  days_to_complete: number;
}

type Candidate = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female";
  address: string;
  shortlisted: boolean;
  profile_photo_url: {
    url: string;
    publicId: string;
  };
  applied_job: {
    _id: string;
    name: string;
    description: {
      location: string;
      country: string;
      time: string;
      expInYears: string;
      salary: string;
      jobId: string;
    };
  };
  current_stage: "registered" | "hr" | "assessment" | "tech" | "manager" | "feedback";
  status: "active" | "inactive" | "withdrawn" | "rejected" | "hired" | "deleted";
  email_verified: boolean;
  flagged_for_deletion: boolean;
  registration_date: string;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  documents?: { _id: string; document_type: string; document_url: string }[];
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
    status: string;
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
  }[];
  stage_history?: StageHistory[];
  default_hr_responses?: Array<{
    _id: string;
    question_text: string;
    response: string | string[];
    input_type: "text" | "audio" | "date" | "mcq" | "checkbox";
  }>;
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

const HRHome = () => {
  // Basic state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const dispatch = useDispatch();

  // HR Questionnaire States
  const [hrQuestions, setHrQuestions] = useState<HRQuestion[]>([]);
  const [assignHRQuestionnaireOpen, setAssignHRQuestionnaireOpen] = useState(false);
  const [targetCandidateForHR, setTargetCandidateForHR] = useState<Candidate | null>(null);
  const [selectedHRTags, setSelectedHRTags] = useState<Set<string>>(new Set());
  const [submittingHR, setSubmittingHR] = useState(false);

  // Technical Assessment States
  const [technicalQuestions, setTechnicalQuestions] = useState<TechnicalQuestion[]>([]);
  const [assignAssessmentOpen, setAssignAssessmentOpen] = useState(false);
  const [targetCandidateForAssessment, setTargetCandidateForAssessment] = useState<Candidate | null>(null);
  const [selectedAssessmentTags, setSelectedAssessmentTags] = useState<Set<string>>(new Set());
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  // Action States
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [stageUpdateModal, setStageUpdateModal] = useState(false);
  const [stageUpdateReason, setStageUpdateReason] = useState("");
  const [stageFeedback, setStageFeedback] = useState("");
  const [selectedNewStage, setSelectedNewStage] = useState("");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Dialog states for Feedback - Add after existing dialog states
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [candidateForFeedback, setCandidateForFeedback] = useState<Candidate | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Submit Feedback Handler
  const submitFeedback = async () => {
    if (!candidateForFeedback?._id || !feedbackContent.trim()) {
      toast.error("Please provide feedback content");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await api.post(`/org/candidates/${candidateForFeedback._id}/feedback`, {
        content: feedbackContent.trim(),
        feedback_type: feedbackType,
      });
      
      if (response.data.success) {
        toast.success("Feedback added successfully");
        setFeedbackDialogOpen(false);
        setCandidateForFeedback(null);
        setFeedbackContent("");
        setFeedbackType("general");
        await fetchAllData(); // Refresh data
      }
      setDialogOpen(false)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to add feedback";
      toast.error(errorMessage);
    } finally {
      setSubmittingFeedback(false);
    }
  };



  // Forms
  const hrQuestionnaireForm = useForm<HRQuestionnaireFormData>({
    defaultValues: {
      assigned_questions: [],
      days_to_complete: 7,
    },
  });

  const assessmentForm = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentCreateSchema),
    defaultValues: {
      assessments: []
    },
  });

  // FIXED: Use useWatch for reactive total marks calculation
  const selectedQuestionIds = useWatch({
    control: assessmentForm.control,
    name: 'assessments.0.questions'
  }) || [];

  const totalMarks = useMemo(() => {
    if (!Array.isArray(selectedQuestionIds) || selectedQuestionIds.length === 0) return 0;
    const scoreById = new Map(technicalQuestions.map(q => [q._id, q?.max_score ?? 0]));
    return selectedQuestionIds.reduce((sum, id) => sum + (scoreById.get(id) ?? 0), 0);
  }, [selectedQuestionIds, technicalQuestions]);

  // Technical Assessment Helpers
  const allowedQuestionTypes = ['mcq', 'coding', 'essay'];

  const getFilteredTechnicalQuestions = (): TechnicalQuestion[] => {
    return technicalQuestions.filter(question => allowedQuestionTypes.includes(question.type));
  };

  const getUniqueTechnicalTags = (): string[] => {
    const filteredQuestions = getFilteredTechnicalQuestions();
    if (!filteredQuestions) return [];
    const tagsSet = new Set<string>();
    filteredQuestions.forEach((question) => {
      question.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  // HR Questions Helpers
  const getUniqueHRTags = (): string[] => {
    if (!hrQuestions) return [];
    const tagsSet = new Set<string>();
    hrQuestions.forEach((q) => {
      q.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  // Toggle Functions
  const toggleHRTagSelection = (tag: string, field: { value: string[]; onChange: (value: string[]) => void }) => {
    const newSelectedTags = new Set(selectedHRTags);
    if (selectedHRTags.has(tag)) {
      newSelectedTags.delete(tag);
      const updatedQuestions = field.value.filter((qid: string) =>
        !hrQuestions.find((q) => q._id === qid)?.tags?.includes(tag)
      );
      field.onChange(updatedQuestions);
    } else {
      newSelectedTags.add(tag);
      const questionsToAdd = hrQuestions
        .filter((q) => q.tags?.includes(tag) && !field.value.includes(q._id))
        .map((q) => q._id);
      field.onChange([...field.value, ...questionsToAdd]);
    }
    setSelectedHRTags(newSelectedTags);
  };

  const toggleAssessmentTagSelection = (tag: string, field: { value: string[]; onChange: (value: string[]) => void }) => {
    const filteredQuestions = getFilteredTechnicalQuestions();
    const newSelectedTags = new Set(selectedAssessmentTags);
    if (selectedAssessmentTags.has(tag)) {
      newSelectedTags.delete(tag);
      const updatedQuestions = field.value.filter((qid: string) =>
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
    setSelectedAssessmentTags(newSelectedTags);
  };

  // Data Fetching
  const fetchAllData = async () => {
    try {
      // Fetch HR questions
      const hrQuestionsResponse = await api.get('/org/hr-questions');
      setHrQuestions(hrQuestionsResponse.data.data || []);
      
      // Fetch technical questions
      const techQuestionsResponse = await api.get('/org/question');
      const techQuestionsData = techQuestionsResponse.data.data || [];
      const filteredTechQuestions = techQuestionsData.filter((q: TechnicalQuestion) => 
        allowedQuestionTypes.includes(q.type)
      );
      setTechnicalQuestions(filteredTechQuestions);
      
      // Fetch candidates
      const candidatesResponse = await api.get('/org/candidates');
      setCandidates(candidatesResponse.data.data);
      setFilteredCandidates(candidatesResponse.data.data);
      
      console.log(`✅ Loaded ${hrQuestionsResponse.data.data?.length || 0} HR questions`);
      console.log(`✅ Loaded ${filteredTechQuestions.length} technical questions`);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to reload data');
    }
  };

  // Dialog Handlers
  const openHRQuestionnaireDialog = (candidate: Candidate) => {
    if (!candidate) {
      toast.error('No candidate selected');
      return;
    }
    
    setTargetCandidateForHR(candidate);
    setDialogOpen(false);
    setAssignHRQuestionnaireOpen(true);
    hrQuestionnaireForm.reset({
      assigned_questions: [],
      days_to_complete: 7,
    });
    setSelectedHRTags(new Set());
  };

  const closeHRQuestionnaireDialog = () => {
    setAssignHRQuestionnaireOpen(false);
    setTargetCandidateForHR(null);
    hrQuestionnaireForm.reset();
    setSelectedHRTags(new Set());
  };

  const openAssessmentDialog = (candidate: Candidate) => {
    if (!candidate) {
      toast.error('No candidate selected');
      return;
    }
    
    setTargetCandidateForAssessment(candidate);
    setDialogOpen(false);
    setAssignAssessmentOpen(true);
    
    assessmentForm.reset({
      assessments: [{
        candidate: candidate._id,
        questions: [],
        days_to_complete: 7,
        is_seb: false,
        exam_duration: 60
      }]
    });
    setSelectedAssessmentTags(new Set());
  };

  const closeAssessmentDialog = () => {
    setAssignAssessmentOpen(false);
    setTargetCandidateForAssessment(null);
    assessmentForm.reset();
    setSelectedAssessmentTags(new Set());
  };

  // Submit Handlers
  const onHRQuestionnaireSubmit = async (data: HRQuestionnaireFormData) => {
    if (!targetCandidateForHR) {
      toast.error('No candidate selected');
      return;
    }

    try {
      setSubmittingHR(true);
      const assignments = [{
        candidate: targetCandidateForHR._id,
        question_ids: data.assigned_questions,
        days_to_complete: data.days_to_complete
      }];

      const response = await api.post('/org/hr-questionnaires/assign', { assignments });
      
      if (response.data.success) {
        toast.success(`HR Questionnaire assigned to ${targetCandidateForHR.first_name} ${targetCandidateForHR.last_name}`);
        closeHRQuestionnaireDialog();
        fetchAllData();
      } else {
        toast.error(response.data.message || 'Failed to assign HR questionnaire');
      }
    } catch (error: any) {
      console.error('Failed to assign HR questionnaire:', error);
      toast.error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to assign HR questionnaire'
      );
    } finally {
      setSubmittingHR(false);
    }
  };

  const onAssessmentSubmit = async (data: AssessmentFormData) => {
    if (!targetCandidateForAssessment) {
      toast.error('No candidate selected');
      return;
    }

    try {
      setSubmittingAssessment(true);
      
      if (data.assessments[0]?.questions.length === 0) {
        toast.error('Please select at least one question to assign');
        return;
      }
      
      const response = await api.post('/org/assessment', data);
      
      if (response.data.success) {
        toast.success(`Technical Assessment assigned to ${targetCandidateForAssessment.first_name} ${targetCandidateForAssessment.last_name}`);
        closeAssessmentDialog();
        fetchAllData();
      } else {
        toast.error(response.data.message || 'Failed to assign technical assessment');
      }
    } catch (error: unknown) {
      console.error('Technical assessment assignment error:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to assign technical assessment';
      toast.error(errorMessage || 'Failed to assign technical assessment');
    } finally {
      setSubmittingAssessment(false);
    }
  };
  
  // Other Handlers
  const updateCandidateStage = async (candidateId: string, newStage: string, internal_feedback: string, remarks?: string, ) => {
    setIsUpdatingStage(true);
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/stage`, {
        newStage,
        remarks,
        internal_feedback: {feedback: internal_feedback}
      });
      
      if (response.data.success) {
        toast.success(`Candidate stage updated to ${newStage.toUpperCase()}`);
        fetchAllData();
        setDialogOpen(false);
        setStageUpdateModal(false);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update candidate stage");
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAssignInterview = (candidate: Candidate) => {
    dispatch(setPreSelectedCandidate(candidate));
    dispatch(setCurrentHRPage('interview-scheduling'));
    setSelectedCandidate(null);
  };

  const copyToClipboard = async (url: string, docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedDocId(docId);
      toast.success('Document link copied to clipboard');
      
      setTimeout(() => setCopiedDocId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const rejectCandidate = async (candidateId: string, reason: string) => {
    setIsRejecting(true);
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/reject`, {
        rejection_reason: reason
      });
      
      if (response.data.success) {
        toast.success("Candidate rejected successfully");
        fetchAllData();
        setDialogOpen(false);
        setRejectDialogOpen(false);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reject candidate");
    } finally {
      setIsRejecting(false);
    }
  };

  const shortlistCandidate = async (candidateId: string, reason?: string) => {
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/shortlist`, {
        shortlist_reason: reason
      });
      
      if (response.data.success) {
        toast.success("Candidate shortlisted successfully");
        fetchAllData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to shortlist candidate");
    }
  };

  const fetchCandidateDetails = async (candidateId: string) => {
    try {
      setLoadingCandidate(true);
      const response = await api.get(`/org/candidates/${candidateId}`);
      setSelectedCandidate(response.data.data);
      setDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
      toast.error("Failed to load candidate details");
    } finally {
      setLoadingCandidate(false);
    }
  };

  // Helper Functions
  const getQuestionTypeDisplay = (type: string) => {
    switch(type) {
      case 'mcq': return 'MCQ';
      case 'coding': return 'CODING';
      case 'essay': return 'ESSAY';
      default: return type.toUpperCase();
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch(type) {
      case 'mcq': return 'bg-blue-50 text-blue-700';
      case 'coding': return 'bg-green-50 text-green-700';
      case 'essay': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "registered": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "hr": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "assessment": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "tech": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "manager": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "feedback": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "withdrawn": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "hired": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Effects
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await api.get("/org/candidates");
        setCandidates(response.data.data);
        setFilteredCandidates(response.data.data);
      } catch (error) {
        console.error("Failed to fetch candidates:", error);
        toast.error("Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  useEffect(() => {
    let filtered = candidates;

    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'shortlisted') {
        filtered = filtered.filter(candidate => candidate.shortlisted === true);
      } else if (statusFilter === 'not-shortlisted') {
        filtered = filtered.filter(candidate => candidate.shortlisted === false);
      } else {
        filtered = filtered.filter(candidate => candidate.status === statusFilter);
      }
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, statusFilter]);

  // Statistics
  const stats = {
    total: candidates.length,
    active: candidates.filter(c => c.status === 'active').length,
    hr_stage: candidates.filter(c => c.current_stage === 'hr').length,
    pending_review: candidates.filter(c => c.current_stage === 'registered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster
        position="bottom-right"
        containerStyle={{ zIndex: 9999 }}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
        <p className="text-muted-foreground">
          Manage candidates and review applications
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_review}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In HR Stage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.hr_stage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="hr">HR Review</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="tech">Technical</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="shortlisted">⭐ Shortlisted</SelectItem>
                <SelectItem value="not-shortlisted">Not Shortlisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Candidates Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={candidate.profile_photo_url.url} />
                          <AvatarFallback>
                            {candidate.first_name[0]}{candidate.last_name}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {candidate.first_name} {candidate.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {candidate.gender} • {formatDate(candidate.date_of_birth)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{candidate.email}</div>
                        <div className="text-sm text-muted-foreground">{candidate.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageColor(candidate.current_stage)}>
                        {candidate.current_stage.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status.toUpperCase()}
                        </Badge>
                        
                        {candidate.shortlisted && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            ⭐ SHORTLISTED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(candidate.registration_date)}
                    </TableCell>
                    <TableCell>
                      {candidate.last_login ? formatDate(candidate.last_login) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchCandidateDetails(candidate._id)}
                          disabled={loadingCandidate}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No candidates found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Candidate Details</DialogTitle>
            </div>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Personal Information Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>Personal Information</CardTitle>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => openHRQuestionnaireDialog(selectedCandidate)}
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg flex-1 sm:flex-none"
                      >
                        📋 <span className="hidden md:inline">Assign HR Questionnaire</span><span className="md:hidden">HR</span>
                      </Button>
                      
                      <Button
                        onClick={() => openAssessmentDialog(selectedCandidate)}
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg flex-1 sm:flex-none"
                      >
                        🔬 <span className="hidden md:inline">Assign Assessment</span><span className="md:hidden">Tech</span>
                      </Button>
                      
                      {!selectedCandidate.shortlisted && selectedCandidate.status !== 'rejected' && (
                        <Button
                          onClick={() => shortlistCandidate(selectedCandidate._id, "Shortlisted from candidate review")}
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg flex-1 sm:flex-none"
                        >
                          ⭐ <span className="hidden md:inline">Shortlist</span>
                        </Button>
                      )}
                      
                      {selectedCandidate.status !== 'rejected' && (
                        <Button
                          onClick={() => {
                            setCandidateToReject(selectedCandidate);
                            setRejectionReason("");
                            setRejectDialogOpen(true);
                          }}
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg flex-1 sm:flex-none"
                        >
                          ❌ <span className="hidden md:inline">Reject</span>
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          setSelectedNewStage("");
                          setStageUpdateReason("");
                          setStageUpdateModal(true);
                        }}
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg flex-1 sm:flex-none"
                      >
                        🔄 <span className="hidden md:inline">Update Stage</span>
                      </Button>
                      
                      <Button 
                        onClick={() => handleAssignInterview(selectedCandidate)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule Interview
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCandidateForFeedback(selectedCandidate);
                          setFeedbackContent("");
                          setFeedbackType("general");
                          setFeedbackDialogOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Feedback
                      </Button>

                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Profile Info */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-2 p-4 sm:p-6 rounded-xl w-full lg:w-auto">
                      <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                        <AvatarImage src={selectedCandidate.profile_photo_url?.url} />
                        <AvatarFallback className="text-lg font-semibold">
                          {selectedCandidate.first_name?.[0]}{selectedCandidate.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedCandidate.first_name} {selectedCandidate.last_name}
                        </h3>
                        <div className="flex justify-center sm:justify-start">
                          <Badge className={getStageColor(selectedCandidate.current_stage)} variant="outline">
                            {selectedCandidate.current_stage?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="break-all">📧 {selectedCandidate.email}</span>
                          <span>📱 {selectedCandidate.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Applied Position */}
                    <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                        Applied Position
                      </h4>
                      <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {selectedCandidate.applied_job?.name}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {selectedCandidate.applied_job?.description?.location && (
                          <div>📍 {selectedCandidate.applied_job.description.location}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.country && (
                          <div>🌍 {selectedCandidate.applied_job.description.country}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.time && (
                          <div>⏰ {selectedCandidate.applied_job.description.time}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.expInYears && (
                          <div>💼 {selectedCandidate.applied_job.description.expInYears}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.salary && (
                          <div className="sm:col-span-2">💰 {selectedCandidate.applied_job.description.salary}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* HR Responses */}
                  {selectedCandidate.default_hr_responses && selectedCandidate.default_hr_responses.length > 0 && (
                    <div className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                          📝 Registration HR Responses
                        </h4>
                        <Badge variant="secondary">
                          {selectedCandidate.default_hr_responses.length} answered
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {selectedCandidate.default_hr_responses.map((response, index) => (
                          <div key={response._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {response.input_type.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Q{index + 1}
                              </span>
                            </div>
                            
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">
                              {response.question_text}
                            </h5>

                            <div className="text-sm">
                              {response.input_type === 'audio' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">🎵 Audio Response:</span>
                                  <audio controls className="h-8 w-full sm:w-auto">
                                    <source src={typeof response.response === 'string' ? response.response : ''} type="audio/mpeg" />
                                  </audio>
                                </div>
                              ) : response.input_type === 'date' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">📅</span>
                                  <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs sm:text-sm">
                                    {new Date(response.response as string).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : Array.isArray(response.response) ? (
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400 block mb-1 text-xs sm:text-sm">Selected:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {response.response.map((option, optionIndex) => (
                                      <Badge key={optionIndex} variant="secondary" className="text-xs">
                                        {option}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded border text-xs sm:text-sm">
                                  {response.response}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal Details Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">GENDER</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {selectedCandidate.gender || 'Not specified'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">DATE OF BIRTH</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(selectedCandidate.date_of_birth)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">REGISTRATION</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(selectedCandidate.registration_date)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">SHORTLISTED</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {selectedCandidate.shortlisted ? '✅ Yes' : '❌ No'}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  {selectedCandidate.address && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide">
                        Address
                      </p>
                      <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">
                        {selectedCandidate.address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Stage</div>
                      <Badge className={getStageColor(selectedCandidate.current_stage)}>
                        {selectedCandidate.current_stage?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge className={getStatusColor(selectedCandidate.status)}>
                        {selectedCandidate.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email Verified</div>
                      <Badge className={selectedCandidate.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedCandidate.email_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Registration Date</div>
                      <div className="text-sm">{formatDate(selectedCandidate.registration_date)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              {selectedCandidate.documents && selectedCandidate.documents?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedCandidate.documents.map((doc) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.document_url);
                        const isPDF = /\.pdf$/i.test(doc.document_url);

                        const pdfThumbUrl = isPDF
                          ? doc.document_url
                              .replace("/upload/", "/upload/pg_1/")
                              .replace(/\.pdf$/i, ".jpg")
                          : null;

                        return (
                          <div
                            key={doc._id}
                            className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer bg-white dark:bg-gray-800"
                            onClick={() => window.open(doc.document_url, "_blank")}
                          >
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                                onClick={(e) => copyToClipboard(doc.document_url, doc._id, e)}
                                title="Copy document link"
                              >
                                {copiedDocId === doc._id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </Button>
                            </div>

                            <div className="h-52 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                              {isImage ? (
                                <img
                                  src={doc.document_url}
                                  alt={doc.document_type}
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                                />
                              ) : isPDF ? (
                                <img
                                  src={pdfThumbUrl!}
                                  alt={`${doc.document_type} preview`}
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/300x200?text=PDF+Preview+Not+Available";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                  <FileText className="w-10 h-10 mb-2" />
                                  <span className="text-xs">Document</span>
                                </div>
                              )}
                            </div>

                            <div className="p-3">
                              <p className="text-sm font-medium truncate capitalize">{doc.document_type}</p>
                              <p className="text-xs text-gray-500 truncate">{doc.document_url}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* HR Questionnaire Status */}
              {selectedCandidate.hrQuestionnaire && selectedCandidate.hrQuestionnaire.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>HR Questionnaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCandidate.hrQuestionnaire.map((questionnaire) => (
                        <div key={questionnaire._id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">Questionnaire</span>
                            <Badge className={
                              questionnaire.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              questionnaire.status === 'submitted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {questionnaire.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Assigned by:</span>
                              <div className="font-medium">{questionnaire.assigned_by.name}</div>
                              <div className="text-xs text-gray-500">{questionnaire.assigned_by.role}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Due date:</span>
                              <div className="font-medium">{formatDate(questionnaire.due_at)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessments Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.assessments && selectedCandidate.assessments.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCandidate.assessments.map((assessment) => (
                        <div key={assessment._id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">Technical Assessment</span>
                            <Badge className={
                              assessment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              assessment.status === 'started' ? 'bg-blue-100 text-blue-800' :
                              assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {assessment.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Assigned by:</span>
                              <div className="font-medium">{assessment.assigned_by.name}</div>
                              <div className="text-xs text-gray-500">{assessment.assigned_by.role}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Due date:</span>
                              <div className="font-medium">{formatDate(assessment.due_at)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No technical assessments assigned yet</p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => openAssessmentDialog(selectedCandidate)}
                      >
                        Assign Technical Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interviews Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.interviews && selectedCandidate.interviews.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCandidate.interviews.map((interview) => (
                        <div key={interview._id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{interview.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {interview.type.toUpperCase()}
                                </Badge>
                                {interview.platform && (
                                  <Badge variant="secondary" className="text-xs">
                                    {interview.platform}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge className={
                              interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                              'bg-green-100 text-green-800'
                            }>
                              {interview.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {interview.description && (
                            <p className="text-sm text-gray-600 mb-3">{interview.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Interviewers:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {interview.interviewers.map((interviewer) => (
                                  <Badge key={interviewer._id} variant="outline" className="text-xs">
                                    {interviewer.name} ({interviewer.role})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Scheduled by:</span>
                              <div className="font-medium">{interview.scheduled_by.name}</div>
                              <div className="text-xs text-gray-500">{interview.scheduled_by.role}</div>
                            </div>
                          </div>
                          
                          {interview.meeting_link && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="text-gray-600 text-sm">Meeting Link:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(interview.meeting_link, '_blank')}
                                  className="text-xs"
                                >
                                  Join Meeting
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No interviews scheduled yet</p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => handleAssignInterview(selectedCandidate)}
                      >
                        Schedule Interview
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Internal Feedback Section - Enhanced with Stage Information */}
              {selectedCandidate.internal_feedback && selectedCandidate.internal_feedback.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      💬 Internal Feedback
                      <Badge variant="secondary" className="text-xs">
                        {selectedCandidate.internal_feedback.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCandidate.internal_feedback.map((feedback) => (
                        <div
                          key={feedback._id}
                          className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                                  {feedback.feedback_by.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  {feedback.feedback_by.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                    {feedback.feedback_by.role}
                                  </Badge>

                                </div>
                              </div>
                            </div>
                              <div className="text-right">
                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                  💬 Feedback
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs text-gray-500">At</span>
                                  <Badge className={`text-xs ${getStageColor(feedback.feedback_at)}`}>
                                    {feedback.feedback_at && feedback.feedback_at.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-gray-500">stage</span>
                                </div>
                              </div>

                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                              "{feedback.feedback}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}              

              {/* Stage History */}
              {selectedCandidate.stage_history && selectedCandidate.stage_history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Stage History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCandidate.stage_history.map((stage: StageHistory) => (
                        <div
                          key={stage._id}
                          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 hover:shadow transition"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-semibold capitalize">
                              {stage.from_stage ? `${stage.from_stage} → ${stage.to_stage}` : stage.to_stage}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(stage.changed_at)}
                            </span>
                          </div>

                          {stage.changed_by && (
                            <p className="text-xs text-gray-600">
                              Changed by:{" "}
                              <span className="font-medium">{stage.changed_by.name}</span>{" "}
                              ({stage.changed_by.email})
                            </p>
                          )}

                          {stage.remarks && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              "{stage.remarks}"
                            </p>
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

      {/* HR Questionnaire Assignment Dialog */}
      <Dialog open={assignHRQuestionnaireOpen} onOpenChange={setAssignHRQuestionnaireOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Assign HR Questionnaire</DialogTitle>
            <DialogDescription>
              Assign HR questionnaire to {targetCandidateForHR?.first_name} {targetCandidateForHR?.last_name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Show Selected Candidate */}
              {targetCandidateForHR && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Assigning HR questionnaire to:</Label>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={targetCandidateForHR.profile_photo_url?.url} />
                      <AvatarFallback>
                        {targetCandidateForHR.first_name[0]}{targetCandidateForHR.last_name}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {targetCandidateForHR.first_name} {targetCandidateForHR.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {targetCandidateForHR.email}
                      </div>
                      <Badge className={getStageColor(targetCandidateForHR.current_stage)} variant="outline">
                        {targetCandidateForHR.current_stage?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={hrQuestionnaireForm.handleSubmit(onHRQuestionnaireSubmit)} className="space-y-6">
                {/* Questions Selection */}
                <div className="space-y-3">
                  <Label>Select HR Questions</Label>
                  
                  {/* Tag Selection */}
                  {getUniqueHRTags().length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Quick Select by Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueHRTags().map((tag) => (
                          <Controller
                            key={tag}
                            name="assigned_questions"
                            control={hrQuestionnaireForm.control}
                            render={({ field }) => {
                              const isTagSelected = selectedHRTags.has(tag);
                              return (
                                <Button
                                  type="button"
                                  variant={isTagSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleHRTagSelection(tag, field)}
                                  className="text-xs"
                                >
                                  {isTagSelected && "✓ "}{tag}
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    {hrQuestions.filter(q => q.tags?.includes(tag)).length}
                                  </Badge>
                                </Button>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Questions */}
                  <Controller
                    name="assigned_questions"
                    control={hrQuestionnaireForm.control}
                    render={({ field }) => (
                      <div className="border rounded-lg">
                        <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                          <span className="text-sm font-medium">Select HR Questions:</span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                field.onChange(hrQuestions.map(q => q._id));
                                setSelectedHRTags(new Set(getUniqueHRTags()));
                              }}
                              className="text-xs"
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                field.onChange([]);
                                setSelectedHRTags(new Set());
                              }}
                              className="text-xs"
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                          <div className="p-4 space-y-3">
                            {hrQuestions.map((question) => {
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
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{question.question}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {question.input_type.toUpperCase()}
                                      </Badge>
                                      {question.tags?.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-3 border-t bg-gray-50 text-xs text-muted-foreground">
                          Selected: {field.value?.length || 0} of {hrQuestions.length} questions
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* Days to Complete */}
                <div className="space-y-2">
                  <Label htmlFor="hr_days_to_complete">Days to Complete</Label>
                  <Input
                    type="number"
                    {...hrQuestionnaireForm.register('days_to_complete', { valueAsNumber: true })}
                    min={1}
                    max={30}
                    className="w-32"
                    defaultValue={7}
                  />
                </div>
              </form>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeHRQuestionnaireDialog}>
              Cancel
            </Button>
            <Button 
              onClick={hrQuestionnaireForm.handleSubmit(onHRQuestionnaireSubmit)}
              disabled={submittingHR}
            >
              {submittingHR && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Assign HR Questionnaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog - FIXED with uniform 4-field layout and reactive total marks */}
      <Dialog open={assignAssessmentOpen} onOpenChange={setAssignAssessmentOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Assign Assessment</DialogTitle>
            <DialogDescription>
              {targetCandidateForAssessment ? (
                <>Assign assessment to {targetCandidateForAssessment.first_name} {targetCandidateForAssessment.last_name}</>
              ) : (
                'Select candidates and assign questions to create assessments'
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              <form onSubmit={assessmentForm.handleSubmit(onAssessmentSubmit)} className="space-y-6">
                {/* Pre-selected Candidate Display */}
                {targetCandidateForAssessment && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-sm font-medium mb-2 block text-blue-800">Assigning assessment to:</Label>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={targetCandidateForAssessment.profile_photo_url?.url} />
                        <AvatarFallback>
                          {targetCandidateForAssessment.first_name[0]}{targetCandidateForAssessment.last_name}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-blue-900">
                          {targetCandidateForAssessment.first_name} {targetCandidateForAssessment.last_name}
                        </div>
                        <div className="text-sm text-blue-700">
                          {targetCandidateForAssessment.email}
                        </div>
                        <Badge className={getStageColor(targetCandidateForAssessment.current_stage)} variant="outline">
                          {targetCandidateForAssessment.current_stage?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/*Questions Selection - FILTERED for specific types only */}
                <div className="space-y-3">
                  <Label>
                    Select Questions 
                    <span className="text-sm text-muted-foreground ml-2">
                      (Showing only: MCQ, Coding, Essay types)
                    </span>
                  </Label>
                  
                  {/* Tag Selection */}
                  {getUniqueTechnicalTags().length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Quick Select by Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueTechnicalTags().map((tag) => (
                          <Controller
                            key={tag}
                            name="assessments.0.questions"
                            control={assessmentForm.control}
                            render={({ field }) => {
                              const isTagSelected = selectedAssessmentTags.has(tag);
                              return (
                                <Button
                                  type="button"
                                  variant={isTagSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleAssessmentTagSelection(tag, field)}
                                  className="text-xs"
                                >
                                  {isTagSelected && "✓ "}{tag}
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    {getFilteredTechnicalQuestions().filter(q => q.tags?.includes(tag)).length}
                                  </Badge>
                                </Button>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Questions - FILTERED for allowed types */}
                  <Controller
                    name="assessments.0.questions"
                    control={assessmentForm.control}
                    render={({ field }) => {
                      const filteredQuestions = getFilteredTechnicalQuestions();
                      
                      return (
                        <div className="border rounded-lg">
                          <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                            <span className="text-sm font-medium">
                              Select Questions (Filtered for allowed types):
                            </span>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange(filteredQuestions.map(q => q._id));
                                  setSelectedAssessmentTags(new Set(getUniqueTechnicalTags()));
                                }}
                                className="text-xs"
                              >
                                Select All
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange([]);
                                  setSelectedAssessmentTags(new Set());
                                }}
                                className="text-xs"
                              >
                                Clear All
                              </Button>
                            </div>
                          </div>

                          <div className="max-h-64 overflow-y-auto">
                            <div className="p-4 space-y-3">
                              {filteredQuestions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
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
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{question.text}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs ${getQuestionTypeColor(question.type)}`}
                                          >
                                            {getQuestionTypeDisplay(question.type)}
                                          </Badge>

                                          {question.max_score && (
                                            <Badge variant="secondary" className="text-xs">
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

                          <div className="p-3 border-t bg-gray-50 text-xs text-muted-foreground">
                            Selected: {field.value?.length || 0} of {filteredQuestions.length} questions
                            <span className="ml-2 text-blue-600">
                              (Filtered: MCQ, Coding, Essay only)
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>

                {/* FIXED: Assessment Configuration with Uniform 4-Field Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* SEB Field */}
                  <div className="space-y-2">
                    <Label htmlFor="is_seb">Safe Exam Browser (SEB)</Label>
                    <Controller
                      name="assessments.0.is_seb"
                      control={assessmentForm.control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
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
                    <p className="text-xs text-muted-foreground">
                      Secure browser requirement
                    </p>
                  </div>

                  {/* Exam Duration Field */}
                  <div className="space-y-2">
                    <Label htmlFor="exam_duration">Exam Duration (Required)</Label>
                    <Input
                      type="number"
                      {...assessmentForm.register('assessments.0.exam_duration', { valueAsNumber: true })}
                      min={1}
                      max={600}
                      placeholder="60"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      {assessmentForm.watch('assessments.0.exam_duration') ? 
                        `${Math.floor((assessmentForm.watch('assessments.0.exam_duration') || 60) / 60)}h ${(assessmentForm.watch('assessments.0.exam_duration') || 60) % 60}m` 
                        : 'Time in minutes'
                      }
                    </p>
                    {assessmentForm.formState.errors.assessments?.[0]?.exam_duration && (
                      <p className="text-red-600 text-sm">{assessmentForm.formState.errors.assessments[0].exam_duration.message}</p>
                    )}
                  </div>

                  {/* Total Marks Field - FIXED with Uniform Styling */}
                  <div className="space-y-2">
                    <Label htmlFor="total_marks">Total Marks</Label>
                    <Input
                      id="total_marks"
                      type="number"
                      value={totalMarks}
                      readOnly
                      className="w-full bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sum of selected questions
                    </p>
                  </div>

                  {/* Days to Complete Field */}
                  <div className="space-y-2">
                    <Label htmlFor="days_to_complete">Days to Complete</Label>
                    <Input
                      type="number"
                      {...assessmentForm.register('assessments.0.days_to_complete', { valueAsNumber: true })}
                      min={1}
                      max={30}
                      className="w-full"
                      defaultValue={7}
                    />
                    <p className="text-xs text-muted-foreground">
                      {assessmentForm.watch('assessments.0.days_to_complete') ? 
                        `Due: ${new Date(Date.now() + ((assessmentForm.watch('assessments.0.days_to_complete') || 7) * 24 * 60 * 60 * 1000))
                          .toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric'
                          })}` 
                        : 'Deadline calculation'
                      }
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeAssessmentDialog}>
              Cancel
            </Button>
            <Button 
              onClick={assessmentForm.handleSubmit(onAssessmentSubmit)}
              disabled={submittingAssessment}
            >
              {submittingAssessment && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Assign Assessment
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
              This action cannot be undone. Please provide a reason for rejecting this candidate.
            </DialogDescription>
          </DialogHeader>

          {candidateToReject && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={candidateToReject.profile_photo_url?.url} />
                    <AvatarFallback>
                      {candidateToReject.first_name[0]}{candidateToReject.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {candidateToReject.first_name} {candidateToReject.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidateToReject.email}
                    </p>
                    <Badge className={getStageColor(candidateToReject.current_stage)} variant="outline">
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
                  This reason will be recorded in the candidate's history for future reference.
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
                  rejectCandidate(candidateToReject._id, rejectionReason.trim());
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
                <>
                  ❌ Confirm Rejection
                </>
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
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedCandidate.profile_photo_url?.url} />
                    <AvatarFallback>
                      {selectedCandidate.first_name[0]}{selectedCandidate.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedCandidate.first_name} {selectedCandidate.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidate.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Current:</span>
                      <Badge className={getStageColor(selectedCandidate.current_stage)} variant="outline">
                        {selectedCandidate.current_stage?.toUpperCase()}
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
                  <option value="registered" disabled={selectedCandidate.current_stage === 'registered'}>
                    📝 Registered
                  </option>
                  <option value="hr" disabled={selectedCandidate.current_stage === 'hr'}>
                    👥 HR Review
                  </option>
                  <option value="assessment" disabled={selectedCandidate.current_stage === 'assessment'}>
                    📊 Assessment
                  </option>
                  <option value="tech" disabled={selectedCandidate.current_stage === 'tech'}>
                    💻 Technical Interview
                  </option>
                  <option value="manager" disabled={selectedCandidate.current_stage === 'manager'}>
                    👔 Manager Review
                  </option>
                  <option value="feedback" disabled={selectedCandidate.current_stage === 'feedback'}>
                    📋 Final Feedback
                  </option>
                </select>
              </div>

               <div className="space-y-2">
                  <Label htmlFor="stage-reason">
                    Reason for Stage Update
                  </Label>
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
                    This feedback will be attached to the candidate's profile and visible internally.
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
              }}
              disabled={isUpdatingStage}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedCandidate && selectedNewStage) {
                  updateCandidateStage(
                    selectedCandidate._id, 
                    selectedNewStage, 
                    stageFeedback,
                    stageUpdateReason.trim() || `Stage updated to ${selectedNewStage}`
                  );
                }
              }}
              disabled={isUpdatingStage || !selectedNewStage}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUpdatingStage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  🔄 Update Stage
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={(open) => {
        if (!open && !submittingFeedback) {
          setFeedbackDialogOpen(false);
          setCandidateForFeedback(null);
          setFeedbackContent("");
          setFeedbackType("general");
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              💬 Add Feedback
            </DialogTitle>
            <DialogDescription>
              Provide feedback for this candidate's performance and evaluation.
            </DialogDescription>
          </DialogHeader>
          
          {candidateForFeedback && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={candidateForFeedback.profile_photo_url?.url} />
                    <AvatarFallback>
                      {candidateForFeedback.first_name?.[0]}{candidateForFeedback.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {candidateForFeedback.first_name} {candidateForFeedback.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidateForFeedback.email}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Feedback Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="feedback-type">Feedback Type</Label>
                <Select
                  value={feedbackType}
                  onValueChange={setFeedbackType}
                  disabled={submittingFeedback}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="manager_review">Manager Review</SelectItem>
                    <SelectItem value="interview_feedback">Interview Feedback</SelectItem>
                    <SelectItem value="technical_review">Technical Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Feedback Content */}
              <div className="space-y-2">
                <Label htmlFor="feedback-content">Feedback Content</Label>
                <Textarea
                  id="feedback-content"
                  placeholder="Enter your detailed feedback about the candidate..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  disabled={submittingFeedback}
                  rows={6}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackDialogOpen(false);
                setCandidateForFeedback(null);
                setFeedbackContent("");
                setFeedbackType("general");
              }}
              disabled={submittingFeedback}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={submitFeedback}
              disabled={submittingFeedback || !feedbackContent.trim()}
            >
              {submittingFeedback ? (
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

export default HRHome;
