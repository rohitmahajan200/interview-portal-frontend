import React, {useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Mail,
  Phone,
  UserIcon,
  Video,
  FileText,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Copy,
  Loader2,
  X,
  Circle,
  CirclePause,
  CircleX,
  CircleCheck,
  ShieldCheckIcon,
  Check,
  ClockIcon,
  Eye,
  Award,
} from "lucide-react";
import { StageCircle } from "../ui/StageCircle";
import toast from "react-hot-toast";
import HRCallingDetailsDisplay from "../HRCallingDetailsDisplay";
import GloryDisplay from "../GloryDisplay";

const ManagerAllCandidates = ({
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
  gloryFilter,
  setGloryFilter,
  roleFilter,
  setRoleFilter,
  toggleCardExpansion,
  getStatusColor,
  getStageColor,
  formatDate,
  formatAge,
}) => {
  // State for managing collapsed sections
  const [collapsedSections, setCollapsedSections] = useState({});
  const [copiedDocId, setCopiedDocId] = useState(null);
  const [roles, setRoles] = useState([
    ...new Set(allCandidates.map((item) => item.applied_job.name)),
  ]);

  // Filter functions
  const clearFilters = () => {
    setStatusFilter("all");
    setStageFilter("all");
    setRoleFilter("all");
    setGloryFilter("all");
    setSearchTerm("");
  };

  // Enhanced resume viewing handler with better feedback
const handleViewResume = (candidate) => {  
  const allDocs = 
    candidate.documents || [];
  
  const resumeDoc = allDocs.find(doc => 
    doc.document_type?.toLowerCase() === 'resume'
  );
  
  if (resumeDoc && resumeDoc.document_url) {
    window.open(resumeDoc.document_url, '_blank');
    toast.success('Opening resume in new tab...');
  } else {
    toast.error('No resume available for this candidate.');
  }
};

// Check if resume exists for styling
const hasResume = (candidate) => {
  const allDocs = 
    candidate.documents || [];
  return allDocs.some(doc => 
    doc.document_type?.toLowerCase() === 'resume')
};

  const hasActiveFilters =
    statusFilter !== "all" ||
    stageFilter !== "all" ||
    setRoleFilter !== "all" ||
    setGloryFilter !== "all" ||
    searchTerm.length > 0;

  // Toggle collapse for sections
  const toggleCollapse = (candidateId, section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [`${candidateId}-${section}`]: !prev[`${candidateId}-${section}`],
    }));
  };

  const isCollapsed = (candidateId, section) => {
    return collapsedSections[`${candidateId}-${section}`] || false;
  };

  // Copy to clipboard function
  const copyToClipboard = async (url, docId, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedDocId(docId);
      toast.success("Document link copied to clipboard");
      setTimeout(() => setCopiedDocId(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link");
    }
  };

  const filteredCandidates = allCandidates.filter((candidate) => {
    const matchesSearch =
      !searchTerm ||
      candidate.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.applied_job?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || candidate.status === statusFilter;
    const matchesStage =
      stageFilter === "all" || candidate.current_stage === stageFilter;

    const matchGlory =
      gloryFilter === "all" ||
      candidate.glory.manager.grades.Overall == gloryFilter;

    const matchRole =
      roleFilter === "all" || candidate.applied_job.name == roleFilter;

    return (
      matchesSearch && matchesStatus && matchesStage && matchGlory && matchRole
    );
  });

  // Component for Personal Details & Assessments
  const PersonalDetailsAndAssessments = ({ candidate, candidateData }) => {
    const assessments = candidateData?.assessments || [];
    const isCardCollapsed = isCollapsed(candidate._id, "personal");

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-gray-600" />
              Personal Details & Assessments
              {assessments.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {assessments.length} Tests
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCollapse(candidate._id, "personal")}
              className="text-xs"
            >
              {isCardCollapsed ? "Show" : "Hide"}
              {isCardCollapsed ? (
                <ChevronDown className="h-3 w-3 ml-1" />
              ) : (
                <ChevronUp className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isCardCollapsed && (
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Personal Details */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-sm mb-2 text-gray-700">
                  Personal Information
                </h5>
                <div className="space-y-1 text-sm">
                  <div className="whitespace-normal break-words">
                    <span className="font-medium">Age:</span>{" "}
                    {formatAge(candidate.date_of_birth)} years
                  </div>
                  <div className="whitespace-normal break-words">
                    <span className="font-medium">Gender:</span>{" "}
                    {candidate.gender}
                  </div>
                  <div className="whitespace-normal break-words">
                    <span className="font-medium">Address:</span>{" "}
                    {candidate.address}
                  </div>
                  <div className="whitespace-normal break-words">
                    <span className="font-medium">Registered:</span>{" "}
                    {formatDate(candidate.registration_date)}
                  </div>
                </div>
              </div>

              {/* Assessments */}
              {assessments.length > 0 && (
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-indigo-700">
                    Assessment Tests
                  </h5>
                  <div className="space-y-2">
                    {assessments.map((assessment) => (
                      <div
                        key={assessment._id}
                        className="bg-white p-2 rounded border border-indigo-200"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium whitespace-normal break-words">
                            Assessment
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs text-indigo-700"
                          >
                            {assessment.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-indigo-600 mt-1 whitespace-normal break-words">
                          Assigned by: {assessment.assigned_by?.name}
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
  };

  // Component for HR Responses & Calling Details
  const HRResponsesAndCallingDetails = ({ candidate, candidateData }) => {
    const hrResponses = candidateData?.default_hr_responses || [];
    const isCardCollapsed = isCollapsed(candidate._id, "hrResponses");

    if (hrResponses.length === 0) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              HR Responses & Calling Details
              <Badge variant="secondary" className="text-xs ml-2">
                {hrResponses.length} Responses
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCollapse(candidate._id, "hrResponses")}
              className="text-xs"
            >
              {isCardCollapsed ? "Show" : "Hide"}
              {isCardCollapsed ? (
                <ChevronDown className="h-3 w-3 ml-1" />
              ) : (
                <ChevronUp className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isCardCollapsed && (
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* HR Responses */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <h5 className="font-medium text-sm mb-2 text-purple-700">
                  HR Responses
                </h5>
                <div className="space-y-2">
                  {hrResponses.map((response) => (
                    <div
                      key={response._id}
                      className="bg-white p-2 rounded border border-purple-200"
                    >
                      <div className="text-xs font-medium text-purple-800 mb-1 whitespace-normal break-words">
                        {response.question_text}
                      </div>
                      <div className="text-xs text-gray-700 whitespace-normal break-words">
                        {response.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calling Details */}
              <div className="bg-green-50 p-3 rounded-lg">
                <HRCallingDetailsDisplay
                  candidateId={candidate._id}
                  candidateName={`${candidate.first_name} ${candidate.last_name}`}
                  userRole="manager"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  // NEW: Component for HR Assessment & Technical Assessment Results
  const AssessmentResultsSection = ({ detailedCandidate }) => {
    if (!detailedCandidate) return null;

    const hrQuestionnaire = detailedCandidate.hrQuestionnaireResponses || [];
    const techAssessments = detailedCandidate.assessmentResponses || [];
    const isCardCollapsed = isCollapsed(
      detailedCandidate._id,
      "assessmentResults"
    );

    if (hrQuestionnaire.length === 0 && techAssessments.length === 0)
      return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-indigo-600" />
              Assessment Results & Scores
              <div className="flex gap-2 ml-2">
                {hrQuestionnaire.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {hrQuestionnaire.length} HR
                  </Badge>
                )}
                {techAssessments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {techAssessments.length} Tech
                  </Badge>
                )}
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toggleCollapse(detailedCandidate._id, "assessmentResults")
              }
              className="text-xs"
            >
              {isCardCollapsed ? "Show" : "Hide"}
              {isCardCollapsed ? (
                <ChevronDown className="h-3 w-3 ml-1" />
              ) : (
                <ChevronUp className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isCardCollapsed && (
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* HR Questionnaire Results */}
              {hrQuestionnaire.length > 0 && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-purple-700">
                    HR Questionnaire Results
                  </h5>
                  <div className="space-y-3">
                    {hrQuestionnaire.map((response) => (
                      <div
                        key={response._id}
                        className="bg-white p-3 rounded border border-purple-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-800">
                            HR Assessment
                          </span>
                          <Badge
                            variant={
                              response.overallScore >= 8
                                ? "default"
                                : response.overallScore >= 6
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs font-bold"
                          >
                            {response.overallScore || 0}/10
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                (response.overallScore || 0) >= 8
                                  ? "bg-green-500"
                                  : (response.overallScore || 0) >= 6
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${
                                  ((response.overallScore || 0) / 10) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-purple-600 font-medium">
                            {Math.round(
                              ((response.overallScore || 0) / 10) * 100
                            )}
                            %
                          </span>
                        </div>
                        {response.summary && (
                          <div className="text-xs text-gray-700 italic bg-gray-50 p-2 rounded whitespace-normal break-words">
                            "{response.summary}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Assessment Results */}
              {techAssessments.length > 0 && (
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-indigo-700">
                    Technical Assessment Results
                  </h5>
                  <div className="space-y-3">
                    {techAssessments.map((response) => (
                      <div
                        key={response._id}
                        className="bg-white p-3 rounded border border-indigo-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-indigo-800">
                            Technical Test
                          </span>
                          <div className="flex items-center gap-2">
                            {response.total_score > 0 && (
                              <Badge
                                variant={
                                  (response.ai_score || 0) /
                                    response.total_score >=
                                  0.8
                                    ? "default"
                                    : (response.ai_score || 0) /
                                        response.total_score >=
                                      0.6
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs font-bold"
                              >
                                {response.ai_score || 0}/{response.total_score}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                response.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {response.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {response.total_score > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  (response.ai_score || 0) /
                                    response.total_score >=
                                  0.8
                                    ? "bg-green-500"
                                    : (response.ai_score || 0) /
                                        response.total_score >=
                                      0.6
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${
                                    ((response.ai_score || 0) /
                                      response.total_score) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-indigo-600 font-medium">
                              {Math.round(
                                ((response.ai_score || 0) /
                                  response.total_score) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        )}
                        {response.evaluated_by && (
                          <div className="text-xs text-indigo-600 mt-1 whitespace-normal break-words">
                            Evaluated by: {response.evaluated_by.name}
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
  };

  // Component for Documents
  const DocumentsSection = ({ candidateData }) => {
    const allDocuments = [
      ...(candidateData?.documents || []),
      ...(candidateData?.hired_docs || []),
    ];
    const isCardCollapsed = isCollapsed(candidateData._id, "documents");

    if (allDocuments.length === 0) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-emerald-600" />
              Documents
              <Badge variant="secondary" className="text-xs ml-2">
                {allDocuments.length} Files
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCollapse(candidateData._id, "documents")}
              className="text-xs"
            >
              {isCardCollapsed ? "Show" : "Hide"}
              {isCardCollapsed ? (
                <ChevronDown className="h-3 w-3 ml-1" />
              ) : (
                <ChevronUp className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isCardCollapsed && (
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allDocuments.map((doc) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                  doc.document_url
                );
                const isPDF = /\.pdf$/i.test(doc.document_url);
                const pdfThumbUrl = isPDF
                  ? doc.document_url
                      .replace("/upload/", "/upload/pg_1/")
                      .replace(/\.pdf$/i, ".jpg")
                  : null;

                const isHiredDoc = candidateData?.hired_docs?.some(
                  (hiredDoc) => hiredDoc._id === doc._id
                );

                return (
                  <div
                    key={doc._id}
                    className="group relative border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
                    onClick={() => window.open(doc.document_url, "_blank")}
                  >
                    {/* Document Type Badge */}
                    <div className="absolute top-2 left-2 z-20">
                      {doc.document_type !== "resume" && (
                        <Badge
                          variant={isHiredDoc ? "default" : "secondary"}
                          className="text-xs shadow-sm"
                        >
                          {isHiredDoc ? "Hired Doc" : "Regular Doc"}
                        </Badge>
                      )}
                    </div>

                    {/* Verification Status Badge */}
                    <div className="absolute top-2 right-2 z-20">
                      {doc.document_type !== "resume" && (
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium shadow-sm ${
                            doc.isVerified
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {doc.isVerified ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <ClockIcon className="w-3 h-3" />
                            )}
                            <span>
                              {doc.isVerified ? "Verified" : "Pending"}
                            </span>
                          </div>
                        </Badge>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm"
                          onClick={(e) =>
                            copyToClipboard(doc.document_url, doc._id, e)
                          }
                          title="Copy document link"
                        >
                          {copiedDocId === doc._id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(doc.document_url, "_blank");
                          }}
                          title="View document"
                        >
                          <Eye className="w-3 h-3 text-gray-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Document Preview */}
                    <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <img
                          src={doc.document_url}
                          alt={doc.document_type}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : isPDF ? (
                        <img
                          src={pdfThumbUrl}
                          alt={`${doc.document_type} preview`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/300x200?text=PDF+Preview+Not+Available";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-xs text-center px-2 whitespace-normal break-words">
                            {doc.document_type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Document Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium capitalize truncate text-center whitespace-normal break-words">
                        {doc.document_type}
                      </p>
                      <div className="flex items-center justify-center text-xs text-gray-500 mt-1">
                        <span className="whitespace-normal break-words text-center">
                          {doc.uploaded_at
                            ? formatDate(doc.uploaded_at)
                            : "Click to view"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

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
              <Select defaultValue="manager" value={stageFilter} onValueChange={setStageFilter}>
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
                  <SelectItem value="manager" className="text-xs">
                    Manager
                  </SelectItem>
                  <SelectItem value="feedback" className="text-xs">
                    Feedback
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 min-w-[35px]">
                Role:
              </span>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-7 text-xs min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                  {roles.map((item) => (
                    <SelectItem
                      value={JSON.parse(JSON.stringify(item))}
                      className="text-xs"
                    >
                      {JSON.parse(JSON.stringify(item))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 min-w-[35px]">
                Glory:
              </span>
              <Select value={gloryFilter} onValueChange={setGloryFilter}>
                <SelectTrigger className="h-7 text-xs min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All
                  </SelectItem>
                  <SelectItem value="A+" className="text-xs">
                    A+
                  </SelectItem>
                  <SelectItem value="A" className="text-xs">
                    A
                  </SelectItem>
                  <SelectItem value="B" className="text-xs">
                    B
                  </SelectItem>
                  <SelectItem value="C" className="text-xs">
                    C
                  </SelectItem>
                  <SelectItem value="D" className="text-xs">
                    D
                  </SelectItem>
                  <SelectItem value="E" className="text-xs">
                    E
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              {filteredCandidates.length} of {allCandidates.length}
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
            {roleFilter !== "all" && (
              <Badge
                variant="secondary"
                className="text-xs h-5 px-2 flex items-center gap-1"
              >
                Role: {roleFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => setRoleFilter("all")}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
            {gloryFilter !== "all" && (
              <Badge
                variant="secondary"
                className="text-xs h-5 px-2 flex items-center gap-1"
              >
                Glory: {gloryFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => setGloryFilter("all")}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Candidate Cards */}
      <div className="space-y-4">
        {filteredCandidates.map((candidate) => {
          const isExpanded = expandedCards.has(candidate._id);
          const isLoadingDetail = loadingDetails.has(candidate._id);
          const detailedCandidate = detailedCandidates[candidate._id];
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
            <Card
              key={candidate._id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  {/* Candidate Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar className="w-40 h-35 ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden rounded-md flex-shrink-0">
                        <AvatarImage src={candidate.profile_photo_url?.url} />
                        <AvatarFallback>
                          {candidate.first_name?.[0] || "U"}
                          {candidate.last_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
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
                          className={`text-lg font-semibold whitespace-normal break-words ${
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
                        <Badge
                          className={getStageColor(candidate.current_stage)}
                        >
                          <StageCircle currentStage={candidate.current_stage} />
                          Stage-
                          {candidate.current_stage?.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="whitespace-normal break-words">
                            {candidate.email || "No email"}
                          </span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="whitespace-normal break-words">
                              {candidate.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm font-medium text-blue-600 mb-2 whitespace-normal break-words">
                        {candidate.applied_job?.name || "No job specified"}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats and Actions */}
                  <div className="flex items-center gap-4 ml-4">
                    <Button
  variant={hasResume(candidate) ? "default" : "outline"}
  size="sm"
  onClick={() => handleViewResume(candidate)}
  className="flex items-center gap-2"
  disabled={!hasResume(candidate)}
>
  <FileText className="h-4 w-4" />
  {hasResume(candidate) ? "View Resume" : "No Resume"}
</Button>


                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Pending for
                      </div>
                      <div className="text-sm font-medium">
                        {metrics.current_stage_duration} days
                      </div>
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

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mr-2" />
                      <span>Loading candidate details...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Personal Details & Assessments */}
                      <PersonalDetailsAndAssessments
                        candidate={candidate}
                        candidateData={candidateData}
                      />

                      {/* HR Responses & Calling Details */}
                      <HRResponsesAndCallingDetails
                        candidate={candidate}
                        candidateData={candidateData}
                      />

                      {/* NEW: Assessment Results & Scores */}
                      <AssessmentResultsSection
                        detailedCandidate={detailedCandidate}
                      />

                      {/* Documents Section */}
                      <DocumentsSection candidateData={candidateData} />

                      <GloryDisplay glory={candidate.glory} />
                      {/* Single card with Stage History & Internal Feedback side by side */}
                      <div className="grid grid-cols-1 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2 text-base">
                                <ArrowRight className="h-4 w-4 text-gray-600" />
                                Stage History & Internal Feedback
                                {/* Badge showing counts */}
                                <div className="flex gap-2 ml-2">
                                  {detailedCandidate?.stage_history &&
                                    detailedCandidate.stage_history.length >
                                      0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {detailedCandidate.stage_history.length}{" "}
                                        History
                                      </Badge>
                                    )}
                                  {candidateData.internal_feedback &&
                                    candidateData.internal_feedback.length >
                                      0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {candidateData.internal_feedback.length}{" "}
                                        Feedback
                                      </Badge>
                                    )}
                                </div>
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleCollapse(
                                    candidate._id,
                                    "stageHistoryFeedback"
                                  )
                                }
                                className="text-xs"
                              >
                                {isCollapsed(
                                  candidate._id,
                                  "stageHistoryFeedback"
                                )
                                  ? "Show"
                                  : "Hide"}
                                {isCollapsed(
                                  candidate._id,
                                  "stageHistoryFeedback"
                                ) ? (
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                ) : (
                                  <ChevronUp className="h-3 w-3 ml-1" />
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          {!isCollapsed(
                            candidate._id,
                            "stageHistoryFeedback"
                          ) && (
                            <CardContent className="pt-2">
                              {/* Grid layout to place sections side by side */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Stage History Section */}
                                <div>
                                  {detailedCandidate?.stage_history &&
                                    detailedCandidate.stage_history.length >
                                      0 && (
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-700 mb-2">
                                          Recent Stage Changes
                                        </h6>
                                        <div className="space-y-2">
                                          {detailedCandidate.stage_history.map(
                                            (stage) => (
                                              <div
                                                key={stage._id}
                                                className="p-2 bg-gray-50 rounded border border-gray-200"
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs whitespace-normal break-words">
                                                      {stage.from_stage ||
                                                        "Start"}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs whitespace-normal break-words">
                                                      {stage.to_stage}
                                                    </span>
                                                  </div>
                                                  <span className="text-xs text-muted-foreground">
                                                    {formatDate(
                                                      stage.changed_at
                                                    )}
                                                  </span>
                                                </div>
                                                {stage.remarks && (
                                                  <div className="text-xs text-gray-600 italic whitespace-normal break-words">
                                                    "{stage.remarks}"
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>

                                {/* Internal Feedback Section */}
                                <div>
                                  {candidateData.internal_feedback &&
                                    candidateData.internal_feedback.length >
                                      0 && (
                                      <div>
                                        <h6 className="text-sm font-medium text-orange-700 mb-2">
                                          Internal Feedback
                                        </h6>
                                        <div className="space-y-2">
                                          {candidateData.internal_feedback.map(
                                            (feedback) => (
                                              <div
                                                key={feedback._id}
                                                className="p-2 bg-orange-50 rounded border border-orange-100"
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="text-sm font-medium text-orange-800 whitespace-normal break-words">
                                                    {feedback.feedback_by.name}
                                                  </span>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {formatDate(
                                                      feedback.feedback_at
                                                    )}
                                                  </Badge>
                                                </div>
                                                <div className="text-sm text-gray-700 whitespace-normal break-words">
                                                  {feedback.feedback}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      </div>
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
