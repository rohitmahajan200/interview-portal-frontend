import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Edit,
  Trash,
  Search,
  Eye,
  Users,
  Clock,
  CheckCircle,
  X,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

// Validation Schemas
const questionnaireSchema = z.object({
  candidates: z
    .array(z.string().length(24, "Invalid candidate ID"))
    .min(1, "Select at least one candidate"),
  assigned_questions: z
    .array(z.string().length(24, "Invalid question ID"))
    .min(1, "Select at least one question"),
  days_to_complete: z
    .number()
    .int()
    .min(1)
    .max(30, "Days must be between 1-30"),
});

const questionnaireUpdateSchema = z.object({
  assigned_questions: z
    .array(z.string().length(24, "Invalid question ID"))
    .min(1, "Select at least one question"),
  due_at: z.string().min(1, "Due date is required"),
});

type CreateFormData = z.infer<typeof questionnaireSchema>;
type EditFormData = z.infer<typeof questionnaireUpdateSchema>;

// Types
interface Question {
  _id: string;
  question: string;
  input_type: "text" | "audio" | "date";
  tags?: string[];
}

interface Candidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  shortlisted: boolean;
  profile_photo_url?: {
    url: string;
    publicId: string;
    _id: string;
  };
  applied_job: {
    _id: string;
    name: string;
    description:string;
      time: string;
      country: string;
      location: string;
      expInYears: string;
      salary: string;
      jobId: string;
      title?:string;
  };
  documents?: Array<{
    _id: string;
    document_type: string;
    document_url: string;
  }>;
  assessments?: string[];
  hrQuestionnaire?: string[];
  interviews?: string[];
  default_hr_responses?: Array<{
    _id: string;
    question_text: string;
    response: string | string[];
    input_type: "text" | "audio" | "date" | "mcq" | "checkbox";
  }>;
  stage_history?: string[];
  current_stage:
    | "registered"
    | "hr"
    | "assessment"
    | "tech"
    | "manager"
    | "feedback"
    | "shortlisted";
  status:
    | "active"
    | "inactive"
    | "withdrawn"
    | "rejected"
    | "hired"
    | "deleted";
  email_verified: boolean;
  flagged_for_deletion: boolean;
  registration_date: string;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  otp?: {
    code: string;
    expiresAt: string;
    purpose: string;
  };
}

interface HrQuestionnaire {
  _id: string;
  candidate: Candidate;
  assigned_questions: Question[];
  assigned_by: {
    _id: string;
    name: string;
    email: string;
  };
  due_at: string;
  status: "pending" | "submitted" | "expired";
  createdAt: string;
  updatedAt: string;
}

const HRQuestionnaireBuilder = () => {
  // State
  const [questionnaires, setQuestionnaires] = useState<HrQuestionnaire[]>([]);
  const [filteredQuestionnaires, setFilteredQuestionnaires] = useState<
    HrQuestionnaire[]
  >([]);
  // Add these state variables
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const [selectedJobForAutoSelect, setSelectedJobForAutoSelect] =
    useState<string>("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] =
    useState<HrQuestionnaire | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<HrQuestionnaire | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  // Add these helper functions
  const getUniqueJobs = () => {
    const jobMap = new Map();
    getAvailableCandidates().forEach((candidate) => {
      if (candidate.applied_job && candidate.applied_job._id) {
        jobMap.set(candidate.applied_job._id, candidate.applied_job);
      }
    });
    return Array.from(jobMap.values());
  };

  const selectCandidatesByJob = (
    jobId: string,
    field: { onChange: (value: string[]) => void }
  ) => {
    if (!jobId) {
      field.onChange([]);
      return;
    }

    const candidatesForJob = getAvailableCandidates()
      .filter((candidate) => candidate.applied_job?._id === jobId)
      .map((candidate) => candidate._id);

    field.onChange(candidatesForJob);
    toast.success(
      `Selected ${candidatesForJob.length} candidates for this job`
    );
  };

  const clearJobSelection = () => {
    setSelectedJobForAutoSelect("");
  };

  // Helper function to extract unique tags
  const getUniqueTags = () => {
    const tagSet = new Set<string>();
    questions.forEach((question) => {
      question.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // Helper function to toggle tag selection
  const toggleTagSelection = (tag: string, field: any) => {
    const newSelectedTags = new Set(selectedTags);
    const currentSelectedQuestions = new Set(field.value || []);

    if (selectedTags.has(tag)) {
      // Remove tag and all its questions
      newSelectedTags.delete(tag);
      questions.forEach((question) => {
        if (question.tags?.includes(tag)) {
          currentSelectedQuestions.delete(question._id);
        }
      });
    } else {
      // Add tag and all its questions
      newSelectedTags.add(tag);
      questions.forEach((question) => {
        if (question.tags?.includes(tag)) {
          currentSelectedQuestions.add(question._id);
        }
      });
    }

    setSelectedTags(newSelectedTags);
    field.onChange(Array.from(currentSelectedQuestions));
  };

  // Create Form
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      candidates: [],
      assigned_questions: [],
      days_to_complete: 7,
    },
  });

  // Edit Form
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(questionnaireUpdateSchema),
    defaultValues: {
      assigned_questions: [],
      due_at: "",
    },
  });

  const isEditing = !!editingQuestionnaire;

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [questionnaireRes, questionsRes, candidatesRes] = await Promise.all(
        [
          api.get("/org/hr-questionnaires"),
          api.get("/org/hr-questions"),
          api.get("/org/candidates"),
        ]
      );

      setQuestionnaires(questionnaireRes.data.data || []);
      setFilteredQuestionnaires(questionnaireRes.data.data || []);
      setQuestions(questionsRes.data.data || []);
      setCandidates(candidatesRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter questionnaires
  useEffect(() => {
    let filtered = questionnaires;

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.candidate.first_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          q.candidate.last_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          q.candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }

    setFilteredQuestionnaires(filtered);
  }, [questionnaires, searchTerm, statusFilter]);

  // Dialog handlers
  const openCreateDialog = () => {
    setEditingQuestionnaire(null);
    setSelectedTags(new Set());
    createForm.reset({
      candidates: [],
      assigned_questions: [],
      days_to_complete: 7,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (questionnaire: HrQuestionnaire,e) => {
    
    setEditingQuestionnaire(questionnaire);
    setSelectedTags(new Set());
    
    // Format the due date for the input
    const dueDate = new Date(questionnaire.due_at);
    const formattedDate = dueDate.toISOString().split("T")[0];

    editForm.reset({
      assigned_questions: questionnaire.assigned_questions.map((q) => q._id),
      due_at: formattedDate,
    });
    setDialogOpen(true);
    e.stopPropagation();
  };

  const openViewDialog = (questionnaire: HrQuestionnaire,e) => {
    setSelectedQuestionnaire(questionnaire);
    setViewDialogOpen(true);
    e.stopPropagation();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingQuestionnaire(null);
    setSelectedTags(new Set());
    createForm.reset();
    editForm.reset();
  };

  const closeViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedQuestionnaire(null);
  };
  // Function to open delete confirmation dialog
  const openDeleteDialog = (id: string, candidateName: string,e) => {
    setDeleteTargetId(id);
    setDeleteTargetName(candidateName);
    setDeleteDialogOpen(true);
    e.stopPropagation();
  };

  // Function to handle confirmed deletion
  const handleDeleteConfirmed = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleteLoadingId(deleteTargetId);
      await api.delete(`/org/hr-questionnaires/${deleteTargetId}`);

      toast.success("Questionnaire deleted successfully");
      setDeleteDialogOpen(false);
      fetchAllData();
    } catch (error: any) {
      console.error("Failed to delete questionnaire:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete questionnaire"
      );
    } finally {
      setDeleteLoadingId(null);
      setDeleteTargetId(null);
      setDeleteTargetName("");
    }
  };

  // Function to cancel deletion
  const handleDeleteCancelled = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
    setDeleteTargetName("");
  };

  // Submit handlers
  const onCreateSubmit = async (data: CreateFormData) => {
    try {
      setSubmitting(true);
      const assignments = data.candidates.map((candidateId) => ({
        candidate: candidateId,
        question_ids: data.assigned_questions,
        days_to_complete: data.days_to_complete,
      }));

      const response = await api.post("/org/hr-questionnaires/assign", {
        assignments,
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Show individual failure messages if any
        if (response.data.data.failed && response.data.data.failed.length > 0) {
          setTimeout(() => {
            response.data.data.failed.forEach(
              (failure: { candidate: string; error: string }) => {
                toast.error(`Failed: ${failure.error}`, { duration: 4000 });
              }
            );
          }, 500);
        }
      } else {
        toast.error(response.data.message || "Failed to assign questionnaires");
      }

      closeDialog();
      fetchAllData();
    } catch (error: any) {
      console.error("Failed to create questionnaire:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create questionnaire"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data: EditFormData) => {
    if (!editingQuestionnaire) return;

    try {
      setSubmitting(true);
      await api.put(`/org/hr-questionnaires/${editingQuestionnaire._id}`, {
        assigned_questions: data.assigned_questions,
        due_at: new Date(data.due_at).toISOString(),
      });

      toast.success("Questionnaire updated successfully");
      closeDialog();
      fetchAllData();
    } catch (error: any) {
      console.error("Failed to update questionnaire:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update questionnaire"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get available candidates (those without questionnaires)
  const getAvailableCandidates = () => {
    return candidates.filter(
      (candidate) =>
        !candidate.hrQuestionnaire || candidate.hrQuestionnaire.length === 0
    );
  };

  // Statistics
  const stats = {
    total: questionnaires.length,
    pending: questionnaires.filter((q) => q.status === "pending").length,
    submitted: questionnaires.filter((q) => q.status === "submitted").length,
    expired: questionnaires.filter((q) => q.status === "expired").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            HR Questionnaire Builder
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Assign and manage questionnaires for candidates
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          disabled={getAvailableCandidates().length === 0}
          className="w-full sm:w-auto dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground"
        >
          <Plus className="mr-2 w-4 h-4" />
          <span className="sm:hidden">Assign</span>
          <span className="hidden sm:inline">Assign Questionnaire</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">
                  Total Questionnaires
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.submitted}
                </div>
                <div className="text-sm text-muted-foreground">Submitted</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.expired}
                </div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by candidate name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">submitted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questionnaires Table */}
      <Card className="flex overflow-y-auto mb-7">
        <CardHeader>
          <CardTitle>
            Questionnaires ({filteredQuestionnaires.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    {!isCompact && <TableHead>Questions</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    {!isCompact && <TableHead>Assigned By</TableHead>}
                    {!isCompact && <TableHead>Created</TableHead>}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestionnaires.map((questionnaire) => (
                    <TableRow
                        key={questionnaire._id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={(e) => openViewDialog(questionnaire,e)}
                      >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                questionnaire.candidate.profile_photo_url?.url
                              }
                            />
                            <AvatarFallback>
                              {questionnaire.candidate.first_name[0]}
                              {questionnaire.candidate.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {questionnaire.candidate.first_name}{" "}
                              {questionnaire.candidate.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {questionnaire.candidate.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {!isCompact && <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {questionnaire.assigned_questions
                            .slice(0, 2)
                            .map((question) => (
                              <Badge
                                key={question._id}
                                variant="outline"
                                className="text-xs"
                              >
                                {question.input_type.toUpperCase()}
                              </Badge>
                            ))}
                          {questionnaire.assigned_questions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{questionnaire.assigned_questions.length - 2}{" "}
                              more
                            </Badge>
                          )}
                        </div>
                      </TableCell>}
                      <TableCell>
                        <Badge className={getStatusColor(questionnaire.status)}>
                          {questionnaire.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(questionnaire.due_at)}
                      </TableCell>
                      {!isCompact && <TableCell className="text-sm">
                        {questionnaire.assigned_by.name}
                      </TableCell>}
                      {!isCompact && <TableCell className="text-sm text-muted-foreground">
                        {formatDate(questionnaire.createdAt)}
                      </TableCell>}
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => openEditDialog(questionnaire,e)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) =>
                              openDeleteDialog(
                                questionnaire._id,
                                `${questionnaire.candidate.first_name} ${questionnaire.candidate.last_name}`,
                                e
                              )
                            }
                            disabled={deleteLoadingId === questionnaire._id}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredQuestionnaires.length === 0 && !loading && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all"
                      ? "No questionnaires match your filters."
                      : "No questionnaires found. Create your first questionnaire!"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>
              {isEditing ? "Edit Questionnaire" : "Assign New Questionnaire"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the questionnaire details and questions"
                : "Select candidates and assign questions to create new questionnaires"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="">
              {/* Create Form */}
              {!isEditing && (
                <form
                  onSubmit={createForm.handleSubmit(onCreateSubmit)}
                  className=""
                >
                  {/* Candidates Selection */}
                  <div className="space-y-3">
                    <Label>
                      Select Candidates ({getAvailableCandidates().length}{" "}
                      available)
                    </Label>

                    {/* Job Auto-Select Section - NEW */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Label className="text-sm font-medium mb-2 block">
                        Quick Select by Job Applied:
                      </Label>
                      <div className="flex items-center gap-2">
                        <Controller
                          name="candidates"
                          control={createForm.control}
                          render={({ field }) => (
                            <Select
                              value={selectedJobForAutoSelect}
                              onValueChange={(jobId) => {
                                setSelectedJobForAutoSelect(jobId);
                                selectCandidatesByJob(jobId, field);
                              }}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select a job to auto-select candidates" />
                              </SelectTrigger>
                              <SelectContent>
                                {getUniqueJobs().map((job) => {
                                  const candidateCount =
                                    getAvailableCandidates().filter(
                                      (c) => c.applied_job?._id === job._id
                                    ).length;
                                  return (
                                    <SelectItem key={job._id} value={job._id}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{job.title}</span>
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 text-xs"
                                        >
                                          {candidateCount} candidates
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        />

                        {selectedJobForAutoSelect && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              clearJobSelection();
                              createForm.setValue("candidates", []);
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a job to automatically choose all candidates who
                        applied for that position
                      </p>
                    </div>

                    {/* Rest of your existing candidate selection */}
                    <Controller
                      name="candidates"
                      control={createForm.control}
                      render={({ field }) => (
                        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                          {/* Show selected job info if any */}
                          {selectedJobForAutoSelect && (
                            <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700 dark:text-green-300">
                                  Auto-selected candidates for:{" "}
                                  {
                                    getUniqueJobs().find(
                                      (j) => j._id === selectedJobForAutoSelect
                                    )?.name
                                  }
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            {getAvailableCandidates().length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">
                                No candidates available for assignment
                              </p>
                            ) : (
                              getAvailableCandidates().map((candidate) => {
                                const isChecked =
                                  field.value?.includes(candidate._id) || false;
                                const isJobMatch =
                                  selectedJobForAutoSelect &&
                                  candidate.applied_job?._id ===
                                    selectedJobForAutoSelect;

                                return (
                                  <div
                                    key={candidate._id}
                                    className={`flex items-start space-x-3 p-2 rounded ${
                                      isJobMatch
                                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                        : ""
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([
                                            ...currentValue,
                                            candidate._id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter(
                                              (id: string) =>
                                                id !== candidate._id
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <div className="flex items-center space-x-3 flex-1">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage
                                          src={candidate.profile_photo_url?.url}
                                        />
                                        <AvatarFallback>
                                          {candidate.first_name[0]}
                                          {candidate.last_name[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium">
                                          {candidate.first_name}{" "}
                                          {candidate.last_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground truncate">
                                          {candidate.email}
                                        </div>
                                        {/* Show applied job info */}
                                        {candidate.applied_job && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {candidate.applied_job.title}
                                            </Badge>
                                            {isJobMatch && (
                                              <Badge
                                                variant="default"
                                                className="text-xs bg-blue-600"
                                              >
                                                ✓ Job Match
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    />
                    {createForm.formState.errors.candidates && (
                      <p className="text-red-600 text-sm">
                        {createForm.formState.errors.candidates.message}
                      </p>
                    )}
                  </div>

                  {/* Questions Selection for Create */}
                  <div className="space-y-3">
                    <Label>Select Questions</Label>

                    {/* Tag Selection */}
                    {getUniqueTags().length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">
                          Quick Select by Tags:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueTags().map((tag) => (
                            <Controller
                              key={tag}
                              name="assigned_questions"
                              control={createForm.control}
                              render={({ field }) => {
                                const isTagSelected = selectedTags.has(tag);
                                return (
                                  <Button
                                    type="button"
                                    variant={
                                      isTagSelected ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                      toggleTagSelection(tag, field)
                                    }
                                    className="text-xs"
                                  >
                                    {isTagSelected && "✓ "}
                                    {tag}
                                    <Badge
                                      variant="secondary"
                                      className="ml-1 text-xs"
                                    >
                                      {
                                        questions.filter((q) =>
                                          q.tags?.includes(tag)
                                        ).length
                                      }
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
                      control={createForm.control}
                      render={({ field }) => (
                        <div className="border rounded-lg">
                          <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                            <span className="text-sm font-medium">
                              Select Questions:
                            </span>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange(questions.map((q) => q._id));
                                  setSelectedTags(new Set(getUniqueTags()));
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
                                  setSelectedTags(new Set());
                                }}
                                className="text-xs"
                              >
                                Clear All
                              </Button>
                            </div>
                          </div>

                          <div className="max-h-64 overflow-y-auto">
                            <div className="p-4 space-y-3">
                              {questions.map((question) => {
                                const isChecked =
                                  field.value?.includes(question._id) || false;
                                return (
                                  <div
                                    key={question._id}
                                    className="flex items-start space-x-3"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([
                                            ...currentValue,
                                            question._id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter(
                                              (id: string) =>
                                                id !== question._id
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {question.question}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {question.input_type.toUpperCase()}
                                        </Badge>
                                        {question.tags?.map((tag) => (
                                          <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-xs"
                                          >
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
                            Selected: {field.value?.length || 0} of{" "}
                            {questions.length} questions
                          </div>
                        </div>
                      )}
                    />
                    {createForm.formState.errors.assigned_questions && (
                      <p className="text-red-600 text-sm">
                        {createForm.formState.errors.assigned_questions.message}
                      </p>
                    )}
                  </div>

                  {/* Days to Complete */}
                  <div className="space-y-2">
                    <Label htmlFor="days_to_complete">Days to Complete</Label>
                    <Input
                      type="number"
                      {...createForm.register("days_to_complete", {
                        valueAsNumber: true,
                      })}
                      min={1}
                      max={30}
                      className="w-32"
                    />
                    {createForm.formState.errors.days_to_complete && (
                      <p className="text-red-600 text-sm">
                        {createForm.formState.errors.days_to_complete.message}
                      </p>
                    )}
                  </div>
                </form>
              )}

              {/* Edit Form */}
              {isEditing && (
                <form
                  onSubmit={editForm.handleSubmit(onEditSubmit)}
                  className="space-y-6"
                >
                  {/* Candidate Info */}
                  {editingQuestionnaire && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">
                        Candidate:
                      </Label>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              editingQuestionnaire.candidate.profile_photo_url
                                ?.url
                            }
                          />
                          <AvatarFallback>
                            {editingQuestionnaire.candidate.first_name[0]}
                            {editingQuestionnaire.candidate.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {editingQuestionnaire.candidate.first_name}{" "}
                            {editingQuestionnaire.candidate.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {editingQuestionnaire.candidate.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions Selection for Edit */}
                  <div className="space-y-3">
                    <Label>Update Questions</Label>

                    {/* Tag Selection Section */}
                    {getUniqueTags().length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">
                          Quick Select by Tags:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueTags().map((tag) => (
                            <Controller
                              key={tag}
                              name="assigned_questions"
                              control={editForm.control}
                              render={({ field }) => {
                                const isTagSelected = selectedTags.has(tag);
                                return (
                                  <Button
                                    type="button"
                                    variant={
                                      isTagSelected ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                      toggleTagSelection(tag, field)
                                    }
                                    className="text-xs flex-shrink-0"
                                  >
                                    {isTagSelected && "✓ "}
                                    {tag}
                                    <Badge
                                      variant="secondary"
                                      className="ml-1 text-xs"
                                    >
                                      {
                                        questions.filter((q) =>
                                          q.tags?.includes(tag)
                                        ).length
                                      }
                                    </Badge>
                                  </Button>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click tags to select/deselect all questions with that
                          tag
                        </p>
                      </div>
                    )}

                    {/* Individual Question Selection */}
                    <Controller
                      name="assigned_questions"
                      control={editForm.control}
                      render={({ field }) => (
                        <div className="border rounded-lg">
                          {/* Select All/None Actions - Fixed Header */}
                          <div className="flex justify-between items-center p-3 border-b bg-white">
                            <span className="text-sm font-medium">
                              Individual Questions:
                            </span>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange(questions.map((q) => q._id));
                                  setSelectedTags(new Set(getUniqueTags()));
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
                                  setSelectedTags(new Set());
                                }}
                                className="text-xs"
                              >
                                Clear All
                              </Button>
                            </div>
                          </div>

                          {/* Scrollable Questions List */}
                          <div className="p-4 max-h-64 overflow-y-auto space-y-3">
                            {questions.map((question) => {
                              const isChecked =
                                field.value?.includes(question._id) || false;
                              return (
                                <div
                                  key={question._id}
                                  className="flex items-start space-x-3"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      if (checked) {
                                        field.onChange([
                                          ...currentValue,
                                          question._id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          currentValue.filter(
                                            (id: string) => id !== question._id
                                          )
                                        );
                                        // Update selected tags if this was the last question of a tag
                                        const newSelectedTags = new Set(
                                          selectedTags
                                        );
                                        question.tags?.forEach((tag) => {
                                          const otherQuestionsWithTag =
                                            questions.filter(
                                              (q) =>
                                                q._id !== question._id &&
                                                q.tags?.includes(tag) &&
                                                currentValue.includes(q._id)
                                            );
                                          if (
                                            otherQuestionsWithTag.length === 0
                                          ) {
                                            newSelectedTags.delete(tag);
                                          }
                                        });
                                        setSelectedTags(newSelectedTags);
                                      }
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium break-words">
                                      {question.question}
                                    </p>
                                    <div className="flex items-center flex-wrap gap-1 mt-1">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {question.input_type.toUpperCase()}
                                      </Badge>
                                      {question.tags &&
                                        question.tags.map((tag) => (
                                          <Badge
                                            key={tag}
                                            variant={
                                              selectedTags.has(tag)
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="text-xs"
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Selection Summary */}
                          <div className="p-3 border-t bg-gray-50 text-xs text-muted-foreground">
                            Selected: {field.value?.length || 0} of{" "}
                            {questions.length} questions
                            {selectedTags.size > 0 && (
                              <span className="ml-2">
                                | Tags: {Array.from(selectedTags).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    />
                    {editForm.formState.errors.assigned_questions && (
                      <p className="text-red-600 text-sm mt-1">
                        {editForm.formState.errors.assigned_questions.message}
                      </p>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="due_at">Due Date</Label>
                    <Input
                      type="date"
                      {...editForm.register("due_at")}
                      className="w-48"
                    />
                    {editForm.formState.errors.due_at && (
                      <p className="text-red-600 text-sm">
                        {editForm.formState.errors.due_at.message}
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={
                isEditing
                  ? editForm.handleSubmit(onEditSubmit)
                  : createForm.handleSubmit(onCreateSubmit)
              }
              disabled={submitting}
            >
              {submitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isEditing ? "Update Questionnaire" : "Assign Questionnaire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={closeViewDialog}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Questionnaire Details</DialogTitle>
            <DialogDescription>
              Complete details of the assigned questionnaire
            </DialogDescription>
          </DialogHeader>

          {selectedQuestionnaire && (
            <ScrollArea className="flex-1 px-2 sm:px-2 max-w-screen-xl mx-auto">
  <div className="space-y-4">
    {/* Top Section: Candidate Info + Details */}
    <Card>
      <CardHeader>
        <CardTitle>Candidate Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <Avatar className="w-40 h-35">
            <AvatarImage
              src={selectedQuestionnaire.candidate.profile_photo_url?.url}
            />
            <AvatarFallback>
              {selectedQuestionnaire.candidate.first_name[0]}
              {selectedQuestionnaire.candidate.last_name[0]}
            </AvatarFallback>
          </Avatar>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div>
              <h3 className="text-base font-semibold">
                {selectedQuestionnaire.candidate.first_name}{" "}
                {selectedQuestionnaire.candidate.last_name}
              </h3>
              <p className="text-muted-foreground break-words">
                {selectedQuestionnaire.candidate.email}
              </p>
            </div>

            <div>
              <p className="font-medium">Due Date</p>
              <p>{formatDate(selectedQuestionnaire.due_at)}</p>
            </div>

            <div>
              <p className="font-medium">Assigned By</p>
              <p>{selectedQuestionnaire.assigned_by.name}</p>
              <p className="text-muted-foreground break-words">
                {selectedQuestionnaire.assigned_by.email}
              </p>
            </div>

            <div>
              <p className="font-medium">Created At</p>
              <p>{formatDate(selectedQuestionnaire.createdAt)}</p>
            </div>

            <div>
              <p className="font-medium">Last Updated</p>
              <p>{formatDate(selectedQuestionnaire.updatedAt)}</p>
            </div>

            <div>
              <p className="font-medium">Status</p>
              <Badge
                className={getStatusColor(selectedQuestionnaire.status)}
              >
                {selectedQuestionnaire.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Questions */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          Assigned Questions ({selectedQuestionnaire.assigned_questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {selectedQuestionnaire.assigned_questions.map((question, index) => (
            <div key={question._id} className="border rounded-lg p-3">
              <p className="font-medium mb-2">
                {index + 1}. {question.question}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {question.input_type.toUpperCase()}
                </Badge>
                {question.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
</ScrollArea>

          )}

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button onClick={closeViewDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the questionnaire assigned to{" "}
              <span className="font-semibold">{deleteTargetName}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-4">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 text-sm">⚠️</div>
              <div className="text-sm text-yellow-800">
                This action cannot be undone. The questionnaire will be
                permanently removed from the candidate's record.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteCancelled}
              disabled={deleteLoadingId === deleteTargetId}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirmed}
              disabled={deleteLoadingId === deleteTargetId}
            >
              {deleteLoadingId === deleteTargetId ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Questionnaire"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRQuestionnaireBuilder;
