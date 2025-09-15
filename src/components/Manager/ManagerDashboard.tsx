import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Clock,
  Video,
  TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

// Import the child components
import ManagerStage from "./ManagerStage";
import ManagerAllCandidates from "./ManagerAllCandidates";

interface CandidateDocument {
  _id: string;
  document_type: string;
  document_url: string;
  isVerified: boolean;
  uploaded_at?: string; // Optional for consistency with other components
}
interface InterviewType {
  _id: string;
  title?: string;
  status: string;
  scheduled_at?: string;
  type?: string;
  platform?: string;
  meeting_link?: string;
  canJoinMeeting?: boolean;
  interviewers?: Array<{
    _id: string;
    name: string;
  }>;
  remarks?: Array<{
    provider: {
      name: string;
    };
    remark: string;
    created_at: string;
  }>;
}


interface ManagerCandidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  current_stage: string;
  status: string;
  glory?: { [role: string]: {
    graderId?: string;
    graderName?: string;
    graderRole: 'hr' | 'manager' | 'invigilator' | 'admin';
    grades: { [parameter: string]: string };
    gradedAt: string;
  }};
  applied_job?: {
    _id: string;
    name: string;
    description?: {
      time?: string;
      country?: string;
      location?: string;
      expInYears?: string;
      salary?: string;
      jobId?: string;
    };
    gradingParameters: string[];
  };
  profile_photo_url?: {
    url: string;
    publicId: string;
    _id: string;
  };
  portfolio_url?: string | null;
  documents?: CandidateDocument[];
  hired_docs?: CandidateDocument[];
  assessments?: Array<{
    _id: string;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
    status: string;
  }>;
  hrQuestionnaire?: string[];
  interviews?: InterviewType[];
  default_hr_responses?: Array<{
    question_text: string;
    response: string;
    input_type: string;
    _id: string;
  }>;
  stage_history?: string[];
  internal_feedback?: Array<{
    feedback_by: {
      _id: string;
      name: string;
      role: string;
    };
    feedback: string;
    _id: string;
    feedback_at: string;
  }>;
  shortlisted: boolean;
  email_verified: boolean;
  flagged_for_deletion: boolean;
  assigned_manager: boolean;
  registration_date: string;
  createdAt: string;
  updatedAt: string;
  last_login?: string;
  __v: number;
  progress_metrics?: {
    stages_completed: number;
    total_assessments: number;
    completed_interviews: number;
    pending_interviews: number;
    documents_uploaded: number;
    feedback_count: number;
    hr_questionnaire_completed: boolean;
    current_stage_duration: number;
  };
}

interface DetailedCandidate {
  _id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  current_stage: string;
  status: string;
  applied_job?: {
    _id: string;
    name: string;
    description?: {
      time?: string;
      country?: string;
      location?: string;
      expInYears?: string;
      salary?: string;
      jobId?: string;
    };
    gradingParameters: string[];
  };
  
  profile_photo_url?: {
    url: string;
    publicId: string;
    _id: string;
  };
  portfolio_url?: string | null;
  documents: CandidateDocument[];
  hired_docs: CandidateDocument[];
  hrQuestionnaire: Array<{
    _id: string;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
    status: string;
  }>;
  stage_history: Array<{
    _id: string;
    from_stage?: string;
    to_stage: string;
    changed_by?: string;
    action: string;
    remarks: string;
    changed_at: string;
  }>;
  interviews: Array<{
    _id: string;
    title?: string;
    status: string;
    scheduled_at?: string;
    type?: string;
    platform?: string;
    meeting_link?: string;
    canJoinMeeting?: boolean;
    interviewers?: Array<{
      _id: string;
      name: string;
    }>;
    remarks?: Array<{
      provider: {
        name: string;
      };
      remark: string;
      created_at: string;
    }>;
  }>;
  assessments?: Array<{
    _id: string;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
    status: string;
  }>;
  default_hr_responses?: Array<{
    question_text: string;
    response: string;
    input_type: string;
    _id: string;
  }>;
  internal_feedback?: Array<{
    feedback_by: {
      _id: string;
      name: string;
      role: string;
    };
    feedback: string;
    _id: string;
    feedback_at: string;
  }>;
  shortlisted: boolean;
  email_verified: boolean;
  flagged_for_deletion: boolean;
  assigned_manager: boolean;
  registration_date: string;
  createdAt: string;
  updatedAt: string;
  last_login?: string;
  __v: number;
  progress_metrics?: {
    stages_completed: number;
    total_assessments: number;
    completed_interviews: number;
    pending_interviews: number;
    documents_uploaded: number;
    feedback_count: number;
    hr_questionnaire_completed: boolean;
    current_stage_duration: number;
  };
}

interface ManagerStats {
  total_candidates: number;
  active_candidates: number;
  interviewed_candidates: number;
  pending_feedback_candidates: number;
}

interface ActionModalState {
  open: boolean;
  candidate: ManagerCandidate | null;
  type: string;
  loading: boolean;
}

const ManagerDashboard: React.FC = () => {
  // State
  const [candidates, setCandidates] = useState<ManagerCandidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<ManagerCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("manager-stage");
  
  // New states for detailed candidate data
  const [detailedCandidates, setDetailedCandidates] = useState<Record<string, DetailedCandidate>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  
  // Filter states for tracking view
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [gloryFilter, setGloryFilter] = useState<string>("all");
  
  const [stats, setStats] = useState<ManagerStats>({
    total_candidates: 0,
    active_candidates: 0,
    interviewed_candidates: 0,
    pending_feedback_candidates: 0,
  });

  // Action Modal State
  const [actionModal, setActionModal] = useState<ActionModalState>({
    open: false,
    candidate: null,
    type: "",
    loading: false,
  });

  const [actionData, setActionData] = useState({
    feedback: "",
    stage: "",
  });

  // Get user info
  const user = useSelector((state: RootState) => state.orgAuth.user);
  const isAdmin = user?.role === "ADMIN";

  // Calculate progress metrics for each candidate
  const calculateProgressMetrics = (candidate: ManagerCandidate) => {
    const stageOrder = ["registered", "hr", "assessment", "tech", "manager", "feedback"];
    const currentStageIndex = stageOrder.indexOf(candidate.current_stage);
    
    const registrationDate = new Date(candidate.registration_date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 3600 * 24));
    
    return {
      stages_completed: Math.max(0, currentStageIndex),
      total_assessments: candidate.assessments?.length || 0,
      completed_interviews: candidate.interviews?.filter(i => i.status === 'completed').length || 0,
      pending_interviews: candidate.interviews?.filter(i => i.status === 'scheduled').length || 0,
      documents_uploaded: Array.isArray(candidate.documents) ? candidate.documents.length : 0,
      feedback_count: candidate.internal_feedback?.length || 0,
      hr_questionnaire_completed: Array.isArray(candidate.hrQuestionnaire) ? candidate.hrQuestionnaire.length > 0 : false,
      current_stage_duration: daysDiff
    };
  };

  // Data fetching - Updated to use common endpoint with client-side filtering
const fetchData = useCallback(async (): Promise<void> => {
  try {
    setLoading(true);
    const [candidatesRes, statsRes] = await Promise.all([
      api.get<{ success: boolean; data: ManagerCandidate[] }>("/org/candidates"),
      api.get<{ success: boolean; data: { statistics: ManagerStats } }>("/org/dashboard/stats"),
    ]);

    const allCandidatesData = candidatesRes.data.data || [];
    
    // ✅ Force completely new object references with timestamp
    const candidatesWithMetrics = allCandidatesData.map((candidate) => ({
      ...candidate,
      documents: normalizeDocuments(candidate.documents),
      hired_docs: normalizeDocuments(candidate.hired_docs),
      progress_metrics: calculateProgressMetrics(candidate),
      // ✅ Force new reference with timestamp
      _renderKey: `${candidate._id}-${Date.now()}`,
      // ✅ Deep clone glory to ensure new reference
      glory: candidate.glory ? JSON.parse(JSON.stringify(candidate.glory)) : undefined
    }));

    const managerStageCandidates = candidatesWithMetrics.filter(
      candidate => candidate.current_stage === "manager"
    );
    
    // ✅ Force completely new array references
    setCandidates([...managerStageCandidates]);
    setAllCandidates([...candidatesWithMetrics]);
    
    // ✅ Clear detailed candidates to force fresh data
    setDetailedCandidates({});
    
    if (statsRes.data.success) {
      setStats(statsRes.data.data.statistics);
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    toast.error("Failed to load dashboard");
  } finally {
    setLoading(false);
  }
}, []);


  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch detailed candidate information
  const fetchCandidateDetails = async (candidateId: string): Promise<void> => {
    if (detailedCandidates[candidateId] || loadingDetails.has(candidateId)) {
      return; // Already loaded or loading
    }

    try {
      setLoadingDetails(prev => new Set([...prev, candidateId]));
      
      const response = await api.get<{ success: boolean; data: DetailedCandidate }>(`/org/candidates/${candidateId}`);
      
      if (response.data.success) {
        // Create a compatible ManagerCandidate object for calculateProgressMetrics
  const managerCandidateForMetrics: ManagerCandidate = {
    ...response.data.data,
    documents: normalizeDocuments(response.data.data.documents),   // ✅ normalize
    hired_docs: normalizeDocuments(response.data.data.hired_docs), // ✅ normalize
    hrQuestionnaire: response.data.data.hrQuestionnaire?.map((q) => q._id) || [],
    stage_history: response.data.data.stage_history?.map((s) => s._id) || [],
    interviews: response.data.data.interviews || [],
  };
  setDetailedCandidates((prev) => ({
    ...prev,
    [candidateId]: {
      ...response.data.data,
      documents: normalizeDocuments(response.data.data.documents),   // ✅ normalize
      hired_docs: normalizeDocuments(response.data.data.hired_docs), // ✅ normalize
      progress_metrics: calculateProgressMetrics(managerCandidateForMetrics),
    },
  }));
      }
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
      toast.error("Failed to load candidate details");
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  };

  const closeActionModal = (): void => {
    setActionModal({ open: false, candidate: null, type: "", loading: false });
    setActionData({ feedback: "", stage: "" });
  };

  // Copy meeting link to clipboard
  const copyMeetingLink = async (link: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Meeting link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };
  // Normalize docs to always include isVerified
  const normalizeDocuments = (
    docs: any[] = []
  ): Array<{ _id: string; document_type: string; document_url: string; isVerified: boolean }> => {
    return docs.map((doc) => ({
      ...doc,
      isVerified: doc.isVerified !== undefined ? doc.isVerified : false,
    }));
  };


  // Action handler
  const handleQuickAction = async (): Promise<void> => {
    if (!actionModal.candidate || !actionModal.type) return;

    try {
      setActionModal((prev) => ({ ...prev, loading: true }));

      const { candidate, type } = actionModal;
      let endpoint = "";
      let payload: Record<string, unknown> = {};
      let method: "post" | "patch" = "post";

      switch (type) {
        case "feedback":
          endpoint = `/org/candidates/${candidate._id}/feedback`;
          payload = {
            content: actionData.feedback,
            feedback_type: "manager_review",
            stage: "manager",
          };
          method = "post";
          break;

        case "hold":
          endpoint = `/org/candidates/${candidate._id}/stage`;
          payload = {
            newStage: "feedback",
            remarks: actionData.feedback || "Hold for hiring",
            internal_feedback: {
              feedback: actionData.feedback || "Candidate put on hold"
            }
          };
          method = "patch";
          break;

        case "hire":
          endpoint = `/org/candidates/${candidate._id}/stage`;
          payload = {
            newStage: "feedback",
            remarks: actionData.feedback || "Approved by manager",
            internal_feedback: {
              feedback: actionData.feedback || "Candidate approved for hiring"
            }
          };
          method = "patch";
          break;

        case "reject":
          endpoint = `/org/candidates/${candidate._id}/reject`;
          payload = {
            rejection_reason: actionData.feedback || "Rejected by manager",
          };
          method = "patch";
          break;

        case "stage":
          endpoint = `/org/candidates/${candidate._id}/stage`;
          payload = {
            newStage: actionData.stage,
            remarks: actionData.feedback || `Stage changed to ${actionData.stage}`,
            internal_feedback: {
              feedback: actionData.feedback || `Stage updated to ${actionData.stage}`
            }
          };
          method = "patch";
          break;
      }

      await api[method](endpoint, payload);
      toast.success(`${type} completed successfully`);
      closeActionModal();
      await fetchData();
      
      // Clear detailed data for this candidate to force refetch
      if (detailedCandidates[actionModal.candidate._id]) {
        setDetailedCandidates(prev => {
          const newDetails = { ...prev };
          delete newDetails[actionModal.candidate!._id];
          return newDetails;
        });
      }
    } catch (error: unknown) {
      console.error(`Failed to ${actionModal.type}:`, error);
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || `Failed to ${actionModal.type}`);
    } finally {
      setActionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Meeting handler
  const joinMeeting = async (interviewId: string): Promise<void> => {
    try {
      const response = await api.post<{
        success: boolean;
        data: { meeting_link: string };
      }>(`/org/interviews/${interviewId}/join`);
      if (response.data.success && response.data.data.meeting_link) {
        window.open(response.data.data.meeting_link, "_blank");
        toast.success("Joining meeting...");
      }
    } catch (error: unknown) {
      console.error("Failed to join meeting:", error);
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Failed to join meeting");
    }
  };

  // Updated toggle function to fetch details when expanding
  const toggleCardExpansion = async (candidateId: string): Promise<void> => {
    const newExpanded = new Set(expandedCards);
    
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
      // Fetch detailed data when expanding
      await fetchCandidateDetails(candidateId);
    }
    
    setExpandedCards(newExpanded);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      hired: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-gray-100 text-gray-800",
      hold: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStageColor = (stage: string): string => {
    const colors: Record<string, string> = {
      registered: "bg-blue-100 text-blue-800",
      hr: "bg-purple-100 text-purple-800",
      assessment: "bg-orange-100 text-orange-800",
      tech: "bg-indigo-100 text-indigo-800",
      manager: "bg-green-100 text-green-800",
      feedback: "bg-teal-100 text-teal-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAge = (dateString: string): number => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div>
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Admin view - Manage candidates and track their progress across all stages"
            : "Review, manage, and track candidates throughout their journey"}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.total_candidates}</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.active_candidates}</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Interviewed</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{stats.interviewed_candidates}</div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Pending</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{stats.pending_feedback_candidates}</div>
          </div>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manager-stage">Manager Stage</TabsTrigger>
          <TabsTrigger value="tracking">All Candidates</TabsTrigger>
        </TabsList>

        <TabsContent value="manager-stage" className="space-y-4">
          <ManagerStage
            key={`manager-${candidates.length}-${Date.now()}`}
            candidates={candidates}
            detailedCandidates={detailedCandidates}
            loadingDetails={loadingDetails}
            expandedCards={expandedCards}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            toggleCardExpansion={toggleCardExpansion}
            joinMeeting={joinMeeting}
            copyMeetingLink={copyMeetingLink}
            getStatusColor={getStatusColor}
            getStageColor={getStageColor}
            formatDateTime={formatDateTime}
            formatDate={formatDate}
            formatAge={formatAge}
            fetchCandidates={fetchData} 
          />
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <ManagerAllCandidates
            key={`all-${allCandidates.length}-${Date.now()}`}
            allCandidates={allCandidates}
            detailedCandidates={detailedCandidates}
            loadingDetails={loadingDetails}
            expandedCards={expandedCards}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            stageFilter={stageFilter}
            setStageFilter={setStageFilter}
            gloryFilter={gloryFilter}
            setGloryFilter={setGloryFilter}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            toggleCardExpansion={toggleCardExpansion}
            getStatusColor={getStatusColor}
            getStageColor={getStageColor}
            formatDate={formatDate}
            formatAge={formatAge}
          />
        </TabsContent>
      </Tabs>

      {/* No Candidates Found */}
      {((activeTab === "manager-stage" && candidates.length === 0) || 
        (activeTab === "tracking" && allCandidates.length === 0)) && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No candidates found</p>
            <p className="text-sm text-muted-foreground">
              {activeTab === "manager-stage" 
                ? "No candidates in manager stage" 
                : "No candidates available"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Modal */}
      <Dialog open={actionModal.open} onOpenChange={() => !actionModal.loading && closeActionModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionModal.type === "feedback" && "Provide Feedback"}
              {actionModal.type === "hire" && "Approve Candidate"}
              {actionModal.type === "reject" && "Reject Candidate"}
              {actionModal.type === "hold" && "Hold Candidate"}
              {actionModal.type === "stage" && "Change Stage"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Candidate Info */}
            {actionModal.candidate && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src={actionModal.candidate.profile_photo_url?.url} />
                  <AvatarFallback>
                    {actionModal.candidate.first_name[0]}
                    {actionModal.candidate.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {actionModal.candidate.first_name} {actionModal.candidate.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {actionModal.candidate.applied_job?.name}
                  </div>
                </div>
              </div>
            )}

            {/* Stage Selection */}
            {actionModal.type === "stage" && (
              <div>
                <label className="text-sm font-medium">New Stage</label>
                <Select
                  value={actionData.stage}
                  onValueChange={(value) => setActionData((prev) => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">HR Review</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="feedback">Final Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Feedback/Remarks */}
            <div>
              <label className="text-sm font-medium">
                {actionModal.type === "feedback" && "Feedback *"}
                {actionModal.type === "hire" && "Hiring Notes"}
                {actionModal.type === "reject" && "Rejection Reason *"}
                {actionModal.type === "hold" && "Hold Reason"}
                {actionModal.type === "stage" && "Remarks"}
              </label>
              <Textarea
                value={actionData.feedback}
                onChange={(e) => setActionData((prev) => ({ ...prev, feedback: e.target.value }))}
                placeholder={
                  actionModal.type === "feedback"
                    ? "Your detailed feedback..."
                    : actionModal.type === "hire"
                    ? "Notes about hiring decision..."
                    : actionModal.type === "reject"
                    ? "Reason for rejection..."
                    : actionModal.type === "hold"
                    ? "Reason for holding..."
                    : "Reason for stage change..."
                }
                rows={4}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeActionModal} disabled={actionModal.loading}>
              Cancel
            </Button>
            <Button
              onClick={handleQuickAction}
              disabled={
                actionModal.loading ||
                (actionModal.type === "feedback" && !actionData.feedback.trim()) ||
                (actionModal.type === "reject" && !actionData.feedback.trim()) ||
                (actionModal.type === "stage" && !actionData.stage)
              }
              className={
                actionModal.type === "hire"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionModal.type === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : actionModal.type === "hold"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {actionModal.loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              )}
              {actionModal.type === "feedback" && "Submit Feedback"}
              {actionModal.type === "hire" && "Approve Candidate"}
              {actionModal.type === "reject" && "Reject Candidate"}
              {actionModal.type === "hold" && "Hold Candidate"}
              {actionModal.type === "stage" && "Update Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerDashboard;
