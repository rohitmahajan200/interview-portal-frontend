import React, { useState } from "react";
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
  Building,
  Users,
  Share2,
  ExternalLink,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
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

  // Fixed TypeScript typing for roles
  const [roles, setRoles] = useState<string[]>(() => {
    const uniqueRoles = new Set<string>();
    allCandidates.forEach((candidate) => {
      if (
        candidate.applied_job?.title &&
        typeof candidate.applied_job.title === "string"
      ) {
        uniqueRoles.add(candidate.applied_job.title);
      }
    });
    return Array.from(uniqueRoles);
  });

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
    const allDocs = [
      ...(candidate.documents || []),
      ...(candidate.hired_docs || []),
    ];

    const resumeDoc = allDocs.find(
      (doc) => doc.documenttype?.toLowerCase() === "resume"
    );

    if (resumeDoc && resumeDoc.documenturl) {
      window.open(resumeDoc.documenturl, "_blank");
      toast.success("Opening resume in new tab...");
    } else {
      toast.error("No resume available for this candidate.");
    }
  };

  // Check if resume exists for styling
  const hasResume = (candidate) => {
    const allDocs = [
      ...(candidate.documents || []),
      ...(candidate.hired_docs || []),
    ];
    return allDocs.some((doc) => doc.documenttype?.toLowerCase() === "resume");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    stageFilter !== "all" ||
    roleFilter !== "all" ||
    gloryFilter !== "all" ||
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
            toast.error("Failed to copy link");
    }
  };

  const filteredCandidates = allCandidates.filter((candidate) => {
    const matchesSearch =
      !searchTerm ||
      candidate.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.applied_job?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || candidate.status === statusFilter;
    const matchesStage =
      stageFilter === "all" || candidate.current_stage === stageFilter;

    const matchGlory =
      gloryFilter === "all" ||
      candidate.glory?.manager?.grades?.Overall == gloryFilter;

    const matchRole =
      roleFilter === "all" || candidate.applied_job?.title == roleFilter;

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
              <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h5 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Personal Information
                </h5>
                <div className="space-y-1 text-sm">
                  <div className="whitespace-normal break-words">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Age:
                    </span>{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatAge(candidate.date_of_birth)} years
                    </span>
                  </div>
                  <div className="whitespace-normal break-words">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Gender:
                    </span>{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      {candidate.gender}
                    </span>
                  </div>
                  <div className="whitespace-normal break-words">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Address:
                    </span>{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      {candidate.address}
                    </span>
                  </div>
                  <div className="whitespace-normal break-words">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Registered:
                    </span>{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(candidate.registration_date)}
                    </span>
                  </div>
                  {candidateData.portfolio_url && (
                    <div className="whitespace-normal break-words">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Portfolio:
                      </span>{" "}
                      <a
                        href={candidateData.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        View Portfolio <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessments */}
              {assessments.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-indigo-700 dark:text-indigo-300">
                    Assessment Tests
                  </h5>
                  <div className="space-y-2">
                    {assessments.map((assessment) => (
                      <div
                        key={assessment._id}
                        className="bg-white dark:bg-gray-800 p-2 rounded border border-indigo-200 dark:border-indigo-700"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium whitespace-normal break-words text-gray-900 dark:text-gray-100">
                            Assessment
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs text-indigo-700 dark:text-indigo-300"
                          >
                            {assessment.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 whitespace-normal break-words">
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
      <Card className="mb-4 border-border dark:border-border bg-card dark:bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-foreground dark:text-foreground">
              <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              HR Responses & Calling Details
              <Badge variant="secondary" className="text-xs ml-2">
                {hrResponses.length} Responses
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCollapse(candidate._id, "hrResponses")}
              className="text-xs text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
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
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                <h5 className="font-medium text-sm mb-2 text-purple-700 dark:text-purple-300">
                  HR Responses
                </h5>
                <div className="space-y-2">
                  {hrResponses.map((response) => (
                    <div
                      key={response._id}
                      className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700"
                    >
                      <div className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1 whitespace-normal break-words">
                        {response.question_text}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-normal break-words">
                        {response.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calling Details */}
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
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


  // Component for Assessment Results & Scores
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
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-purple-700 dark:text-purple-300">
                    HR Questionnaire Results
                  </h5>
                  <div className="space-y-3">
                    {hrQuestionnaire.map((response) => (
                      <div
                        key={response._id}
                        className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
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
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
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
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            {Math.round(
                              ((response.overallScore || 0) / 10) * 100
                            )}
                            %
                          </span>
                        </div>
                        {response.summary && (
                          <div className="text-xs text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700 p-2 rounded whitespace-normal break-words">
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
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-indigo-700 dark:text-indigo-300">
                    Technical Assessment Results
                  </h5>
                  <div className="space-y-3">
                    {techAssessments.map((response) => (
                      <div
                        key={response._id}
                        className="bg-white dark:bg-gray-800 p-3 rounded border border-indigo-200 dark:border-indigo-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
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
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
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
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
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
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 whitespace-normal break-words">
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

  // NEW: Component for Hired Documents & Professional Details
  const HiredDocumentDetailsSection = ({ candidateData }) => {
    const socialMediaHandles = candidateData?.social_media_handles || {};
    const organizations = candidateData?.organizations || [];
    const companyReferences = candidateData?.company_references || [];
    const hiredDocsPresent = candidateData?.hired_docs_present || false;

    const isCardCollapsed = isCollapsed(candidateData._id, "hiredDetails");

    // Check if we have any data to show
    const hasSocialMedia = Object.keys(socialMediaHandles).length > 0;
    const hasOrganizations = organizations.length > 0;
    const hasCompanyRefs = companyReferences.length > 0;

    // Only show if candidate has hired documents or any of the related fields
    if (
      !hiredDocsPresent &&
      !hasSocialMedia &&
      !hasOrganizations &&
      !hasCompanyRefs
    ) {
      return null;
    }

    // Get platform icon
    const getPlatformIcon = (platform) => {
      switch (platform.toLowerCase()) {
        case "linkedin":
          return <Linkedin className="h-3 w-3" />;
        case "facebook":
          return <Facebook className="h-3 w-3" />;
        case "instagram":
          return <Instagram className="h-3 w-3" />;
        case "twitter":
          return <Twitter className="h-3 w-3" />;
        case "youtube":
          return <Youtube className="h-3 w-3" />;
        default:
          return <Globe className="h-3 w-3" />;
      }
    };

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Professional Details
              <div className="flex gap-2 ml-2">
                {hasSocialMedia && (
                  <Badge variant="outline" className="text-xs">
                    {Object.keys(socialMediaHandles).length} Social
                  </Badge>
                )}
                {hasOrganizations && (
                  <Badge variant="outline" className="text-xs">
                    {organizations.length} Orgs
                  </Badge>
                )}
                {hasCompanyRefs && (
                  <Badge variant="outline" className="text-xs">
                    {companyReferences.length} Refs
                  </Badge>
                )}
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCollapse(candidateData._id, "hiredDetails")}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Social Media Handles */}
              {hasSocialMedia && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Social Media Handles
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(socialMediaHandles).map(
                      ([platform, handle]) => {
                        // ✅ Type assertion to string (safe since we know socialMediaHandles contains strings)
                        const handleValue = handle as string;

                        return (
                          <div
                            key={platform}
                            className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getPlatformIcon(platform)}
                              <div className="text-xs font-medium text-purple-800 dark:text-purple-200 capitalize">
                                {platform}
                              </div>
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-300 break-all">
                              {handleValue &&
                              typeof handleValue === "string" &&
                              handleValue.startsWith("http") ? (
                                <a
                                  href={handleValue}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                  View Profile{" "}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span>{handleValue}</span>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Organizations */}
              {hasOrganizations && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Previous Organizations ({organizations.length})
                  </h5>
                  <div className="space-y-2">
                    {organizations.map((org, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700"
                      >
                        <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                          {org.name}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {org.appointment_letter && (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/40 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(org.appointment_letter, "_blank");
                                toast.success("Opening appointment letter...");
                              }}
                              title="Click to view appointment letter"
                            >
                              <div className="flex items-center gap-1">
                                📄 Appointment
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            </Badge>
                          )}
                          {org.relieving_letter && (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/40 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(org.relieving_letter, "_blank");
                                toast.success("Opening relieving letter...");
                              }}
                              title="Click to view relieving letter"
                            >
                              <div className="flex items-center gap-1">
                                📋 Relieving
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            </Badge>
                          )}
                          {!org.appointment_letter && !org.relieving_letter && (
                            <span className="text-xs text-gray-500 italic">
                              No documents
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company References */}
              {hasCompanyRefs && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Company References ({companyReferences.length})
                  </h5>
                  <div className="space-y-2">
                    {companyReferences.map((ref, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700"
                      >
                        <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                          {ref.company_name}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="break-all">{ref.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{ref.phone}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hired Documents Status Summary */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">
                    Hired Documents Status
                  </span>
                </div>
                <Badge
                  variant={hiredDocsPresent ? "default" : "secondary"}
                  className="text-xs"
                >
                  {hiredDocsPresent ? "✓ Complete" : "⏳ Pending"}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {hiredDocsPresent
                  ? "All hiring documentation has been submitted and processed."
                  : "Waiting for candidate to submit hiring documentation."}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  // ENHANCED: Component for Documents with better separation
  const DocumentsSection = ({ candidateData }) => {
    const regularDocs = candidateData?.documents || [];
    const hiredDocs = candidateData?.hired_docs || [];
    const hiredDocsPresent = candidateData?.hired_docs_present || false;

    const isCardCollapsed = isCollapsed(candidateData._id, "documents");

    // Show section if there are any documents or if hired docs are expected
    const hasAnyDocs = regularDocs.length > 0 || hiredDocs.length > 0;
    if (!hasAnyDocs && !hiredDocsPresent) return null;

    const allDocuments = [...regularDocs, ...hiredDocs];
    if (allDocuments.length === 0) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Documents
              <Badge variant="secondary" className="text-xs ml-2">
                {allDocuments.length} Total
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
            {/* All Documents in Single Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allDocuments.map((doc) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                  doc.documenturl
                );
                const isPDF = /\.pdf$/i.test(doc.documenturl);

                return (
                  <div
                    key={doc._id}
                    className="group relative border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 cursor-pointer"
                    onClick={() => window.open(doc.documenturl, "_blank")}
                  >
                    {/* Only Verification Status Badge - No Type Badge */}
                    <div className="absolute top-2 right-2 z-20">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium shadow-sm ${
                          doc.isVerified
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50"
                            : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {doc.isVerified ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <ClockIcon className="w-3 h-3" />
                          )}
                          <span>{doc.isVerified ? "Verified" : "Pending"}</span>
                        </div>
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                          onClick={(e) =>
                            copyToClipboard(doc.documenturl, doc._id, e)
                          }
                          title="Copy document link"
                        >
                          {copiedDocId === doc._id ? (
                            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(doc.documenturl, "_blank");
                          }}
                          title="View document"
                        >
                          <Eye className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Document Preview - Unified styling */}
                    <div className="h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <img
                          src={doc.documenturl}
                          alt={doc.documenttype}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : isPDF ? (
                        <div className="flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 w-full h-full">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-xs text-center px-2 whitespace-normal break-words">
                            {doc.documenttype}
                          </span>
                          <span className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            PDF Document
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-xs text-center px-2 whitespace-normal break-words">
                            {doc.documenttype}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Document Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium capitalize truncate text-center whitespace-normal break-words text-gray-900 dark:text-gray-100">
                        {doc.documenttype}
                      </p>
                      <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="whitespace-normal break-words text-center">
                          {doc.uploadedat
                            ? formatDate(doc.uploadedat)
                            : "Click to view"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {allDocuments.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No documents available</p>
              </div>
            )}
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

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[40px]">
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
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[35px]">
                Stage:
              </span>
              <Select
                defaultValue="manager"
                value={stageFilter}
                onValueChange={setStageFilter}
              >
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
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[35px]">
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
                  {roles.map((role) => (
                    <SelectItem key={role} value={role} className="text-xs">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[35px]">
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
            <span className="text-xs text-gray-600 dark:text-gray-400">
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
              <CardHeader className="pb-3 px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Candidate Info - Mobile Optimized */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-18 ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden rounded-md flex-shrink-0">
                        <AvatarImage src={candidate.profile_photo_url?.url} />
                        <AvatarFallback className="text-xs sm:text-sm font-medium">
                          {candidate.first_name?.[0] || "U"}
                          {candidate.last_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
                        {candidate.email_verified && (
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full flex items-center justify-center">
                            <ShieldCheckIcon className="w-1 h-1 sm:w-1.5 sm:h-1.5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Name and Badges - Mobile Stacked */}
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                        <h3
                          className={`text-sm sm:text-base md:text-lg font-semibold break-words ${
                            candidate.status === "rejected"
                              ? "line-through text-red-600 dark:text-red-400 opacity-75"
                              : candidate.status === "hired"
                              ? "text-green-700 dark:text-green-400 font-bold animate-pulse"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {candidate.status === "hired" && "🎉 "}
                          {candidate.first_name} {candidate.last_name || "User"}
                        </h3>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge
                            className={`${getStatusColor(
                              candidate.status
                            )} text-xs px-2 py-0.5`}
                          >
                            {candidate.status === "active" ? (
                              <Circle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            ) : candidate.status === "hold" ? (
                              <CirclePause className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            ) : candidate.status === "rejected" ? (
                              <CircleX className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            ) : candidate.status === "hired" ? (
                              <CircleCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            ) : null}
                            {candidate.status.toUpperCase()}
                          </Badge>
                          <Badge
                            className={`${getStageColor(
                              candidate.current_stage
                            )} text-xs px-2 py-0.5`}
                          >
                            <StageCircle
                              currentStage={candidate.current_stage}
                            />
                            Stage-{candidate.current_stage?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Contact Info - Mobile Single Column */}
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="break-all truncate">
                            {candidate.email || "No email"}
                          </span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="break-words">
                              {candidate.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Job Info */}
                      <div className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 break-words">
                        {candidate.applied_job?.title || "No job specified"}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats and Actions - Mobile Optimized */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 shrink-0">
                    {/* Mobile Stats Row */}
                    <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
                      <Button
                        variant={hasResume(candidate) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleViewResume(candidate)}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-8 text-xs sm:text-sm"
                        disabled={!hasResume(candidate)}
                      >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          {hasResume(candidate) ? "View Resume" : "No Resume"}
                        </span>
                        <span className="sm:hidden">
                          {hasResume(candidate) ? "Resume" : "No CV"}
                        </span>
                      </Button>

                      <div className="text-right text-xs sm:text-sm">
                        <div className="text-muted-foreground">Pending for</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {metrics.current_stage_duration} days
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCardExpansion(candidate._id)}
                        disabled={isLoadingDetail}
                        className="px-2 h-8"
                      >
                        {isLoadingDetail ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : isExpanded ? (
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content - Mobile Optimized */}
              {isExpanded && (
                <CardContent className="pt-0 px-3 sm:px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-6 sm:py-8">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mr-2" />
                      <span className="text-sm sm:text-base">
                        Loading candidate details...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
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

                      {/* Assessment Results & Scores */}
                      <AssessmentResultsSection
                        detailedCandidate={detailedCandidate}
                      />

                      {/* Documents Section */}
                      <DocumentsSection candidateData={candidateData} />

                      {/* NEW: Hired Document Details Section */}
                      <HiredDocumentDetailsSection
                        candidateData={candidateData}
                      />

                      <GloryDisplay glory={candidate.glory} />

                      {/* Stage History & Internal Feedback - Mobile Optimized */}
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <Card>
                          <CardHeader className="pb-2 px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 text-sm sm:text-base min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  <span>Stage History & Feedback</span>
                                </div>
                                {/* Badge counts - Mobile Stack */}
                                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
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
                                className="text-xs shrink-0 h-8 px-2 min-w-[60px]"
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
                            <CardContent className="pt-2 px-3 sm:px-6 pb-4">
                              {/* Grid layout - Single column on mobile, two columns on large screens */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                {/* Stage History Section - Mobile Optimized */}
                                <div>
                                  {detailedCandidate?.stage_history &&
                                    detailedCandidate.stage_history.length >
                                      0 && (
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                          Recent Stage Changes
                                        </h6>
                                        <div className="space-y-2">
                                          {detailedCandidate.stage_history.map(
                                            (stage) => (
                                              <div
                                                key={stage._id}
                                                className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                                              >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs break-words">
                                                      {stage.from_stage ||
                                                        "Start"}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0" />
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs break-words">
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
                                                  <div className="text-xs text-gray-600 dark:text-gray-400 italic break-words">
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

                                {/* Internal Feedback Section - Mobile Optimized */}
                                <div>
                                  {candidateData.internal_feedback &&
                                    candidateData.internal_feedback.length >
                                      0 && (
                                      <div>
                                        <h6 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                                          Internal Feedback
                                        </h6>
                                        <div className="space-y-2">
                                          {candidateData.internal_feedback.map(
                                            (feedback) => (
                                              <div
                                                key={feedback._id}
                                                className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-100 dark:border-orange-800"
                                              >
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                                                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200 break-words">
                                                    {feedback.feedback_by.name}
                                                  </span>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs self-start sm:self-center"
                                                  >
                                                    {formatDate(
                                                      feedback.feedback_at
                                                    )}
                                                  </Badge>
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">
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
