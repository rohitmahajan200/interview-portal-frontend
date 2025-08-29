import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  UserIcon,
  Video,
  FileText,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Copy,
  ExternalLink,
  Loader2,
  X,
  Circle,
  CirclePause,
  CircleX,
  CircleCheck,
  ShieldCheckIcon,
} from "lucide-react";
import { StageCircle } from "../ui/StageCircle";

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
  documents?: string[];
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
}

interface ManagerAllCandidatesProps {
  allCandidates: ManagerCandidate[];
  detailedCandidates: Record<string, DetailedCandidate>;
  loadingDetails: Set<string>;
  expandedCards: Set<string>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  stageFilter: string;
  setStageFilter: (value: string) => void;
  toggleCardExpansion: (candidateId: string) => void;
  copyMeetingLink: (link: string) => void;
  getStatusColor: (status: string) => string;
  getStageColor: (stage: string) => string;
  formatDateTime: (dateString: string) => string;
  formatDate: (dateString: string) => string;
  formatAge: (dateString: string) => number;
}

const ManagerAllCandidates: React.FC<ManagerAllCandidatesProps> = ({
  allCandidates,
  detailedCandidates,
  loadingDetails,
  expandedCards,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  stageFilter,
  setStageFilter,
  toggleCardExpansion,
  copyMeetingLink,
  getStatusColor,
  getStageColor,
  formatDateTime,
  formatDate,
  formatAge,
}) => {
  // Filter functions
  const clearFilters = () => {
    setStatusFilter("all");
    setStageFilter("all");
    setSearchTerm("");
  };

  const hasActiveFilters = statusFilter !== "all" || stageFilter !== "all" || searchTerm.length > 0;

  const filteredCandidates = allCandidates.filter((candidate) => {
    const matchesSearch =
      !searchTerm ||
      candidate.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.applied_job?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    const matchesStage = stageFilter === "all" || candidate.current_stage === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters for Tracking */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Compact Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 min-w-[40px]">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="hired" className="text-xs">Hired</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                  <SelectItem value="withdrawn" className="text-xs">Withdrawn</SelectItem>
                  <SelectItem value="hold" className="text-xs">Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 min-w-[35px]">Stage:</span>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-7 text-xs min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="registered" className="text-xs">Registered</SelectItem>
                  <SelectItem value="hr" className="text-xs">HR Review</SelectItem>
                  <SelectItem value="assessment" className="text-xs">Assessment</SelectItem>
                  <SelectItem value="tech" className="text-xs">Technical</SelectItem>
                  <SelectItem value="manager" className="text-xs">Manager</SelectItem>
                  <SelectItem value="feedback" className="text-xs">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              {filteredCandidates.length} of {allCandidates.length}
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1">
            {searchTerm && (
              <Badge variant="secondary" className="text-xs h-5 px-2 flex items-center gap-1">
                Search: "{searchTerm.substring(0, 20)}{searchTerm.length > 20 ? "..." : ""}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="text-xs h-5 px-2 flex items-center gap-1">
                Status: {statusFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => setStatusFilter("all")}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
            {stageFilter !== "all" && (
              <Badge variant="secondary" className="text-xs h-5 px-2 flex items-center gap-1">
                Stage: {stageFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => setStageFilter("all")}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Candidate Tracking Cards - Enhanced */}
      <div className="space-y-4">
        {filteredCandidates.map((candidate) => {
          const isExpanded = expandedCards.has(candidate._id);
          const isLoadingDetail = loadingDetails.has(candidate._id);
          const detailedCandidate = detailedCandidates[candidate._id];
          
          // Use detailed data if available, otherwise use list data
          const candidateData = detailedCandidate || candidate;
          
          const metrics = candidate.progress_metrics || {
            stages_completed: 0,
            total_assessments: 0,
            completed_interviews: 0,
            pending_interviews: 0,
            documents_uploaded: 0,
            feedback_count: 0,
            hr_questionnaire_completed: false,
            current_stage_duration: 0,
          };

          return (
            <Card key={candidate._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  {/* Left: Enhanced Candidate Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={candidate.profile_photo_url?.url} />
                        <AvatarFallback>
                          {candidate.first_name?.[0] || "U"}
                          {candidate.last_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {/* Status indicators */}
                      <div className="absolute -bottom-1 -right-1 flex gap-1">
                        {candidate.email_verified && (
                          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                            <ShieldCheckIcon className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-lg font-semibold truncate 
                        ${
                          candidate.status === "rejected"
                            ? "line-through text-red-600 opacity-75"
                            : candidate.status === "hired"
                            ? "text-green-700 font-bold animate-pulse"
                            : ""
                        }`}
                        >
                          {candidate.status === "hired" && "🎉 "}
                          {candidate.first_name} {candidate.last_name || "User"}
                        </h3>
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status === "active" ? (
                            <Circle className="w-3 h-3 mr-1" />
                          ) : candidate.status === "hold" ? (
                            <CirclePause className="w-3 h-3 mr-1" />
                          ) : candidate.status === "rejected" ? (
                            <CircleX className="w-3 h-3 mr-1" />
                          ) : candidate.status === "hired" ? (
                            <CircleCheck className="w-3 h-3 mr-1" />
                          ) : null}
                          {candidate.status}
                        </Badge>
                        <Badge className={getStageColor(candidate.current_stage)}>
                          <StageCircle currentStage={candidate.current_stage} />
                          {candidate.current_stage?.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {candidate.email || "No email"}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {candidate.phone}
                          </div>
                        )}
                      </div>

                      <div className="text-sm font-medium text-blue-600 mb-2">
                        {candidate.applied_job?.name || "No job specified"}
                      </div>
                    </div>
                  </div>

                  {/* Right: Enhanced Quick Stats and Actions */}
                  <div className="flex items-center gap-4 ml-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Video className="h-3 w-3" />
                        <span>{metrics.completed_interviews + metrics.pending_interviews}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <FileText className="h-3 w-3" />
                        <span>{metrics.documents_uploaded}</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600">
                        <BarChart3 className="h-3 w-3" />
                        <span>{metrics.total_assessments}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <MessageSquare className="h-3 w-3" />
                        <span>{metrics.feedback_count}</span>
                      </div>
                    </div>

                    {/* Stage Duration */}
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Current Stage</div>
                      <div className="text-sm font-medium">{metrics.current_stage_duration} days</div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCardExpansion(candidate._id)}
                      disabled={isLoadingDetail}
                    >
                      {isLoadingDetail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content for Tracking - Enhanced with detailed API data */}
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>Loading candidate details...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Personal Details - Compact */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                          Personal Details
                        </h4>
                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg text-sm">
                          <div><strong>Age:</strong> {formatAge(candidate.date_of_birth)} years</div>
                          <div><strong>Gender:</strong> {candidate.gender}</div>
                          <div><strong>Address:</strong> {candidate.address}</div>
                          <div><strong>Registered:</strong> {formatDate(candidate.registration_date)}</div>
                        </div>
                      </div>

                      {/* HR Responses - Compact */}
                      {candidateData.default_hr_responses && candidateData.default_hr_responses.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            HR Responses
                          </h4>
                          <div className="space-y-2">
                            {candidateData.default_hr_responses.slice(0, 2).map((response) => (
                              <div key={response._id} className="p-2 bg-purple-50 rounded border border-purple-100">
                                <div className="text-xs font-medium text-purple-800 mb-1">
                                  {response.question_text?.substring(0, 40)}...
                                </div>
                                <div className="text-xs text-gray-700">
                                  {response.response?.substring(0, 60)}...
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents Section - Enhanced with detailed data */}
                      {detailedCandidate?.documents && detailedCandidate.documents.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            Documents
                          </h4>
                          <div className="space-y-2">
                            {detailedCandidate.documents.slice(0, 3).map((document) => (
                              <div key={document._id} className="p-2 bg-emerald-50 rounded border border-emerald-100">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-emerald-800 truncate">
                                    {document.document_type}
                                  </span>
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assessments - Compact */}
                      {candidateData.assessments && candidateData.assessments.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-indigo-600" />
                            Assessments
                          </h4>
                          <div className="space-y-2">
                            {candidateData.assessments.map((assessment) => (
                              <div key={assessment._id} className="p-2 bg-indigo-50 rounded border border-indigo-100">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-indigo-800">
                                    Assessment
                                  </span>
                                  <Badge variant="outline" className="text-indigo-700 border-indigo-300 text-xs">
                                    {assessment.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-indigo-600">
                                  By: {assessment.assigned_by.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stage History - Enhanced with detailed data */}
                      {detailedCandidate?.stage_history && detailedCandidate.stage_history.length > 0 && (
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-600" />
                            Stage History
                          </h4>
                          <div className="space-y-2">
                            {detailedCandidate.stage_history.slice(-4).map((stage) => (
                              <div key={stage._id} className="p-2 bg-gray-50 rounded border border-gray-200">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                      {stage.from_stage || "Start"}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                      {stage.to_stage}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(stage.changed_at)}
                                  </span>
                                </div>
                                {stage.remarks && (
                                  <div className="text-xs text-gray-600 italic">"{stage.remarks}"</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Internal Feedback - Compact */}
                      {candidateData.internal_feedback && candidateData.internal_feedback.length > 0 && (
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-orange-600" />
                            Internal Feedback
                          </h4>
                          <div className="space-y-2">
                            {candidateData.internal_feedback.slice(0, 3).map((feedback) => (
                              <div key={feedback._id} className="p-3 bg-orange-50 rounded border border-orange-100">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-orange-800">
                                      {feedback.feedback_by.name}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {feedback.feedback_at?.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-700">
                                  {feedback.feedback}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interviews Section - Enhanced with detailed data */}
                      {detailedCandidate?.interviews && detailedCandidate.interviews.length > 0 && (
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Video className="h-4 w-4 text-blue-600" />
                            Interviews ({detailedCandidate.interviews.length})
                          </h4>
                          <div className="space-y-3">
                            {detailedCandidate.interviews.map((interview) => (
                              <div key={interview._id} className="p-3 bg-blue-50 rounded border border-blue-100">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium text-blue-800">
                                      {interview.title || "Interview"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Status: {interview.status}
                                    </div>
                                  </div>
                                  {interview.meeting_link && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyMeetingLink(interview.meeting_link!)}
                                        className="h-6 w-6 p-0 text-blue-600"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(interview.meeting_link, "_blank")}
                                        className="h-6 w-6 p-0 text-blue-600"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {interview.scheduled_at && (
                                  <div className="text-xs text-blue-600">
                                    Scheduled: {formatDateTime(interview.scheduled_at)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ManagerAllCandidates;
