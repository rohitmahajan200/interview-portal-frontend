import React, {useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  UserIcon,
  CalendarDaysIcon,
  MapPinIcon,
  GlobeIcon,
  BriefcaseIcon,
  DollarSignIcon,
  Calendar,
  Video,
  ThumbsUp,
  ThumbsDown,
  CirclePause,
  Loader2,
  ShieldCheckIcon,
  FlagIcon,
  BarChart3,
  FileText,
  ClockIcon,
  ExternalLink,
  ArrowRight,
  Copy,
  Clock,
  MapPin,
  MessageSquare,
  ClipboardList,
  MessageCircle,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import GloryDisplay from "../GloryDisplay";
import GloryButton from "../GloryButton";
import { useGlory } from "@/hooks/useGlory";
import GloryDialog from "../GloryDialog";


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
  glory?: { [role: string]: GloryRoleData };
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
  };
  profile_photo_url?: {
    url: string;
    publicId: string;
    _id: string;
  };
  portfolio_url?: string | null;
  documents?: Array<{
    _id: string;
    document_type: string;
    document_url: string;
  }>;
  hired_docs?: Array<{
    _id: string;
    document_type: string;
    document_url: string;
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
  hrQuestionnaire?: string[];
  interviews?: any[];
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
  first_name: string;
  last_name: string;
  name:string;      
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  current_stage: string;
  status: string;
  glory?: { [role: string]: GloryRoleData };
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
  documents: Array<{
    _id: string;
    document_type: string;
    document_url: string;
  }>;
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
  hrQuestionnaireResponses?: Array<{
    _id: string;
    overallScore: number;
    summary: string;
  }>;

  assessmentResponses?: Array<{
    _id: string;
    total_score: number;
    ai_score: number;
    status: string;
    evaluated_by?: {
      _id: string;
      name: string;
      role: string;
    };
  }>;
}

interface ManagerStageProps {
  candidates: ManagerCandidate[];
  detailedCandidates: Record<string, DetailedCandidate>;
  loadingDetails: Set<string>;
  expandedCards: Set<string>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  toggleCardExpansion: (candidateId: string) => void;
  joinMeeting: (interviewId: string) => void;
  copyMeetingLink: (link: string) => void;
  getStatusColor: (status: string) => string;
  getStageColor: (stage: string) => string;
  formatDateTime: (dateString: string) => string;
  formatDate: (dateString: string) => string;
  formatAge: (dateString: string) => number;
  fetchCandidates: () => Promise<void>;
}

const ManagerStage: React.FC<ManagerStageProps> = ({
  candidates,
  detailedCandidates,
  loadingDetails,
  expandedCards,
  searchTerm,
  setSearchTerm,
  toggleCardExpansion,
  joinMeeting,
  copyMeetingLink,
  getStatusColor,
  getStageColor,
  formatDateTime,
  formatDate,
  formatAge,
  fetchCandidates,
}) => {

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
    } = useGlory('manager');

  // Dialog states for Reject
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] =
    useState<ManagerCandidate | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Dialog states for Feedback
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [candidateToGiveFeedback, setCandidateToGiveFeedback] =
    useState<ManagerCandidate | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Dialog states for Hire
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [candidateToHire, setCandidateToHire] =
    useState<ManagerCandidate | null>(null);
  const [hiringNote, setHiringNote] = useState("");
  const [isHiring, setIsHiring] = useState(false);

  // Dialog states for Hold
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [candidateToHold, setCandidateToHold] =
    useState<ManagerCandidate | null>(null);
  const [holdReason, setHoldReason] = useState("");
  const [isHolding, setIsHolding] = useState(false);

  // Dialog states for Stage Update (Fixed)
  const [stageUpdateModal, setStageUpdateModal] = useState(false);
  const [candidateToUpdateStage, setCandidateToUpdateStage] =
    useState<ManagerCandidate | null>(null);
  const [selectedNewStage, setSelectedNewStage] = useState("");
  const [stageUpdateReason, setStageUpdateReason] = useState("");
  const [stageFeedback, setStageFeedback] = useState("");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  useEffect(() => {
    if (!submittingGlory) {
      console.log('Glory submission completed, data should be updated');
      
    }
  }, [submittingGlory]);


  // Action handlers
  const updateCandidateStage = async (
    candidateId: string,
    newStage: string,
    internal_feedback: string,
    remarks?: string
  ) => {
    setIsUpdatingStage(true);
    try {
      if (!gloryGrades.Overall) {
      toast.error("Glory Required To Stage Update");
      return; // ✅ Use return instead of throw
    }
      const response = await api.patch(`/org/candidates/${candidateId}/stage`, {
        newStage,
        remarks,
        internal_feedback: { feedback: internal_feedback },
      });

      if (response.data.success) {
        toast.success(`Candidate stage updated to ${newStage.toUpperCase()}`);
        await fetchCandidates(); // Refresh candidates after successful update
        setStageUpdateModal(false);
        setCandidateToUpdateStage(null);
        setSelectedNewStage("");
        setStageUpdateReason("");
        setStageFeedback("");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update candidate stage"
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
        await fetchCandidates();
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

  const submitFeedback = async (
    candidateId: string,
    content: string,
    type: string
  ) => {
    setIsSubmittingFeedback(true);
    try {
      const response = await api.post(
        `/org/candidates/${candidateId}/feedback`,
        {
          content: content,
          feedback_type: type,
        }
      );
      if (response.data.success) {
        toast.success("Feedback added successfully");
        await fetchCandidates();
        setFeedbackDialogOpen(false);
        setCandidateToGiveFeedback(null);
        setFeedbackContent("");
        setFeedbackType("general");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const hireCandidate = async (candidateId: string, note: string) => {
    setIsHiring(true);
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/hire`, {
        hiring_note: note,
      });
      if (response.data.success) {
        toast.success("Candidate hired successfully");
        await fetchCandidates();
        setHireDialogOpen(false);
        setCandidateToHire(null);
        setHiringNote("");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to hire candidate");
    } finally {
      setIsHiring(false);
    }
  };

  const holdCandidate = async (candidateId: string, reason: string) => {
    setIsHolding(true);
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/hold`, {
        hold_reason: reason,
      });
      if (response.data.success) {
        toast.success("Candidate put on hold successfully");
        await fetchCandidates();
        setHoldDialogOpen(false);
        setCandidateToHold(null);
        setHoldReason("");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to hold candidate");
    } finally {
      setIsHolding(false);
    }
  };

  const filteredCandidates = candidates.filter((candidate) => {
    if (!searchTerm) return true;

    return (
      candidate.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.applied_job?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Search for Manager Stage */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search candidates by name, email, or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Manager Stage Candidates */}
<div className="space-y-3">
  {filteredCandidates.map((candidate) => {
    const isExpanded = expandedCards.has(candidate._id);
    const isLoadingDetail = loadingDetails.has(candidate._id);
    const detailedCandidate = detailedCandidates[candidate._id];

    // Use detailed data if available, otherwise use list data
    const candidateData = detailedCandidate || candidate;

    const upcomingInterview = candidateData.interviews?.find(
      (i) =>
        new Date(i.scheduled_at || "") > new Date() &&
        i.status === "scheduled"
    );
    const activeInterview = candidateData.interviews?.find(
      (i) => i.canJoinMeeting
    );

    // Add collapsible section state - you'll need to add this to your component state
    const [collapsedSections, setCollapsedSections] = useState(new Map());
    
    const toggleSection = (candidateId, sectionName) => {
      setCollapsedSections(prev => {
        const newMap = new Map(prev);
        const key = `${candidateId}-${sectionName}`;
        newMap.set(key, !newMap.get(key));
        return newMap;
      });
    };

    const isSectionCollapsed = (candidateId, sectionName) => {
      return collapsedSections.get(`${candidateId}-${sectionName}`) || false;
    };

    return (
      <Card
        key={candidate._id}
        className="overflow-hidden hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
      >
        <CardHeader className="pb-2 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Enhanced Candidate Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={candidate.profile_photo_url?.url} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {candidate.first_name[0]}
                    {candidate.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Compact Status indicators */}
                <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
                  {candidate.email_verified && (
                    <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <ShieldCheckIcon className="w-1.5 h-1.5 text-white" />
                    </div>
                  )}
                  {candidate.shortlisted && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                      <FlagIcon className="w-1.5 h-1.5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Name and Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold truncate text-gray-900">
                    {candidate.first_name} {candidate.last_name}
                  </h3>
                  <div className="flex gap-1.5">
                    <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </Badge>
                    <Badge className={`text-xs px-2 py-0.5 ${getStageColor(candidate.current_stage)}`}>
                      {candidate.current_stage?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Compact Contact Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-green-500 shrink-0" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-3 w-3 text-purple-500 shrink-0" />
                    <span>{candidate.gender} • {formatAge(candidate.date_of_birth)}y</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-3 w-3 text-orange-500 shrink-0" />
                    <span>Reg: {formatDate(candidate.registration_date)}</span>
                  </div>
                </div>

                {/* Job Info - Compact */}
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-blue-700 truncate">
                    {candidate.applied_job?.name}
                  </div>
                  {candidate.applied_job?.description && (
                    <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                      {candidate.applied_job.description.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          <span>{candidate.applied_job.description.location}</span>
                        </div>
                      )}
                      {candidate.applied_job.description.country && (
                        <div className="flex items-center gap-1">
                          <GlobeIcon className="h-3 w-3" />
                          <span>{candidate.applied_job.description.country}</span>
                        </div>
                      )}
                      {candidate.applied_job.description.expInYears && (
                        <div className="flex items-center gap-1">
                          <BriefcaseIcon className="h-3 w-3" />
                          <span>{candidate.applied_job.description.expInYears}</span>
                        </div>
                      )}
                      {candidate.applied_job.description.salary && (
                        <div className="flex items-center gap-1">
                          <DollarSignIcon className="h-3 w-3" />
                          <span>{candidate.applied_job.description.salary}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons - Compact Layout */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Active Meeting - Priority Button */}
              {activeInterview && (
                <Button
                  size="sm"
                  onClick={() => joinMeeting(activeInterview._id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 h-8"
                >
                  <Video className="h-3 w-3 mr-1" />
                  Join
                </Button>
              )}

              {/* Upcoming Interview Badge */}
              {upcomingInterview && !activeInterview && (
                <Badge variant="outline" className="text-xs px-2 py-1 text-blue-600 border-blue-300 whitespace-nowrap">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDateTime(upcomingInterview.scheduled_at || "")}
                </Badge>
              )}

              {/* Action Buttons Group - Horizontal on larger screens */}
              <div className="flex items-center gap-1">
                {candidate.status === "hold" || candidate.status !== "hired" && candidate.status !== "rejected" &&(
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCandidateToHire(candidate);
                      setHiringNote("");
                      setHireDialogOpen(true);
                    }}
                    className="text-green-600 hover:text-green-700 px-2 py-1.5 h-8 border-green-200"
                  >
                    <ThumbsUp className="h-3 w-3 lg:mr-1" />
                    <span className="hidden lg:inline">Hire</span>
                  </Button>
                )}

                {candidate.status === "hold" || candidate.status !== "rejected" && candidate.status !== "hired" &&(
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCandidateToReject(candidate);
                      setRejectionReason("");
                      setRejectDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 px-2 py-1.5 h-8 border-red-200"
                  >
                    <ThumbsDown className="h-3 w-3 lg:mr-1" />
                    <span className="hidden lg:inline">Reject</span>
                  </Button>
                )}

                {candidate.status!="hired" && candidate.status!="rejected" && candidate.status !== "hold" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCandidateToHold(candidate);
                      setHoldReason("");
                      setHoldDialogOpen(true);
                    }}
                    className="text-yellow-600 hover:text-yellow-700 px-2 py-1.5 h-8 border-yellow-200"
                  >
                    <CirclePause className="h-3 w-3 lg:mr-1" />
                    <span className="hidden lg:inline">Hold</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCandidateToGiveFeedback(candidate);
                    setFeedbackContent("");
                    setFeedbackType("general");
                    setFeedbackDialogOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 px-2 py-1.5 h-8 border-blue-200"
                >
                  <MessageSquare className="h-3 w-3 lg:mr-1" />
                  <span className="hidden lg:inline">Feedback</span>
                </Button>

{ candidate.status !== "rejected" && candidate.status !== "hired" &&
                <Button
                  onClick={() => {
                    setCandidateToUpdateStage(candidate);
                    setSelectedNewStage("");
                    setStageUpdateReason("");
                    setStageFeedback("");
                    setStageUpdateModal(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700 px-2 py-1.5 h-8 border-purple-200"
                >
                  🔄 <span className="hidden lg:inline ml-1">Stage</span>
                </Button>
  }
                <GloryButton
                  candidate={candidate}
                  onOpenGlory={openGloryDialog}
                  variant="outline"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700 px-2 py-1.5 h-8"
                />
  

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleCardExpansion(candidate._id)}
                  disabled={isLoadingDetail}
                  className="px-2 py-1.5 h-8 border-gray-300"
                >
                  {isLoadingDetail ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Compact Info Row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-blue-600">
                <BarChart3 className="h-3 w-3" />
                <span>{candidateData.assessments?.length || 0} Tests</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <FileText className="h-3 w-3" />
                <span>
                  {Array.isArray(candidateData.documents) ? candidateData.documents.length : 0} Docs
                </span>
              </div>
              {candidate.last_login && (
                <div className="flex items-center gap-1 text-orange-600">
                  <ClockIcon className="h-3 w-3" />
                  <span>Login: {formatDate(candidate.last_login)}</span>
                </div>
              )}
            </div>
            
            {/* Quick Status Indicators */}
            <div className="flex items-center gap-2">
              {candidate.email_verified && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 text-green-600 border-green-200">
                  Verified
                </Badge>
              )}
              {candidate.shortlisted && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 text-orange-600 border-orange-200">
                  Shortlisted
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Expanded Content with Collapsible Sections */}
        {isExpanded && (
          <CardContent className="pt-0 px-4 pb-4 border-t bg-gray-50/50">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-500" />
                <span className="text-sm text-gray-600">Loading candidate details...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Personal Details Section - Collapsible */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggleSection(candidate._id, 'personal')}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                      Personal Details
                    </h4>
                    {isSectionCollapsed(candidate._id, 'personal') ? (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {!isSectionCollapsed(candidate._id, 'personal') && (
                    <div className="px-3 pb-3">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Full Name</span>
                          <p className="text-gray-900">{candidateData.first_name} {candidateData.last_name}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Email</span>
                          <p className="text-gray-900 truncate">{candidateData.email}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Phone</span>
                          <p className="text-gray-900">{candidateData.phone || "Not provided"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Age</span>
                          <p className="text-gray-900">{formatAge(candidateData.date_of_birth)} years ({candidateData.gender})</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Address</span>
                          <p className="text-gray-900 truncate">{candidateData.address}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Registered</span>
                          <p className="text-gray-900">{formatDate(candidateData.registration_date)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Verification</span>
                          <Badge
                            variant={candidateData.email_verified ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {candidateData.email_verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-500 font-medium">Status</span>
                          <Badge
                            variant={candidateData.shortlisted ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {candidateData.shortlisted ? "Shortlisted" : "Regular"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Glory Section - Collapsible */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggleSection(candidate._id, 'glory')}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                      Glory           
                    </h4>
                    {isSectionCollapsed(candidate._id, 'glory') ? (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {!isSectionCollapsed(candidate._id, 'glory') && (
                    <div className="px-3 pb-3">
                      <GloryDisplay glory={candidateData.glory} />
                    </div>
                  )}
                </div>

                {/* HR Responses Section - Collapsible */}
                {candidateData.default_hr_responses && candidateData.default_hr_responses.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'hr-responses')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <ClockIcon className="h-4 w-4 text-purple-600" />
                        HR Responses ({candidateData.default_hr_responses.length})
                      </h4>
                      {isSectionCollapsed(candidate._id, 'hr-responses') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'hr-responses') && (
                      <div className="px-3 pb-3">
                        <div className="space-y-2">
                          {candidateData.default_hr_responses.map((response) => (
                            <div key={response._id} className="p-2 bg-purple-50 rounded border border-purple-100">
                              <div className="text-xs font-medium text-purple-800 mb-1">{response.question_text}</div>
                              <div className="text-xs text-gray-700">
                                <strong>Response:</strong> {response.response}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">{response.input_type}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents Section - Collapsible */}
                {detailedCandidate?.documents && detailedCandidate.documents.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'documents')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        Documents ({detailedCandidate.documents.length})
                      </h4>
                      {isSectionCollapsed(candidate._id, 'documents') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'documents') && (
                      <div className="px-3 pb-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          {detailedCandidate.documents.map((document) => (
                            <div key={document._id} className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="text-xs font-medium text-emerald-800 truncate">
                                  {document.document_type || "Document/Resume"}
                                </div>
                                <div className="text-xs text-gray-500 truncate">ID: {document._id}</div>
                              </div>
                              {document.document_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(document.document_url, "_blank")}
                                  className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* HR Questionnaire Responses - Collapsible */}
                {detailedCandidate?.hrQuestionnaireResponses && detailedCandidate.hrQuestionnaireResponses.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'hr-questionnaire')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <ClipboardList className="h-4 w-4 text-purple-600" />
                        HR Questionnaire ({detailedCandidate.hrQuestionnaireResponses.length})
                      </h4>
                      {isSectionCollapsed(candidate._id, 'hr-questionnaire') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'hr-questionnaire') && (
                      <div className="px-3 pb-3">
                        <div className="space-y-2">
                          {detailedCandidate.hrQuestionnaireResponses.map((response) => (
                            <div key={response._id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-purple-800 text-sm">HR Assessment</div>
                                <Badge
                                  variant={response.overallScore >= 8 ? "default" : response.overallScore >= 6 ? "secondary" : "destructive"}
                                  className="text-xs font-bold"
                                >
                                  {response.overallScore}/10
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      response.overallScore >= 8 ? "bg-green-500" : response.overallScore >= 6 ? "bg-yellow-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${(response.overallScore / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-purple-600 font-medium">{Math.round((response.overallScore / 10) * 100)}%</span>
                              </div>

                              {response.summary && (
                                <div className="text-xs text-gray-700 bg-white p-2 rounded border border-purple-100 italic">
                                  "{response.summary}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Assessments - Collapsible */}
                {detailedCandidate?.assessmentResponses && detailedCandidate.assessmentResponses.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'assessments')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                        Technical Assessments ({detailedCandidate.assessmentResponses.length})
                      </h4>
                      {isSectionCollapsed(candidate._id, 'assessments') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'assessments') && (
                      <div className="px-3 pb-3">
                        <div className="space-y-2">
                          {detailedCandidate.assessmentResponses.map((response) => (
                            <div key={response._id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-indigo-800 text-sm">Technical Test</div>
                                <div className="flex items-center gap-2">
                                  {response.total_score > 0 && (
                                    <Badge
                                      variant={
                                        response.ai_score / response.total_score >= 0.8 ? "default" :
                                        response.ai_score / response.total_score >= 0.6 ? "secondary" : "destructive"
                                      }
                                      className="text-xs font-bold"
                                    >
                                      {response.ai_score}/{response.total_score}
                                    </Badge>
                                  )}
                                  <Badge variant={response.status === "completed" ? "default" : "secondary"} className="text-xs">
                                    {response.status.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>

                              {response.total_score > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        response.ai_score / response.total_score >= 0.8 ? "bg-green-500" :
                                        response.ai_score / response.total_score >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                                      }`}
                                      style={{ width: `${(response.ai_score / response.total_score) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-indigo-600 font-medium">
                                    {Math.round((response.ai_score / response.total_score) * 100)}%
                                  </span>
                                </div>
                              )}

                              {response.evaluated_by && (
                                <div className="text-xs text-indigo-600 mt-1">
                                  Evaluated by: {response.evaluated_by.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Interviews Section - Collapsible */}
                {detailedCandidate?.interviews && detailedCandidate.interviews.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'interviews')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <Video className="h-4 w-4 text-blue-600" />
                        Interviews ({detailedCandidate.interviews.length})
                      </h4>
                      {isSectionCollapsed(candidate._id, 'interviews') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'interviews') && (
                      <div className="px-3 pb-3">
                        <div className="space-y-2">
                          {detailedCandidate.interviews.map((interview) => (
                            <div key={interview._id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-sm truncate">{interview.title || "Interview"}</h5>
                                    <Badge variant={interview.status === "scheduled" ? "default" : "secondary"} className="text-xs">
                                      {interview.status}
                                    </Badge>
                                  </div>

                                  {interview.scheduled_at && (
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(interview.scheduled_at)}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          {new Date(interview.scheduled_at).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {interview.type === "online" ? (
                                          <Video className="h-3 w-3 text-blue-600" />
                                        ) : (
                                          <MapPin className="h-3 w-3 text-green-600" />
                                        )}
                                        <span>{interview.type === "online" ? interview.platform || "Online" : "In-person"}</span>
                                      </div>
                                    </div>
                                  )}

                                  {interview.interviewers && interview.interviewers.length > 0 && (
                                    <div className="text-xs mt-1">
                                      <span className="font-medium">Interviewers: </span>
                                      <span className="text-gray-600">{interview.interviewers.map((i) => i.name).join(", ")}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-1 ml-2 shrink-0">
                                  {interview.canJoinMeeting && (
                                    <Button
                                      size="sm"
                                      onClick={() => joinMeeting(interview._id)}
                                      className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      Join
                                    </Button>
                                  )}

                                  {interview.meeting_link && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyMeetingLink(interview.meeting_link!)}
                                        className="text-blue-600 hover:text-blue-700 h-7 px-2"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(interview.meeting_link, "_blank")}
                                        className="text-gray-600 hover:text-gray-700 h-7 px-2"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {interview.remarks && interview.remarks.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  <h6 className="text-xs font-medium mb-1">Recent Remarks:</h6>
                                  <div className="space-y-1 max-h-16 overflow-y-auto">
                                    {interview.remarks.slice(-2).map((remark, idx) => (
                                      <div key={idx} className="text-xs p-1.5 bg-white rounded border border-blue-200">
                                        <div className="font-medium text-blue-700 truncate">
                                          {remark.provider.name}: {remark.remark}
                                        </div>
                                        <div className="text-gray-500 text-xs">{formatDateTime(remark.created_at)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Internal Feedback - Collapsible */}
                {candidateData.internal_feedback && candidateData.internal_feedback.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'feedback')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <MessageCircle className="h-4 w-4 text-orange-600" />
                        Internal Feedback ({candidateData.internal_feedback.length})
                      </h4>
                      {isSectionCollapsed(candidate._id, 'feedback') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'feedback') && (
                      <div className="px-3 pb-3">
                        <div className="space-y-2">
                          {candidateData.internal_feedback.map((feedback) => (
                            <div key={feedback._id} className="p-2 bg-orange-50 rounded border border-orange-100">
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {feedback.feedback_by.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-orange-800 text-xs">{feedback.feedback_by.name}</div>
                                    <div className="text-xs text-gray-500">{feedback.feedback_by.role}</div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">{feedback.feedback_at?.toUpperCase()} Stage</Badge>
                              </div>
                              <div className="text-xs text-gray-700 bg-white p-2 rounded border italic">"{feedback.feedback}"</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stage History - Collapsible */}
                {detailedCandidate?.stage_history && detailedCandidate.stage_history.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'history')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                        Stage History ({detailedCandidate.stage_history.length})
                      </h4>
                      {isSectionCollapsed(candidate._id, 'history') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'history') && (
                      <div className="px-3 pb-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                          {detailedCandidate.stage_history.slice(-6).reverse().map((stage, idx) => (
                            <div key={stage._id || idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {stage.from_stage || "Start"}
                                </span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  {stage.to_stage}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mb-1">
                                {stage.action} • {formatDateTime(stage.changed_at)}
                              </div>
                              {stage.remarks && (
                                <div className="text-xs text-gray-600 italic p-1.5 bg-white rounded border border-gray-100">
                                  "{stage.remarks}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Portfolio & System Info - Side by Side - Collapsible */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {candidateData.portfolio_url && (
                    <div className="bg-white rounded-lg border border-gray-200">
                      <button
                        onClick={() => toggleSection(candidate._id, 'portfolio')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-semibold flex items-center gap-2 text-sm">
                          <ExternalLink className="h-4 w-4 text-blue-600" />
                          Portfolio
                        </h4>
                        {isSectionCollapsed(candidate._id, 'portfolio') ? (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      
                      {!isSectionCollapsed(candidate._id, 'portfolio') && (
                        <div className="px-3 pb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(candidateData.portfolio_url!, "_blank")}
                            className="w-full"
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            View Portfolio
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => toggleSection(candidate._id, 'system')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-600" />
                        System Info
                      </h4>
                      {isSectionCollapsed(candidate._id, 'system') ? (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {!isSectionCollapsed(candidate._id, 'system') && (
                      <div className="px-3 pb-3">
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Created:</span>
                            <span>{formatDateTime(candidateData.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Updated:</span>
                            <span>{formatDateTime(candidateData.updatedAt)}</span>
                          </div>
                          {candidateData.last_login && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Last Login:</span>
                              <span>{formatDateTime(candidateData.last_login)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Version:</span>
                            <span>v{candidateData.__v}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Manager:</span>
                            <Badge variant={candidateData.assigned_manager ? "default" : "secondary"} className="text-xs">
                              {candidateData.assigned_manager ? "Assigned" : "Unassigned"}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Status:</span>
                            <Badge variant={candidateData.flagged_for_deletion ? "destructive" : "default"} className="text-xs">
                              {candidateData.flagged_for_deletion ? "Flagged" : "Active"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  })}
</div>



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
              role="manager" // Pass hardcoded role instead of onRoleChange
              onGradeChange={handleGloryGradeChange}
              onSubmit={() => submitGloryGrades(fetchCandidates)}
              getGradingParameters={getGradingParameters}
            />
      
      {/* Stage Update Dialog - Fixed */}
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

          {candidateToUpdateStage && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={candidateToUpdateStage.profile_photo_url?.url}
                    />
                    <AvatarFallback>
                      {candidateToUpdateStage.first_name[0]}
                      {candidateToUpdateStage.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {candidateToUpdateStage.first_name}{" "}
                      {candidateToUpdateStage.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidateToUpdateStage.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Current:
                      </span>
                      <Badge
                        className={getStageColor(
                          candidateToUpdateStage.current_stage
                        )}
                        variant="outline"
                      >
                        {candidateToUpdateStage.current_stage?.toUpperCase()}
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
                    disabled={candidateToUpdateStage.current_stage === "hr"}
                  >
                    👥 HR Review
                  </option>
                  <option
                    value="assessment"
                    disabled={
                      candidateToUpdateStage.current_stage === "assessment"
                    }
                  >
                    📊 Assessment
                  </option>
                  <option
                    value="feedback"
                    disabled={
                      candidateToUpdateStage.current_stage === "feedback"
                    }
                  >
                    📋 Final Feedback
                  </option>
                </select>
              </div>

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
                setCandidateToUpdateStage(null);
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
                  candidateToUpdateStage &&
                  selectedNewStage &&
                  stageFeedback.trim()
                ) {
                  updateCandidateStage(
                    candidateToUpdateStage._id,
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

      {/* Reject Dialog */}
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
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">
                  {candidateToReject.first_name} {candidateToReject.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {candidateToReject.email}
                </p>
              </div>
              {/* Reason input */}
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={isRejecting}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
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
            >
              {isRejecting ? "Rejecting..." : "❌ Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hire Dialog */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              ✅ Confirm Candidate Hiring
            </DialogTitle>
            <DialogDescription>
              You are about to hire this candidate. Please provide any hiring
              notes.
            </DialogDescription>
          </DialogHeader>
          {candidateToHire && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">
                  {candidateToHire.first_name} {candidateToHire.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {candidateToHire.email}
                </p>
              </div>
              {/* Notes input */}
              <div className="space-y-2">
                <Label htmlFor="hiring-note">Hiring Notes (Optional)</Label>
                <Textarea
                  id="hiring-note"
                  placeholder="Add any notes about the hiring decision..."
                  value={hiringNote}
                  onChange={(e) => setHiringNote(e.target.value)}
                  disabled={isHiring}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHireDialogOpen(false);
                setCandidateToHire(null);
                setHiringNote("");
              }}
              disabled={isHiring}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (candidateToHire) {
                  hireCandidate(candidateToHire._id, hiringNote.trim());
                }
              }}
              disabled={isHiring}
            >
              {isHiring ? "Hiring..." : "✅ Confirm Hire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold Dialog */}
      <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              ⏸️ Hold Candidate
            </DialogTitle>
            <DialogDescription>
              You are about to put this candidate on hold. Please provide a
              reason.
            </DialogDescription>
          </DialogHeader>
          {candidateToHold && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">
                  {candidateToHold.first_name} {candidateToHold.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {candidateToHold.email}
                </p>
              </div>
              {/* Reason input */}
              <div className="space-y-2">
                <Label htmlFor="hold-reason">Reason for Hold (Optional)</Label>
                <Textarea
                  id="hold-reason"
                  placeholder="Please provide a reason for holding..."
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  disabled={isHolding}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHoldDialogOpen(false);
                setCandidateToHold(null);
                setHoldReason("");
              }}
              disabled={isHolding}
            >
              Cancel
            </Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={() => {
                if (candidateToHold) {
                  holdCandidate(candidateToHold._id, holdReason.trim());
                }
              }}
              disabled={isHolding}
            >
              {isHolding ? "Holding..." : "⏸️ Confirm Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              💬 Add Feedback
            </DialogTitle>
            <DialogDescription>
              Provide feedback for this candidate's performance and evaluation.
            </DialogDescription>
          </DialogHeader>
          {candidateToGiveFeedback && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">
                  {candidateToGiveFeedback.first_name}{" "}
                  {candidateToGiveFeedback.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {candidateToGiveFeedback.email}
                </p>
              </div>

              {/* Feedback Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="feedback-type">Feedback Type</Label>
                <select
                  id="feedback-type"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={isSubmittingFeedback}
                >
                  <option value="general">General</option>
                  <option value="manager_review">Manager Review</option>
                  <option value="interview_feedback">Interview Feedback</option>
                  <option value="technical_review">Technical Review</option>
                </select>
              </div>

              {/* Feedback Content */}
              <div className="space-y-2">
                <Label htmlFor="feedback-content">Feedback Content</Label>
                <Textarea
                  id="feedback-content"
                  placeholder="Enter your detailed feedback about the candidate..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  disabled={isSubmittingFeedback}
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
                setCandidateToGiveFeedback(null);
                setFeedbackContent("");
                setFeedbackType("general");
              }}
              disabled={isSubmittingFeedback}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (candidateToGiveFeedback && feedbackContent.trim()) {
                  submitFeedback(
                    candidateToGiveFeedback._id,
                    feedbackContent.trim(),
                    feedbackType
                  );
                }
              }}
              disabled={isSubmittingFeedback || !feedbackContent.trim()}
            >
              {isSubmittingFeedback ? "Submitting..." : "💬 Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerStage;
