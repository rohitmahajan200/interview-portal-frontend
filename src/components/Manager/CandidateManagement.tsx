import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Clock,
  Video,
  MessageSquare,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  BarChart3,
  X,
  Circle,
  CirclePause,
  CircleX,
  CircleCheck,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { StageCircle } from "../ui/StageCircle";

interface CandidateTracking {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  current_stage: string;
  status: string;
  applied_job?: {
    name: string;
    description?: string;
  };
  profile_photo_url?: {
    url: string;
  };
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
  hr_questionnaire?: Array<{
    question_text: string;
    response: string;
    input_type: string;
  }>;
  assessments?: Array<{
    assessment_type: string;
    overall_score: number;
    status: string;
    remarks?: string;
  }>;
  documents?: Array<{
    name: string;
    document_type: string;
    status: string;
    document_url: string;
  }>;
  interviews?: Array<{
    title: string;
    status: string;
    scheduled_at: string;
    type: string;
    canJoinMeeting?: boolean;
  }>;
  stage_history?: Array<{
    from_stage: string;
    to_stage: string;
    changed_at: string;
    changed_by?: {
      name: string;
    };
    remarks?: string;
  }>;
  feedbacks?: Array<{
    content: string;
    feedback_provider?: {
      name: string;
      role: string;
    };
    createdAt: string;
  }>;
}

const CandidateManagement: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateTracking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const user = useSelector((state: RootState) => state.orgAuth.user);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get<{
        success: boolean;
        data: CandidateTracking[];
      }>("/org/manager/assign-candidates");
      setCandidates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
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
  
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.log(error);

      return "Invalid Date";
    }
  };

  const toggleCardExpansion = (candidateId: string): void => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCards(newExpanded);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setStageFilter("all");
    setSearchTerm("");
  };

  const hasActiveFilters =
    statusFilter !== "all" || stageFilter !== "all" || searchTerm.length > 0;

  // Apply all filters
  const filteredCandidates = candidates.filter((candidate) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      candidate.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.applied_job?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || candidate.status === statusFilter;

    // Stage filter
    const matchesStage =
      stageFilter === "all" || candidate.current_stage === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Candidate Tracking
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Track all candidates assigned to managers across all stages"
            : "Monitor progress of candidates assigned to you throughout their journey"}
        </p>
      </div>

      {/* Search and Compact Filters */}
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
              <span className="text-xs font-medium text-gray-600 min-w-[40px]">
                Status:
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                  <SelectItem value="active" className="text-xs">
                    Active
                  </SelectItem>
                  <SelectItem value="hired" className="text-xs">
                    Hired
                  </SelectItem>
                  <SelectItem value="rejected" className="text-xs">
                    Rejected
                  </SelectItem>
                  <SelectItem value="withdrawn" className="text-xs">
                    Withdrawn
                  </SelectItem>
                  <SelectItem value="hold" className="text-xs">
                    Hold
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 min-w-[35px]">
                Stage:
              </span>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-7 text-xs min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                  <SelectItem value="registered" className="text-xs">
                    Registered
                  </SelectItem>
                  <SelectItem value="hr" className="text-xs">
                    HR Review
                  </SelectItem>
                  <SelectItem value="assessment" className="text-xs">
                    Assessment
                  </SelectItem>
                  <SelectItem value="tech" className="text-xs">
                    Technical
                  </SelectItem>
                  <SelectItem value="manager" className="text-xs">
                    Manager
                  </SelectItem>
                  <SelectItem value="feedback" className="text-xs">
                    Feedback
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              {filteredCandidates.length} of {candidates.length}
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
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
              <Badge
                variant="secondary"
                className="text-xs h-5 px-2 flex items-center gap-1"
              >
                Search: "{searchTerm.substring(0, 20)}
                {searchTerm.length > 20 ? "..." : ""}"
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
              <Badge
                variant="secondary"
                className="text-xs h-5 px-2 flex items-center gap-1"
              >
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
              <Badge
                variant="secondary"
                className="text-xs h-5 px-2 flex items-center gap-1"
              >
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

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.map((candidate) => {
          const isExpanded = expandedCards.has(candidate._id);

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
            <Card
              key={candidate._id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  {/* Left: Candidate Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={candidate.profile_photo_url?.url} />
                      <AvatarFallback>
                        {candidate.first_name?.[0] || "U"}
                        {candidate.last_name || "U"}
                      </AvatarFallback>
                    </Avatar>

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
                          {candidate.first_name }{" "}
                          {candidate.last_name || "User"}
                        </h3>
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status==="active"?<Circle />:
                          candidate.status==="hold"?<CirclePause />:
                          candidate.status==="rejected"?<CircleX />:
                          candidate.status==="hired"?<CircleCheck />:
                          null
                          }
                          {candidate.status}
                        </Badge>
                        <Badge
                        className={getStageColor(candidate.current_stage)}>
                          {/* Progress circle */}
                      <StageCircle currentStage={candidate.current_stage} />
                      
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

                  {/* Right: Quick Stats and Actions */}
                  <div className="flex items-center gap-4 ml-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Video className="h-3 w-3" />
                        <span>
                          {metrics.completed_interviews +
                            metrics.pending_interviews}
                        </span>
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
                      <div className="text-xs text-muted-foreground">
                        Current Stage
                      </div>
                      <div className="text-sm font-medium">
                        {metrics.current_stage_duration} days
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCardExpansion(candidate._id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* HR Questionnaire - Compact */}
                    {candidate.hr_questionnaire &&
                      candidate.hr_questionnaire.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            HR Review
                          </h4>
                          <div className="space-y-2">
                            {candidate.hr_questionnaire
                              .slice(0, 3)
                              .map((qa, index) => (
                                <div
                                  key={index}
                                  className="p-2 bg-purple-50 rounded border border-purple-100"
                                >
                                  <div className="text-xs font-medium text-purple-800 mb-1">
                                    {qa.question_text?.substring(0, 60) ||
                                      "No question"}
                                    ...
                                  </div>
                                  <div className="text-xs text-gray-700">
                                    {typeof qa.response === "string"
                                      ? qa.response.substring(0, 80) + "..."
                                      : String(qa.response || "No response")}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Assessment Results - Compact */}
                    {candidate.assessments &&
                      candidate.assessments.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                            Assessments
                          </h4>
                          <div className="space-y-2">
                            {candidate.assessments.map((assessment, index) => (
                              <div
                                key={index}
                                className="p-2 bg-indigo-50 rounded border border-indigo-100"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-indigo-800">
                                    {assessment.assessment_type ||
                                      "Unknown Assessment"}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-indigo-700 border-indigo-300"
                                  >
                                    {assessment.overall_score || 0}%
                                  </Badge>
                                </div>
                                {assessment.remarks && (
                                  <div className="text-xs text-indigo-600 italic">
                                    "{assessment.remarks.substring(0, 60)}..."
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Documents - Compact */}
                    {candidate.documents && candidate.documents.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          Documents
                        </h4>
                        <div className="space-y-2">
                          {candidate.documents
                            .slice(0, 4)
                            .map((document, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-emerald-800 truncate">
                                    {document.name || "Unnamed Document"}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {document.document_type || "Unknown Type"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {document.status || "Unknown"}
                                  </Badge>
                                  {document.document_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(
                                          document.document_url,
                                          "_blank"
                                        )
                                      }
                                      className="h-6 w-6 p-0"
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

                    {/* Stage History */}
                    {candidate.stage_history &&
                      candidate.stage_history.length > 0 && (
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            Stage History
                          </h4>
                          <div className="space-y-2">
                            {candidate.stage_history
                              .slice(0, 5)
                              .map((stage, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-gray-50 rounded border border-gray-200"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {stage.from_stage || "Unknown"} →{" "}
                                        {stage.to_stage || "Unknown"}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        by{" "}
                                        {stage.changed_by?.name ||
                                          "Unknown User"}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {stage.changed_at
                                        ? formatDate(stage.changed_at)
                                        : "Unknown Date"}
                                    </span>
                                  </div>
                                  {stage.remarks && (
                                    <div className="text-xs text-gray-600 italic">
                                      "{stage.remarks}"
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* No Candidates Found */}
      {filteredCandidates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No candidates found
            </p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your search criteria or filters"
                : "No candidates assigned to you"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateManagement;
