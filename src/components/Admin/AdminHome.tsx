import { useEffect, useState } from "react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  Search,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import GloryDisplay from "../GloryDisplay";
import { differenceInYears } from "date-fns";

// Types
type Candidate = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
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
    };
  };
  current_stage:
    | "registered"
    | "hr"
    | "assessment"
    | "tech"
    | "manager"
    | "feedback";
  status:
    | "active"
    | "inactive"
    | "withdrawn"
    | "rejected"
    | "hired"
    | "deleted";
  email_verified: boolean;
  flagged_for_deletion: boolean;
  shortlisted: boolean;
  registration_date: string;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
  documents?: Array<{
    _id: string;
    documenttype: string;
    documenturl: string;
    isVerified: boolean;
    uploadedat?: string;
  }>;
  hired_docs?: Array<{
    _id: string;
    documenttype: string;
    documenturl: string;
    isVerified: boolean;
    uploadedat: string;
  }>;
  glory?: { [role: string]: any };
  hrQuestionnaire?: Array<{
    _id: string;
    status: string;
    assigned_by: { _id: string; name: string; role: string };
    due_at: string;
  }>;
  assessments?: Array<{
    _id: string;
    status: string;
    assigned_by: { _id: string; name: string; role: string };
    due_at: string;
  }>;
  interviews?: Array<{
    _id: string;
    title: string;
    status: string;
    type: string;
    meeting_link?: string;
    platform?: string;
    description?: string;
    interviewers: Array<{ _id: string; name: string; role: string }>;
    scheduled_by: { _id: string; name: string; email: string; role: string };
  }>;
  stage_history?: Array<{
    _id: string;
    from_stage?: string;
    to_stage: string;
    changed_by?: { _id: string; name: string; email?: string; role: string };
    action: string;
    remarks: string;
    changed_at: string;
  }>;
  internal_feedback?: Array<{
    _id: string;
    feedback_by: { _id: string; name: string; role: string };
    feedback: string;
    feedback_at?: string;
  }>;
};

const AdminHome = () => {
  // Basic state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Deletion state
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(
    null
  );
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);
  function truncateTag(tag: string, isreq=false, maxLength = 12) {
    if (tag.length <= maxLength) return tag;
    return tag.slice(0, maxLength) + (isreq ? "" : "...");
  }
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
  const isCompact = useIsCompact(1220);
  const [personalCollapsed, setPersonalInfoCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [documentCollapsed, setDocumentCollapsed] = useState(false);
  

  // Helper Functions
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "withdrawn":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "hired":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      case "deleted":
        return "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Data Fetching
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/org/candidates");
      setCandidates(response.data.data || []);
      setFilteredCandidates(response.data.data || []);
    } catch (error) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

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

  // Delete candidate handler
  const handleDeleteCandidate = async () => {
    if (!candidateToDelete) return;

    try {
      setIsDeletingCandidate(true);
      const response = await api.delete(
        `/org/admin/delete-candidate/${candidateToDelete._id}`
      );

      if (response.data.success) {
        toast.success("Candidate deleted successfully");
        setDeletionDialogOpen(false);
        setCandidateToDelete(null);
        await fetchCandidates(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete candidate"
      );
    } finally {
      setIsDeletingCandidate(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    let filtered = candidates;

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

    if (stageFilter !== "all") {
      filtered = filtered.filter(
        (candidate) => candidate.current_stage === stageFilter
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "shortlisted") {
        filtered = filtered.filter(
          (candidate) => candidate.shortlisted === true
        );
      } else if (statusFilter === "flagged-deletion") {
        filtered = filtered.filter(
          (candidate) => candidate.flagged_for_deletion === true
        );
      } else {
        filtered = filtered.filter(
          (candidate) => candidate.status === statusFilter
        );
      }
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, stageFilter, statusFilter]);

  // Statistics
  const stats = {
    total: candidates.length,
    active: candidates.filter((c) => c.status === "active").length,
    flagged_for_deletion: candidates.filter((c) => c.flagged_for_deletion)
      .length,
    hired: candidates.filter((c) => c.status === "hired").length,
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
      <Toaster position="bottom-right" containerStyle={{ zIndex: 9999 }} />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Candidate Management
        </h1>
        <p className="text-muted-foreground">
          View and manage all candidates in the system (Admin View)
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Candidates
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Candidates
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.hired}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Flagged for Deletion
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.flagged_for_deletion}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>All Candidates</CardTitle>
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
                <SelectItem value="flagged-deletion">
                  🚨 Flagged for Deletion
                </SelectItem>
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
                  <TableHead>{isCompact ? <span className="flex flex-col"><span>{"Current"}</span><span>{"Stage"}</span></span> : "Current Stage"}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow
                      key={candidate._id}
                      onClick={() => fetchCandidateDetails(candidate._id)}
                      className="cursor-pointer hover:bg-muted transition-colors"
                    >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={candidate.profile_photo_url?.url} />
                          <AvatarFallback>
                            {candidate.first_name?.[0]}
                            {candidate.last_name?.[0]}
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
                    <TableCell>
                      <div>
                        <div className="text-sm">{candidate.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {candidate.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStageColor(candidate.current_stage)}
                        title={candidate.current_stage} // show full text on hover
                      >
                        {isCompact
                          ? truncateTag(
                              candidate.current_stage?.replace("_", " ").toUpperCase() || "",
                              true,
                              3
                            )
                          : candidate.current_stage?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge className={getStatusColor(candidate.status)}>
                        {candidate.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {candidate.shortlisted && (
                          <Badge variant="secondary" className="text-xs">
                            {!isCompact ? "⭐ Shortlisted" : "⭐"}
                          </Badge>
                        )}
                        {candidate.flagged_for_deletion && (
                          <Badge variant="destructive" className="text-xs">
                            {!isCompact ? "🚨 Flagged" : "🚨"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {candidate.flagged_for_deletion ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              setCandidateToDelete(candidate);
                              setDeletionDialogOpen(true);
                              e.stopPropagation();
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        ): "None"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No candidates found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Details Dialog - Read Only */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Candidate Details (Admin View)
            </DialogTitle>
            <DialogDescription>
              Read-only view of candidate information and application history
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {selectedCandidate && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle>Personal Information</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPersonalInfoCollapsed(!personalCollapsed)
                        }
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
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 border-2  sm:p-4 rounded-xl w-full lg:w-auto">
                          <Avatar className="w-40 h-37 ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden rounded-md flex-shrink-0">
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
                            <p className="text-lg sm:text-xs font-sm dark:text-purple-400 mb-2">
                              <strong>
                                Applied For -{" "}
                                {selectedCandidate.applied_job?.name}
                              </strong>
                            </p>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {selectedCandidate.first_name}{" "}
                              {selectedCandidate.last_name}
                            </h3>
                            <div className="flex justify-center sm:justify-start">
                              <span className="text-lg sm:text-xs font-sma dark:text-purple-400 mb-2">
                                <strong>Current Stage -</strong>
                              </span>
                              <Badge
                                className={getStageColor(
                                  selectedCandidate.current_stage
                                )}
                                variant="secondary"
                              >
                                {selectedCandidate.current_stage?.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <div className="text-xs text-gray-600">
                                <strong>Status:</strong>{" "}
                                <span
                                  className={`inline-flex items-center gap-1 px-1 ${
                                    selectedCandidate.status.toLowerCase() ===
                                    "hired"
                                      ? "text-green-700"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {selectedCandidate.status.toUpperCase()}
                                  {selectedCandidate.status.toLowerCase() ===
                                    "hired" && <Check className="w-3 h-3" />}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="break-all">
                                📧 {selectedCandidate.email}
                              </span>
                              <span>📱 {selectedCandidate.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Applied Position */}
                        <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                          {/* Personal Details Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(selectedCandidate.date_of_birth)}
                              </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                                REGISTRATION
                              </p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                                {formatDate(
                                  selectedCandidate.registration_date
                                )}
                              </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                                SHORTLISTED
                              </p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCandidate.shortlisted
                                  ? "✅ Yes"
                                  : "❌ No"}
                              </p>
                            </div>
                          </div>

                          {/* Address */}
                          {selectedCandidate.address && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide">
                                Address
                              </p>
                              <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">
                                {selectedCandidate.address}
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            {selectedCandidate.applied_job?.description
                              ?.location && (
                              <div>
                                📍{" "}
                                {
                                  selectedCandidate.applied_job.description
                                    .location
                                }
                              </div>
                            )}
                            {selectedCandidate.applied_job?.description
                              ?.country && (
                              <div>
                                🌍{" "}
                                {
                                  selectedCandidate.applied_job.description
                                    .country
                                }
                              </div>
                            )}
                            {selectedCandidate.applied_job?.description
                              ?.time && (
                              <div>
                                ⏰{" "}
                                {selectedCandidate.applied_job.description.time}
                              </div>
                            )}
                            {selectedCandidate.applied_job?.description
                              ?.expInYears && (
                              <div>
                                💼{" "}
                                {
                                  selectedCandidate.applied_job.description
                                    .expInYears
                                }
                              </div>
                            )}
                            {selectedCandidate.applied_job?.description
                              ?.salary && (
                              <div className="sm:col-span-2">
                                💰{" "}
                                {
                                  selectedCandidate.applied_job.description
                                    .salary
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedCandidate.glory && (
                  <GloryDisplay glory={selectedCandidate.glory} />
                )}

                {/* Documents Section - Read Only */}
                {selectedCandidate.documents &&
                  selectedCandidate.documents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <CardTitle>
                            Documents ({selectedCandidate.documents.length})
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDocumentCollapsed(!documentCollapsed)
                            }
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className="text-sm font-medium">
                              {documentCollapsed ? "Show" : "Hide"}
                            </span>
                            {documentCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      {(!documentCollapsed && <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedCandidate.documents.map((doc) => (
                            <div
                              key={doc._id}
                              className={`border rounded-lg p-4 ${
                                doc.isVerified
                                  ? "bg-green-50 border-green-200 dark:bg-green-900/10"
                                  : "bg-gray-50 border-gray-200 dark:bg-gray-800"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium capitalize">
                                  {doc.documenttype}
                                </h3>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() =>
                                  window.open(doc.documenturl, "_blank")
                                }
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Document
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>)}
                    </Card>
                  )}

                {/* Stage History */}
                {selectedCandidate.stage_history &&
                  selectedCandidate.stage_history.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <CardTitle>Stage History</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setHistoryCollapsed(!historyCollapsed)
                            }
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className="text-sm font-medium">
                              {historyCollapsed ? "Show" : "Hide"}
                            </span>
                            {historyCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {!historyCollapsed &&
                            selectedCandidate.stage_history.map(
                              (stage: any) => (
                                <div
                                  key={stage._id}
                                  className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 hover:shadow transition"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-semibold capitalize">
                                      {stage.from_stage
                                        ? `${stage.from_stage} → ${stage.to_stage}`
                                        : stage.to_stage}
                                    </p>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(stage.changed_at)}
                                    </span>
                                  </div>

                                  {stage.changed_by && (
                                    <p className="text-xs text-gray-600">
                                      Changed by:{" "}
                                      <span className="font-medium">
                                        {stage.changed_by.name}
                                      </span>{" "}
                                      ({stage.changed_by.email})
                                    </p>
                                  )}

                                  {stage.remarks && (
                                    <p className="text-xs text-gray-600 mt-1 italic">
                                      "{stage.remarks}"
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            {selectedCandidate?.flagged_for_deletion && (
              <Button
                variant="destructive"
                onClick={(e) => {
                  setDialogOpen(false);
                  setCandidateToDelete(selectedCandidate);
                  setDeletionDialogOpen(true);
                  e.stopPropagation();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Process Deletion Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Dialog */}
      <AlertDialog
        open={deletionDialogOpen}
        onOpenChange={setDeletionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to permanently delete the candidate account for{" "}
                <strong>
                  {candidateToDelete?.first_name} {candidateToDelete?.last_name}
                </strong>{" "}
                ({candidateToDelete?.email}).
              </p>
              <p className="text-red-600 font-semibold">
                ⚠️ This action cannot be undone. All candidate data, documents,
                assessments, and history will be permanently removed.
              </p>
              <p>
                The candidate has requested deletion of their account. Are you
                sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={(e) => {
                setDeletionDialogOpen(false);
                setCandidateToDelete(null);
                e.stopPropagation();
              }}
              disabled={isDeletingCandidate}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCandidate}
              disabled={isDeletingCandidate}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingCandidate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Permanently Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHome;
