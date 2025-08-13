import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
} from "@/components/ui/dialog";
import {
  Eye,
  Search,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Plus,
  Check,
  Filter,
  ClipboardCheck,
  X,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";

// Assessment status type definition (matching your backend model)
type BackendAssessmentStatus = "pending" | "started" | "completed" | "expired";
type FrontendAssessmentStatus = "attempted" | "assigned" | "not-assigned";

interface Question {
  _id: string;
  text: string;
  type: 'mcq' | 'coding' | 'essay' | 'voice' | 'case_study' | 'short_answer' | 'long_answer';
  options?: string[];
  correct_answers?: any[];
  explanation?: string;
  is_must_ask?: boolean;
  max_score?: number;
  attachments?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  job_tags?: string[];
  stage?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentFormData {
  candidates: string[];
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
  gender: "male" | "female" | "other";
  address: string;
  profile_photo_url: {
    url: string;
    publicId: string;
  };
  applied_job: {
    _id: string;
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
  registration_date: string;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
  documents?: { _id: string; document_type: string; document_url: string }[];
  hrQuestionnaire?: { _id: string; status: string }[];
  assessments?: { _id: string; status: BackendAssessmentStatus }[];
  interviews?: { _id: string; status: string }[];
  stage_history?: { _id: string; changed_at: string }[];
};

const InvigilatorHome = () => {
  // State management for candidates and filters
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<FrontendAssessmentStatus | "all">("all");
  
  // Dialog states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  // Assignment Dialog States
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [targetCandidate, setTargetCandidate] = useState<Candidate | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Define allowed question types - ONLY MCQ, Coding, Essay, Short/Long Answer
  const allowedQuestionTypes = ['mcq', 'coding', 'essay', 'short_answer', 'long_answer'];
  
  //state to store detailed assessment data
   const [assessmentDetails, setAssessmentDetails] = useState<{[candidateId: string]: any[]}>({});

  // Form for assessment assignment
  const assignmentForm = useForm<AssignmentFormData>({
    defaultValues: {
      candidates: [],
      assigned_questions: [],
      days_to_complete: 7,
    },
  });

  /**
   * Helper function to map backend status to frontend display status
   */
  const getAssessmentStatus = (candidate: Candidate): FrontendAssessmentStatus => {
    if (!candidate.assessments || candidate.assessments.length === 0) {
      return "not-assigned";
    }
    return "assigned";
    // const latestAssessment = candidate.assessments[candidate.assessments.length - 1];
    
    // // Map backend status to frontend display status
    // switch (latestAssessment.status) {
    //   case "completed":
    //     return "attempted";
    //   case "pending":
    //   case "started":
    //     return "assigned";
    //   case "expired":
    //     return "attempted";
    //   default:
    //     return "not-assigned";
    // }
  };

  /**
   * Filter questions to only include allowed types
   */
  const getFilteredQuestions = (): Question[] => {
    return questions.filter(question => allowedQuestionTypes.includes(question.type));
  };

  /**
   * Fetch all candidates from the API
   */
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

  /**
   * Fetch questions for assignment and filter them
   */
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get("/org/question");
        const allQuestions = response.data.data || [];
        
        // Filter to only include allowed question types
        const filteredQuestions = allQuestions.filter((question: Question) => 
          allowedQuestionTypes.includes(question.type)
        );
        
        setQuestions(filteredQuestions);
        console.log(`Loaded ${filteredQuestions.length} questions of allowed types (MCQ, Coding, Essay, Short/Long Answer)`);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        toast.error("Failed to load questions");
      }
    };
    fetchQuestions();
  }, []);

  /**
   * Filter candidates based on search term and assessment status
   */
  useEffect(() => {
    let filtered = candidates;

    // Filter by current stage - only show assessment stage candidates
    filtered = filtered.filter(candidate => candidate.current_stage === "assessment");

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply assessment status filter
    if (assessmentStatusFilter !== "all") {
      filtered = filtered.filter(candidate => {
        const status = getAssessmentStatus(candidate);
        return status === assessmentStatusFilter;
      });
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, assessmentStatusFilter]);

  // Open assignment dialog with single candidate pre-selected (BRIDGE FUNCTIONALITY)
  const openSingleCandidateAssignment = (candidate: Candidate) => {
    if (!candidate) {
      toast.error('No candidate selected');
      return;
    }
    
    setTargetCandidate(candidate);
    setDialogOpen(false);
    setAssignmentDialogOpen(true);
    
    // 🔑 THE BRIDGE: Auto-select the candidate in the form
    assignmentForm.reset({
      candidates: [candidate._id],
      assigned_questions: [],
      days_to_complete: 7,
    });
    setSelectedTags(new Set());
  };

  // Close assignment dialog
  const closeAssignmentDialog = () => {
    setAssignmentDialogOpen(false);
    setTargetCandidate(null);
    assignmentForm.reset();
    setSelectedTags(new Set());
  };

  // Get unique tags from filtered questions
  const getUniqueTags = (): string[] => {
    const filteredQuestions = getFilteredQuestions();
    if (!filteredQuestions) return [];
    const tagsSet = new Set<string>();
    filteredQuestions.forEach((question) => {
      question.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  // Toggle tag selection for filtered questions
  const toggleTagSelection = (tag: string, field: any) => {
    const filteredQuestions = getFilteredQuestions();
    const newSelectedTags = new Set(selectedTags);
    if (selectedTags.has(tag)) {
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
    setSelectedTags(newSelectedTags);
  };

  // Submit assignment (FIXED to match backend schema)
  const onAssignmentSubmit = async (data: AssignmentFormData) => {
    if (!targetCandidate) {
      toast.error('No candidate selected');
      return;
    }

    try {
      setSubmitting(true);
      
      // Validate that we have questions selected
      if (data.assigned_questions.length === 0) {
        toast.error('Please select at least one question to assign');
        return;
      }
      
      // Validate job ID exists
      if (!targetCandidate.applied_job?._id) {
        toast.error('Candidate job information is missing');
        return;
      }
      
      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + data.days_to_complete);
      
      // ✅ FIXED: Properly structure the assignment data matching backend
      const assignmentData = {
        candidate_id: targetCandidate._id,
        job: targetCandidate.applied_job._id,
        questions_by_stage: {
          general: data.assigned_questions, // Put all questions in general stage
        },
        due_at: dueDate.toISOString(),
      };
      
      console.log('Sending assignment data:', assignmentData);
      console.log('Selected questions:', data.assigned_questions);
      
      const response = await api.post('/org/assessment/assign', assignmentData);
      
      if (response.data.success) {
        toast.success(`Assessment assigned to ${targetCandidate.first_name} ${targetCandidate.last_name}`);
        closeAssignmentDialog();
        // Refresh candidates data
        const candidatesResponse = await api.get("/org/candidates");
        setCandidates(candidatesResponse.data.data);
      } else {
        toast.error(response.data.message || 'Failed to assign assessment');
      }
    } catch (error: any) {
      console.error('Full assignment error:', error);
      console.error('Error response:', error.response?.data);
      
      toast.error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to assign assessment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle assignment action (BRIDGE HANDLER)
  const handleAssignAssessment = (candidate: Candidate) => {
    openSingleCandidateAssignment(candidate);
  };

  /**
   * Get available candidates (those without active assessments)
   */
  const getAvailableCandidates = () => {
    return candidates.filter(candidate => 
      candidate.current_stage === "assessment" && 
      getAssessmentStatus(candidate) === "not-assigned"
    );
  };

  /**
   * Badge styling for different assessment statuses
   */
  const getAssessmentStatusColor = (status: FrontendAssessmentStatus) => {
    switch (status) {
      case "attempted": 
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "assigned": 
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "not-assigned": 
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: 
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  /**
   * Badge styling for candidate stages
   */
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

  /**
   * Format date strings for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Fetch detailed candidate information for the modal
   */
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

  /**
   * Calculate statistics for the dashboard - Fixed to use original candidates
   */
  const stats = {
    total: candidates.filter(c => c.current_stage === "assessment").length,
    attempted: candidates.filter(c => c.current_stage === "assessment" && getAssessmentStatus(c) === 'attempted').length,
    assigned: candidates.filter(c => c.current_stage === "assessment" && getAssessmentStatus(c) === 'assigned').length,
    notAssigned: candidates.filter(c => c.current_stage === "assessment" && getAssessmentStatus(c) === 'not-assigned').length,
  };

  /**
   * Get question type display name and color
   */
  const getQuestionTypeDisplay = (type: string) => {
    switch(type) {
      case 'mcq': return 'MCQ';
      case 'coding': return 'CODING';
      case 'essay': return 'LONG ANSWER';
      case 'short_answer': return 'SHORT ANSWER';
      case 'long_answer': return 'LONG ANSWER';
      default: return type.toUpperCase();
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch(type) {
      case 'mcq': return 'bg-blue-50 text-blue-700';
      case 'coding': return 'bg-green-50 text-green-700';
      case 'essay': 
      case 'long_answer': return 'bg-purple-50 text-purple-700';
      case 'short_answer': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  /**
   * Loading state display
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Invigilator Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage candidate assessments during the evaluation process
        </p>
      </div>

      {/* Statistics Cards - Assessment focused metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total in Assessment</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Candidates in assessment stage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attempted</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attempted}</div>
            <p className="text-xs text-muted-foreground">Completed assessments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">Assessments in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Assigned</CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.notAssigned}</div>
            <p className="text-xs text-muted-foreground">Pending assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            View and manage candidate assessments. Use filters to focus on specific assessment statuses.
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters and Search Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Assessment Status Filter */}
            <div className="min-w-[200px]">
              <Select
                value={assessmentStatusFilter}
                onValueChange={(value: FrontendAssessmentStatus | "all") => setAssessmentStatusFilter(value)}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by assessment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="attempted">Attempted</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="not-assigned">Not Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assessment Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => {
                  const assessmentStatus = getAssessmentStatus(candidate);
                  
                  return (
                    <TableRow key={candidate._id}>
                      {/* Candidate Information */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={candidate.profile_photo_url.url} />
                            <AvatarFallback>
                              {candidate.first_name[0]}{candidate.last_name[0]}
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

                      {/* Contact Information */}
                      <TableCell>
                        <div>
                          <div className="text-sm">{candidate.email}</div>
                          <div className="text-sm text-muted-foreground">{candidate.phone}</div>
                        </div>
                      </TableCell>

                      {/* Assessment Status Badge */}
                      <TableCell>
                        <Badge className={getAssessmentStatusColor(assessmentStatus)}>
                          {assessmentStatus.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>

                      {/* Registration Date */}
                      <TableCell>
                        <div className="text-sm">{formatDate(candidate.registration_date)}</div>
                      </TableCell>

                      {/* Action Buttons */}
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
                          
                          <Button 
                            variant={assessmentStatus === "not-assigned" ? "default" : "secondary"}
                            size="sm"
                            disabled={assessmentStatus === "assigned"}
                            onClick={() => {
                              if (assessmentStatus === "not-assigned") {
                                handleAssignAssessment(candidate);
                              }
                            }}
                            className="ml-2"
                          >
                            {assessmentStatus === "not-assigned" ? (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Click to Assign
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Already Assigned
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No candidates found matching your criteria.
                {assessmentStatusFilter !== "all" && (
                  <span className="block mt-2">
                    Try changing the assessment status filter or search term.
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog - BRIDGE FUNCTIONALITY with QUESTION FILTERING */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Assign Assessment</DialogTitle>
            <DialogDescription>
              {targetCandidate ? (
                <>Assign assessment to {targetCandidate.first_name} {targetCandidate.last_name}</>
              ) : (
                'Select candidates and assign questions to create assessments'
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="space-y-6">
                {/* Pre-selected Candidate Display - BRIDGE UI */}
                {targetCandidate && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-sm font-medium mb-2 block text-blue-800">Assigning assessment to:</Label>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={targetCandidate.profile_photo_url?.url} />
                        <AvatarFallback>
                          {targetCandidate.first_name[0]}{targetCandidate.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-blue-900">
                          {targetCandidate.first_name} {targetCandidate.last_name}
                        </div>
                        <div className="text-sm text-blue-700">
                          {targetCandidate.email}
                        </div>
                        <Badge className={getStageColor(targetCandidate.current_stage)} variant="outline">
                          {targetCandidate.current_stage?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions Selection - FILTERED for specific types only */}
                <div className="space-y-3">
                  <Label>
                    Select Questions 
                    <span className="text-sm text-muted-foreground ml-2">
                      (Showing only: MCQ, Coding, Essay, Short/Long Answer types)
                    </span>
                  </Label>
                  
                  {/* Tag Selection */}
                  {getUniqueTags().length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Quick Select by Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueTags().map((tag) => (
                          <Controller
                            key={tag}
                            name="assigned_questions"
                            control={assignmentForm.control}
                            render={({ field }) => {
                              const isTagSelected = selectedTags.has(tag);
                              return (
                                <Button
                                  type="button"
                                  variant={isTagSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleTagSelection(tag, field)}
                                  className="text-xs"
                                >
                                  {isTagSelected && "✓ "}{tag}
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    {getFilteredQuestions().filter(q => q.tags?.includes(tag)).length}
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
                    name="assigned_questions"
                    control={assignmentForm.control}
                    render={({ field }) => {
                      const filteredQuestions = getFilteredQuestions();
                      
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
                              {filteredQuestions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                  No questions found for allowed types (MCQ, Coding, Essay, Short/Long Answer)
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
                                          
                                          {question.difficulty && (
                                            <Badge variant="secondary" className="text-xs">
                                              {question.difficulty.toUpperCase()}
                                            </Badge>
                                          )}
                                          
                                          {question.tags?.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
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
                              (Filtered: MCQ, Coding, Essay, Short/Long Answer only)
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>

                {/* Days to Complete */}
                <div className="space-y-2">
                  <Label htmlFor="days_to_complete">Days to Complete</Label>
                  <Input
                    type="number"
                    {...assignmentForm.register('days_to_complete', { valueAsNumber: true })}
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
            <Button type="button" variant="outline" onClick={closeAssignmentDialog}>
              Cancel
            </Button>
            <Button 
              onClick={assignmentForm.handleSubmit(onAssignmentSubmit)}
              disabled={submitting}
            >
              {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Assign Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Assessment Details</DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6">
              {/* Applied Job */}
              {selectedCandidate.applied_job && (
                <Card>
                  <CardHeader>
                    <CardTitle>Applied Position</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong>Location:</strong>{" "}
                        {selectedCandidate.applied_job.description?.location}
                      </div>
                      <div>
                        <strong>Country:</strong>{" "}
                        {selectedCandidate.applied_job.description?.country}
                      </div>
                      <div>
                        <strong>Time:</strong>{" "}
                        {selectedCandidate.applied_job.description?.time}
                      </div>
                      <div>
                        <strong>Experience:</strong>{" "}
                        {selectedCandidate.applied_job.description?.expInYears}
                      </div>
                      <div>
                        <strong>Salary:</strong>{" "}
                        {selectedCandidate.applied_job.description?.salary}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {selectedCandidate.documents &&
                selectedCandidate.documents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedCandidate.documents.map(
                          (doc: {
                            _id: string;
                            document_type: string;
                            document_url: string;
                          }) => (
                            <div
                              key={doc._id}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <div>
                                <span className="font-medium capitalize">
                                  {doc.document_type}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(doc.document_url, "_blank")
                                }
                              >
                                View Document
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* HR Questionnaire Status */}
              {selectedCandidate.hrQuestionnaire &&
                selectedCandidate.hrQuestionnaire.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>HR Questionnaire</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedCandidate.hrQuestionnaire.map(
                          (questionnaire: { _id: string; status: string }) => (
                            <div
                              key={questionnaire._id}
                              className="flex items-center justify-between"
                            >
                              <span>Questionnaire Status:</span>
                              <Badge
                                className={
                                  questionnaire.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {questionnaire.status.toUpperCase()}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Assessment Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.assessments && selectedCandidate.assessments.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCandidate.assessments.map((assessment: { _id: string; status: BackendAssessmentStatus }, index: number) => (
                        <div key={assessment._id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">Assessment #{index + 1}</span>
                            <div className="text-sm text-muted-foreground">Assessment ID: {assessment._id}</div>
                          </div>
                          <Badge className={getAssessmentStatusColor(getAssessmentStatus({ ...selectedCandidate, assessments: [assessment] }))}>
                            {assessment.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No assessments found for this candidate</p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => {
                          setDialogOpen(false);
                          handleAssignAssessment(selectedCandidate);
                        }}
                      >
                        Assign New Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stage History */}
              {selectedCandidate.stage_history &&
                selectedCandidate.stage_history.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Stage History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedCandidate.stage_history.map(
                          (stage: { _id: string; changed_at: string }) => (
                            <div key={stage._id} className="text-sm">
                              <strong>Changed At:</strong>{" "}
                              {formatDate(stage.changed_at)}
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvigilatorHome;
