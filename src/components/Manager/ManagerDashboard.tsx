import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Users,
  Clock,
  Calendar,
  Video,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  TrendingUp,
  Copy,
  ExternalLink,
  MapPin,
  CirclePause,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import type {
  ManagerCandidate,
  ManagerStats,
  ActionModalState,
  ActionType,
} from "@/types/manager.types";

const ManagerDashboard: React.FC = () => {
  // State
  const [candidates, setCandidates] = useState<ManagerCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
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

  // Effects
  useEffect(() => {
    fetchData();
  }, []);

  // Data fetching
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [candidatesRes, statsRes] = await Promise.all([
        api.get<{ success: boolean; data: ManagerCandidate[] }>(
          "/org/manager/candidates"
        ),
        api.get<{ success: boolean; data: { statistics: ManagerStats } }>(
          "/org/dashboard/stats"
        ),
      ]);

      setCandidates(candidatesRes.data.data || []);
      if (statsRes.data.success) {
        setStats(statsRes.data.data.statistics);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openActionModal = (
    candidate: ManagerCandidate,
    type: ActionType
  ): void => {
    setActionModal({ open: true, candidate, type, loading: false });
    setActionData({ feedback: "", stage: "feedback" });
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

  // Action handler
  const handleQuickAction = async (): Promise<void> => {
    if (!actionModal.candidate || !actionModal.type) return;

    try {
      setActionModal((prev) => ({ ...prev, loading: true }));

      const { candidate, type } = actionModal;
      let endpoint = "";
      let payload: Record<string, string | number> = {};
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
            new_stage: "feedback",
            status:"hold",
            action: "hold",
            remarks: actionData.feedback || "Hold for hiring",
          };
          method = "patch";
          break;

        case "hire":
          endpoint = `/org/candidates/${candidate._id}/stage`;
          payload = {
            new_stage: "feedback",
            action: "hired",
            status:"hired",
            remarks: actionData.feedback || "Approved by manager",
          };
          method = "patch";
          break;

        case "reject":
          endpoint = `/org/candidates/${candidate._id}/reject`;
          payload = {
            new_stage: "feedback",
            action: "rejected",
            remarks: actionData.feedback || "Rejected by manager",
          };
          method = "patch";
          break;

        case "stage":
          endpoint = `/org/candidates/${candidate._id}/stage`;
          payload = {
            new_stage: actionData.stage,
            remarks:
              actionData.feedback || `Stage changed to ${actionData.stage}`,
          };
          method = "patch";
          break;
      }

      await api[method](endpoint, payload);

      toast.success(`${type} completed successfully`);
      closeActionModal();
      await fetchData();
    } catch (error: unknown) {
      console.error(`Failed to ${actionModal.type}:`, error);
      if (
        error instanceof Error ||
        (error && typeof error === "object" && "response" in error)
      ) {
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(
          apiError.response?.data?.message || `Failed to ${actionModal.type}`
        );
      } else {
        toast.error(`Failed to ${actionModal.type}`);
      }
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
      if (
        error instanceof Error ||
        (error && typeof error === "object" && "response" in error)
      ) {
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(
          apiError.response?.data?.message || "Failed to join meeting"
        );
      } else {
        toast.error("Failed to join meeting");
      }
    }
  };

  // UI helpers
  const toggleCardExpansion = (candidateId: string): void => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      hired: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
    });
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.applied_job?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

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
            ? "Admin view - All manager stage candidates"
            : "Review and manage candidates in manager stage"}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {stats.total_candidates}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {stats.active_candidates}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                Interviewed
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {stats.interviewed_candidates}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Pending
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {stats.pending_feedback_candidates}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search candidates by name, email, or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Candidate Cards */}
      <div className="space-y-4">
        {filteredCandidates.map((candidate) => {
          const isExpanded = expandedCards.has(candidate._id);
          //const overallScore = getOverallScore(candidate);
          const upcomingInterview = candidate.interviews?.find(
            (i) =>
              new Date(i.scheduled_at) > new Date() && i.status === "scheduled"
          );
          const activeInterview = candidate.interviews?.find(
            (i) => i.canJoinMeeting
          );

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
                        {candidate.first_name[0]}
                        {candidate.last_name}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold truncate">
                          {candidate.first_name} {candidate.last_name}
                        </h3>
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {candidate.email}
                        </div>

                        {candidate.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {candidate.phone}
                          </div>
                        )}
                      </div>

                      <div className="text-sm font-medium text-blue-600 mt-1">
                        {candidate.applied_job?.name}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex items-center gap-2">
                    {/* Active Meeting Join Button */}
                    {activeInterview && (
                      <Button
                        size="sm"
                        onClick={() => joinMeeting(activeInterview._id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Join Now
                      </Button>
                    )}

                    {/* Upcoming Interview Badge */}
                    {upcomingInterview && !activeInterview && (
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-300"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDateTime(upcomingInterview.scheduled_at)}
                      </Badge>
                    )}

                    {/* Quick Action Buttons */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionModal(candidate, "feedback")}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionModal(candidate, "hire")}
                      className="text-green-600 hover:text-green-700"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionModal(candidate, "reject")}
                      className="text-red-600 hover:text-red-700"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionModal(candidate, "hold")}
                      className="text-red-600 hover:text-red-700"
                    >
                      <CirclePause className="h-4 w-4" />
                    </Button>

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

                {/* Quick Info Row - Fixed */}
                <div className="flex items-center gap-6 mt-3 text-sm">
                  {candidate.interviews && candidate.interviews.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4 text-green-500" />
                      <span>
                        {candidate.interviews.length} Interview
                        {candidate.interviews.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {candidate.feedbacks && candidate.feedbacks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      <span>
                        {candidate.feedbacks.length} Feedback
                        {candidate.feedbacks.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Expanded Content - Full Width Layout */}
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  <div className="space-y-6">
                    {/* Interviews Section - Full Width */}
                    {candidate.interviews &&
                      candidate.interviews.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Video className="h-5 w-5" />
                            Interviews ({candidate.interviews.length})
                          </h4>
                          <div className="space-y-3">
                            {candidate.interviews.map((interview) => (
                              <div
                                key={interview._id}
                                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h5 className="font-medium text-lg">
                                        {interview.title}
                                      </h5>
                                      <Badge
                                        variant={
                                          interview.status === "scheduled"
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {interview.status}
                                      </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          {formatDate(interview.scheduled_at)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {new Date(
                                            interview.scheduled_at
                                          ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {interview.type === "online" ? (
                                          <Video className="h-4 w-4 text-blue-600" />
                                        ) : (
                                          <MapPin className="h-4 w-4 text-green-600" />
                                        )}
                                        <span>
                                          {interview.type === "online"
                                            ? interview.platform || "Online"
                                            : "In-person"}
                                        </span>
                                      </div>
                                    </div>

                                    {interview.interviewers &&
                                      interview.interviewers.length > 0 && (
                                        <div className="mt-2 text-sm">
                                          <span className="font-medium">
                                            Interviewers:{" "}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {interview.interviewers
                                              .map((i) => i.name)
                                              .join(", ")}
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Meeting Actions */}
                                  <div className="flex gap-2 ml-4">
                                    {interview.canJoinMeeting && (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          joinMeeting(interview._id)
                                        }
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Video className="h-4 w-4 mr-1" />
                                        Join Now
                                      </Button>
                                    )}

                                    {interview.meeting_link && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          copyMeetingLink(
                                            interview.meeting_link!
                                          )
                                        }
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy Link
                                      </Button>
                                    )}

                                    {interview.meeting_link && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          window.open(
                                            interview.meeting_link,
                                            "_blank"
                                          )
                                        }
                                        className="text-gray-600 hover:text-gray-700"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Interview Remarks */}
                                {interview.remarks &&
                                  interview.remarks.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                      <h6 className="text-sm font-medium mb-2">
                                        Recent Remarks:
                                      </h6>
                                      <div className="space-y-2 max-h-24 overflow-y-auto">
                                        {interview.remarks
                                          .slice(-2)
                                          .map((remark, idx) => (
                                            <div
                                              key={idx}
                                              className="text-xs p-2 bg-white rounded border border-blue-200"
                                            >
                                              <div className="font-medium text-blue-700">
                                                {remark.provider.name}:{" "}
                                                {remark.remark}
                                              </div>
                                              <div className="text-muted-foreground mt-1">
                                                {formatDateTime(
                                                  remark.created_at
                                                )}
                                              </div>
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

                    {/* HR Questionnaire - Compact */}
                    
                    {candidate.hr_questionnaire &&
                      candidate.hr_questionnaire.length > 0 && (
                        <div>
                          
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            HR Review
                          </h4>
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            {candidate.hr_questionnaire
                              .slice(0, 3)
                              .map((qa, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center py-2 border-b border-purple-200 last:border-b-0"
                                >
                                  <span className="text-sm text-gray-700 truncate flex-1 mr-3">
                                    Q{index + 1}: {qa.question.substring(0, 50)}
                                    ...
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {qa.score && (
                                      <Badge
                                        variant="outline"
                                        className="text-purple-700 border-purple-300 text-xs"
                                      >
                                        {qa.score}/10
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            {candidate.hr_questionnaire.length > 3 && (
                              <div className="text-xs text-purple-600 mt-2 text-center">
                                +{candidate.hr_questionnaire.length - 3} more
                                questions
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Assessment Results - Compact */}
                    {candidate.assessments &&
                      candidate.assessments.length > 0 && (
                        <div>
                          {console.log("Candiadte ree=>",candidate)}
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                            Assessments
                          </h4>
                          <div className="space-y-2">
                            {candidate.assessments.map((assessment) => (
                              <div
                                key={assessment._id}
                                className="p-3 bg-indigo-50 rounded-lg border border-indigo-100"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-sm text-indigo-800">
                                    {assessment.assessment_type ||
                                      assessment.title}
                                  </span>
                                  {assessment.overall_score && (
                                    <Badge
                                      variant="outline"
                                      className={
                                        assessment.overall_score >= 80
                                          ? "text-green-700 border-green-300"
                                          : assessment.overall_score >= 60
                                          ? "text-yellow-700 border-yellow-300"
                                          : "text-red-700 border-red-300"
                                      }
                                    >
                                      {assessment.overall_score}%
                                    </Badge>
                                  )}
                                </div>
                                {assessment.remarks && (
                                  <div className="text-xs text-indigo-600 italic">
                                    "{assessment.remarks.substring(0, 80)}..."
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
                          <ExternalLink className="h-4 w-4 text-emerald-600" />
                          Documents
                        </h4>
                        <div className="space-y-2">
                          {candidate.documents.slice(0, 5).map((document) => (
                            <div
                              key={document._id}
                              className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100"
                            >
                              <div className="flex-1 min-w-0 mr-3">
                                <div className="text-sm font-medium text-emerald-800 truncate">
                                  {document.document_type || 'Document/Resume'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {document.document_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(document.document_url, "_blank")
                                    }
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

                    {/* Stage History Section - Full Width */}
                    {candidate.stage_history &&
                      candidate.stage_history.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <ArrowRight className="h-5 w-5" />
                            Stage History
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {candidate.stage_history
                              .slice(-6)
                              .reverse()
                              .map((stage, idx) => (
                                <div
                                  key={stage._id || idx}
                                  className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="font-medium text-sm flex items-center gap-1">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                        {stage.from_stage || "Start"}
                                      </span>
                                      <ArrowRight className="h-3 w-3 text-gray-400" />
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                        {stage.to_stage}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-xs text-muted-foreground mb-1">
                                    {stage.changed_by?.name} •{" "}
                                    {formatDateTime(stage.changed_at)}
                                  </div>

                                  {stage.remarks && (
                                    <div className="text-xs text-gray-600 italic mt-2 p-2 bg-white rounded border border-gray-100">
                                      "{stage.remarks}"
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Feedback History Section - Full Width */}
                    {candidate.feedbacks && candidate.feedbacks.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Feedback History ({candidate.feedbacks.length})
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {candidate.feedbacks
                            .slice(-4)
                            .reverse()
                            .map((feedback) => (
                              <div
                                key={feedback._id}
                                className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium text-sm text-orange-800">
                                    {feedback.feedback_provider.name}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {feedback.feedback_type}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-700 mb-2">
                                  {feedback.content}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDateTime(feedback.createdAt)}
                                </div>
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
              {searchTerm
                ? "Try adjusting your search criteria"
                : "No candidates in manager stage"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Modal */}
      <Dialog
        open={actionModal.open}
        onOpenChange={() => !actionModal.loading && closeActionModal()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionModal.type === "feedback" && "Provide Feedback"}
              {actionModal.type === "hire" && "Approve Candidate"}
              {actionModal.type === "reject" && "Reject Candidate"}
              {actionModal.type === "stage" && "Change Stage"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Candidate Info */}
            {actionModal.candidate && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage
                    src={actionModal.candidate.profile_photo_url?.url}
                  />
                  <AvatarFallback>
                    {actionModal.candidate.first_name[0]}
                    {actionModal.candidate.last_name}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {actionModal.candidate.first_name}{" "}
                    {actionModal.candidate.last_name}
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
                  onValueChange={(value) =>
                    setActionData((prev) => ({ ...prev, stage: value }))
                  }
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="hr">HR Review</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="tech">Technical</SelectItem>
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
                {actionModal.type === "stage" && "Remarks"}
              </label>
              <Textarea
                value={actionData.feedback}
                onChange={(e) =>
                  setActionData((prev) => ({
                    ...prev,
                    feedback: e.target.value,
                  }))
                }
                placeholder={
                  actionModal.type === "feedback"
                    ? "Your detailed feedback..."
                    : actionModal.type === "hire"
                    ? "Notes about hiring decision..."
                    : actionModal.type === "reject"
                    ? "Reason for rejection..."
                    : "Reason for stage change..."
                }
                rows={4}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeActionModal}
              disabled={actionModal.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickAction}
              disabled={
                actionModal.loading ||
                (actionModal.type === "feedback" &&
                  !actionData.feedback.trim()) ||
                (actionModal.type === "reject" &&
                  !actionData.feedback.trim()) ||
                (actionModal.type === "stage" && !actionData.stage)
              }
              className={
                actionModal.type === "hire"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionModal.type === "reject"
                  ? "bg-red-600 hover:bg-red-700"
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
