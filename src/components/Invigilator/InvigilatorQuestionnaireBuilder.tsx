import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash, Search,Users, Clock, CheckCircle, X, Eye, Loader2, } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import CandidateMultiSelect from '../CandidateMultiselect';

// Replace the existing schemas with these updated ones
const assessmentSchema = z.object({
  candidates: z.array(z.string().length(24, 'Invalid candidate ID')).min(1, 'Select at least one candidate'),
  assigned_questions: z.array(z.string().length(24, 'Invalid question ID')).min(1, 'Select at least one question'),
  days_to_complete: z.number().min(1, "Must be at least 1 day").max(30, "Cannot exceed 30 days").optional(),
  is_seb: z.boolean(),
  is_aiproctored: z.boolean(),
  exam_duration: z.number().min(1, "Must be at least 1 minute").max(600, "Cannot exceed 10 hours")
});

const assessmentUpdateSchema = z.object({
  assigned_questions: z.array(z.string().length(24, 'Invalid question ID')).min(1, 'Select at least one question'),
  days_to_complete: z.number().min(1, "Must be at least 1 day").max(30, "Cannot exceed 30 days").optional(),
  is_seb: z.boolean().optional(),
  is_aiproctored: z.boolean().optional(),
  exam_duration: z.number().min(1, "Must be at least 1 minute").max(600, "Cannot exceed 10 hours").optional(),
});

type CreateFormData = z.infer<typeof assessmentSchema>;
type EditFormData = z.infer<typeof assessmentUpdateSchema>;

// Types
interface TechnicalQuestion {
  _id: string;
  text: string;
  type: 'mcq' | 'coding' | 'essay';
  options?: string[];
  correct_answers: string[];
  explanation?: string;
  is_must_ask: boolean;
  max_score: number;
  tags?: string[];
  createdBy: string;
}

interface Candidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: {
    url: string;
    publicId: string;
  };
  current_stage: string;
  applied_job?: {
    _id: string;
    name: string;
    description?:string; 
      time?: string;
      country?: string;
      location?: string;
      expInYears?: string;
      salary?: string;
      jobId?: string;
      title?:string;
  };
}

interface Assessment {
  _id: string;
  candidate: Candidate;
  questions: TechnicalQuestion[];
  assigned_by: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assigned_at: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  status: 'pending' | 'started' | 'completed' | 'expired';
  is_seb: boolean;
  is_aiproctored: boolean;
  exam_duration: number;
  createdAt: string;
  updatedAt: string;
}

const AssessmentManagement = () => {
  // State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssessmentForAction, setSelectedAssessmentForAction] = useState<Assessment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');
  const [selectedJobForAutoSelect, setSelectedJobForAutoSelect] = useState<string>('');

  const [questions, setQuestions] = useState<TechnicalQuestion[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    function truncateTag(tag: string, maxLength = 12) {
    if (tag.length <= maxLength) return tag;
    return tag.slice(0, maxLength) + "…";
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
  const isMobile = useIsCompact(430);
  // Update createForm defaultValues
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      candidates: [],
      assigned_questions: [],
      days_to_complete: 7,
      is_seb: false,
      is_aiproctored: true,
      exam_duration: 60, // Default 1 hour
    }
  });

// For Create Form - tracks selected questions and calculates total
const createSelectedQuestionIds = useWatch({
  control: createForm.control,
  name: 'assigned_questions',
});

const createTotalMarks = useMemo(() => {
  if (!Array.isArray(createSelectedQuestionIds) || createSelectedQuestionIds.length === 0) {
    return 0;
  }
  
  // Create a map of question ID to max_score for quick lookup
  const scoreById = new Map(questions.map(q => [q._id, q?.max_score ?? 0]));
  
  return createSelectedQuestionIds.reduce((sum, id) => {
    return sum + (scoreById.get(id) ?? 0);
  }, 0);
}, [createSelectedQuestionIds, questions]);


  const editForm = useForm<EditFormData>({
    resolver: zodResolver(assessmentUpdateSchema),
    defaultValues: {
      assigned_questions: [],
      days_to_complete: 7,
      is_seb: false,
      is_aiproctored: true,
      exam_duration: 60, // Default 1 hour
    }
  });


  // For Edit Form - tracks selected questions and calculates total
const editSelectedQuestionIds = useWatch({
  control: editForm.control,
  name: 'assigned_questions',
});

const editTotalMarks = useMemo(() => {
  if (!Array.isArray(editSelectedQuestionIds) || editSelectedQuestionIds.length === 0) {
    return 0;
  }
  
  // Create a map of question ID to max_score for quick lookup
  const scoreById = new Map(questions.map(q => [q._id, q?.max_score ?? 0]));
  
  return editSelectedQuestionIds.reduce((sum, id) => {
    return sum + (scoreById.get(id) ?? 0);
  }, 0);
}, [editSelectedQuestionIds, questions]);

  const isEditing = !!editingAssessment;
  // Helper function to select all required (must-ask) questions
  const selectRequiredQuestions = (field: { onChange: (value: string[]) => void }) => {
    const requiredQuestionIds = questions
      .filter((question) => question.is_must_ask === true)
      .map((question) => question._id);
    
    field.onChange(requiredQuestionIds);
    
    if (requiredQuestionIds.length > 0) {
      toast.success(`Selected ${requiredQuestionIds.length} required questions`);
    } else {
      toast.error("No required questions available");
    }
  };

  // Helper functions - Following HR questionnaire pattern
  const getUniqueJobs = () => {
    const jobMap = new Map();
    getAvailableCandidates().forEach(candidate => {
      if (candidate.applied_job && candidate.applied_job._id) {
        jobMap.set(candidate.applied_job._id, candidate.applied_job);
      }
    });
    return Array.from(jobMap.values());
  };

  const selectCandidatesByJob = (jobId: string, field: { onChange: (value: string[]) => void }) => {
    if (!jobId) {
      field.onChange([]);
      return;
    }
    
    const candidatesForJob = getAvailableCandidates()
      .filter(candidate => candidate.applied_job?._id === jobId)
      .map(candidate => candidate._id);
    
    field.onChange(candidatesForJob);
    toast.success(`Selected ${candidatesForJob.length} candidates for this job`);
  };

  const clearJobSelection = () => {
    setSelectedJobForAutoSelect('');
  };

  // Helper function to extract unique tags
  const getUniqueTags = () => {
    const tagSet = new Set<string>();
    questions.forEach(question => {
      question.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // Helper function to toggle tag selection
  const toggleTagSelection = (tag: string, field: { value: string[]; onChange: (value: string[]) => void }) => {
    const newSelectedTags = new Set(selectedTags);
    const currentSelectedQuestions = new Set(field.value || []);
    
    if (selectedTags.has(tag)) {
      // Remove tag and all its questions
      newSelectedTags.delete(tag);
      questions.forEach(question => {
        if (question.tags?.includes(tag)) {
          currentSelectedQuestions.delete(question._id);
        }
      });
    } else {
      // Add tag and all its questions
      newSelectedTags.add(tag);
      questions.forEach(question => {
        if (question.tags?.includes(tag)) {
          currentSelectedQuestions.add(question._id);
        }
      });
    }
    
    setSelectedTags(newSelectedTags);
    field.onChange(Array.from(currentSelectedQuestions));
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [assessmentsRes, questionsRes, candidatesRes] = await Promise.all([
        api.get('/org/assessment'),
        api.get('/org/question'),
        api.get('/org/candidates'),
      ]);
      
      setAssessments(assessmentsRes.data.data || []);
      setFilteredAssessments(assessmentsRes.data.data || []);
      setQuestions(questionsRes.data.data || []);
      setCandidates(candidatesRes.data.data || []);
    } catch (error) {
            toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);


  // Filter assessments
  useEffect(() => {
    let filtered = assessments;

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, statusFilter]);

  const openCreateDialog = () => {
    setEditingAssessment(null);
    setSelectedTags(new Set());
    setSelectedJobForAutoSelect('');
    createForm.reset({ 
      candidates: [], 
      assigned_questions: [],
      days_to_complete: 7,
      is_seb: false,
      is_aiproctored: true,
      exam_duration: 60
    });
    setDialogOpen(true);
  };

  // Replace the openEditDialog function
  const openEditDialog = (assessment: Assessment,e) => {
    setEditingAssessment(assessment);
    setSelectedTags(new Set());
    
    // Calculate days from due_at if it exists
    const daysToComplete = assessment.due_at ? 
      Math.ceil((new Date(assessment.due_at).getTime() - new Date(assessment.assigned_at).getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    editForm.reset({
      assigned_questions: assessment.questions.map(q => q._id),
      days_to_complete: Math.max(1, daysToComplete),
      is_seb: assessment.is_seb || false,
      is_aiproctored: assessment.is_aiproctored || true,
      exam_duration: assessment.exam_duration || 60,
    });
    setDialogOpen(true);
    e.stopPropagation();
  };

  const openViewDialog = (assessment: Assessment,e) => {
    setSelectedAssessment(assessment);
    setViewDialogOpen(true);
    e.stopPropagation();
  };

  // Make sure closeDialog is also updated:
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAssessment(null);
    setSelectedTags(new Set());
    setSelectedJobForAutoSelect('');
    createForm.reset({
      candidates: [], 
      assigned_questions: [], 
      days_to_complete: 7,
      is_seb: false,
      is_aiproctored: true,
      exam_duration: 60,
    });
    editForm.reset();
  };

  const closeViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedAssessment(null);
  };

  // Delete handlers
  const openDeleteDialog = (id: string, candidateName: string,e) => {
    setDeleteTargetId(id);
    setDeleteTargetName(candidateName);
    setDeleteDialogOpen(true);
    e.stopPropagation();
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTargetId) return;
    
    try {
      setDeleteLoadingId(deleteTargetId);
      await api.delete(`/org/assessment/${deleteTargetId}`);
      
      toast.success('Assessment deleted successfully');
      setDeleteDialogOpen(false);
      fetchAllData();
    } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to delete assessment';
      toast.error(errorMessage || 'Failed to delete assessment');
    } finally {
      setDeleteLoadingId(null);
      setDeleteTargetId(null);
      setDeleteTargetName('');
    }
  };

  const handleDeleteCancelled = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
    setDeleteTargetName('');
  };

  // Update onCreateSubmit function
  const onCreateSubmit = async (data: CreateFormData) => {
    try {
      setSubmitting(true);
      
      // Convert to backend format: bulk assessments array
      const assessments = data.candidates.map(candidateId => ({
        candidate: candidateId,
        questions: data.assigned_questions,
        days_to_complete: data.days_to_complete || undefined,
        is_seb: data.is_seb,
        is_aiproctored: data.is_aiproctored,
        exam_duration: data.exam_duration
      }));

      const response = await api.post('/org/assessment', { assessments });
      toast.success(`${assessments.length} assessment(s) created successfully`);
      closeDialog();
      fetchAllData();
    } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to create assessments';
      toast.error(errorMessage || 'Failed to create assessments');
    } finally {
      setSubmitting(false);
    }
  };

  // Update onEditSubmit function
  const onEditSubmit = async (data: EditFormData) => {
    if (!editingAssessment) return;
    
    try {
      setSubmitting(true);
      
      const payload = {
        questions: data.assigned_questions,
        days_to_complete: data.days_to_complete || undefined,
        is_seb: data.is_seb,
        is_aiproctored: data.is_aiproctored,
        exam_duration: data.exam_duration,
      };
      
      await api.put(`/org/assessment/${editingAssessment._id}`, payload);
      
      toast.success('Assessment updated successfully');
      closeDialog();
      fetchAllData();
    } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to update assessment';
      toast.error(errorMessage || 'Failed to update assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'started': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  // Get available candidates (those in assessment stage WITHOUT pending assessments)
  const getAvailableCandidates = () => {
    return candidates.filter(candidate => {
      // Must be in assessment stage
      if (candidate.current_stage !== "assessment") {
        return false;
      }
      
      // Check if candidate has any pending assessments
      const hasPendingAssessment = assessments.some(assessment => 
        assessment.candidate._id === candidate._id && 
        assessment.status === "pending"
      );
      
      // Only include if NO pending assessment
      return !hasPendingAssessment;
    });
  };


  // Statistics
  const stats = {
    total: assessments.length,
    pending: assessments.filter(a => a.status === 'pending').length,
    started: assessments.filter(a => a.status === 'started').length,
    completed: assessments.filter(a => a.status === 'completed').length,
    expired: assessments.filter(a => a.status === 'expired').length,
  };
    // Sync job selection when candidates change in CREATE form
  useEffect(() => {
    const selectedCandidatesArray = createForm.watch("candidates") || [];
    
    if (selectedCandidatesArray.length === 0) {
      setSelectedJobForAutoSelect("");
      return;
    }

    // Get jobs of selected candidates
    const candidateJobs = getAvailableCandidates()
      .filter((c) => selectedCandidatesArray.includes(c._id))
      .map((c) => c.applied_job?._id)
      .filter((jobId): jobId is string => !!jobId);

    const uniqueJobs = [...new Set(candidateJobs)];

    if (uniqueJobs.length === 1) {
      // All selected candidates belong to the same job
      const jobId = uniqueJobs[0];
      const allCandidatesForJob = getAvailableCandidates()
        .filter((c) => c.applied_job?._id === jobId)
        .map((c) => c._id);

      // Check if ALL candidates for this job are selected
      const allSelected = allCandidatesForJob.every((id) =>
        selectedCandidatesArray.includes(id)
      );

      if (allSelected) {
        setSelectedJobForAutoSelect(jobId);
      } else {
        setSelectedJobForAutoSelect("");
      }
    } else {
      setSelectedJobForAutoSelect("");
    }
  }, [createForm.watch("candidates"), getAvailableCandidates]);
  return (
    <div className="container mx-auto p-6 space-y-6">      
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold">Assessment Management</h1>
            <p className="text-muted-foreground">
              Assign and manage technical assessments for candidates
            </p>
          </div>
          <div className="w-full md:w-auto">
            <Button
              onClick={openCreateDialog}
              disabled={getAvailableCandidates().length === 0}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 w-4 h-4" /> Assign Assessment
            </Button>
          </div>
        </div>
        


      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Assessments</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
                <div className="text-2xl font-bold text-blue-600">{stats.started}</div>
                <div className="text-sm text-muted-foreground">Started</div>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
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
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessments Table */}
      <Card className='flex flex-col overflow-y-auto mb-7'>
        <CardHeader>
          <CardTitle>Assessments ({filteredAssessments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              {!isMobile && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assigned By</TableHead>
                        {!isCompact && <TableHead>Created</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssessments.map((assessment) => (
                        <TableRow
                          key={assessment._id}
                          onClick={(e) => openViewDialog(assessment, e)}
                          className="cursor-pointer hover:bg-muted"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={assessment.candidate.profile_photo_url?.url} />
                                <AvatarFallback>
                                  {assessment.candidate.first_name[0]}{assessment.candidate.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {assessment.candidate.first_name} {assessment.candidate.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {assessment.candidate.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(assessment.status)}>
                              {isCompact ? truncateTag(assessment.status.toUpperCase(), 3) : assessment.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {assessment.due_at ? formatDate(assessment.due_at) : 'No due date'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <div className="font-medium">{assessment.assigned_by.name}</div>
                              <div className="text-muted-foreground">{`(${assessment.assigned_by.role})`}</div>
                            </div>
                          </TableCell>
                          {!isCompact && <TableCell className="text-sm text-muted-foreground">
                            {formatDate(assessment.createdAt)}
                          </TableCell>}
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => openEditDialog(assessment, e)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => openDeleteDialog(
                                  assessment._id, 
                                  `${assessment.candidate.first_name} ${assessment.candidate.last_name}`, e
                                )}
                                disabled={deleteLoadingId === assessment._id}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Mobile Table */}
              {isMobile && (
                <div className="border rounded-lg overflow-hidden">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-full">Candidate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssessments.map((assessment) => (
                        <TableRow
                          key={assessment._id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedAssessmentForAction(assessment)}
                        >
                          <TableCell className="w-full pr-2">
                            <div className="flex items-center space-x-3 min-w-0">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={assessment.candidate.profile_photo_url?.url} />
                                <AvatarFallback className="text-xs font-medium">
                                  {assessment.candidate.first_name[0]}{assessment.candidate.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate text-sm">
                                  {assessment.candidate.first_name} {assessment.candidate.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {assessment.candidate.email}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getStatusColor(assessment.status)} variant="outline">
                                    {assessment.status.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {assessment.questions ? `${assessment.questions.length} questions` : 'No questions'}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Assigned by: {assessment.assigned_by.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredAssessments.length === 0 && !loading && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No assessments match your filters.' 
                      : 'No assessments found. Create your first assessment!'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile Actions Dialog */}
      <Dialog open={!!selectedAssessmentForAction} onOpenChange={(open) => !open && setSelectedAssessmentForAction(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Assessment Actions</DialogTitle>
            <DialogDescription>
              Choose an action for this assessment
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssessmentForAction && (
            <div className="space-y-4">
              {/* Assessment Preview */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedAssessmentForAction.candidate.profile_photo_url?.url} />
                    <AvatarFallback className="text-sm">
                      {selectedAssessmentForAction.candidate.first_name[0]}
                      {selectedAssessmentForAction.candidate.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {selectedAssessmentForAction.candidate.first_name} {selectedAssessmentForAction.candidate.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedAssessmentForAction.candidate.email}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedAssessmentForAction.status)} variant="outline">
                      {selectedAssessmentForAction.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedAssessmentForAction.questions ? `${selectedAssessmentForAction.questions.length} questions` : 'No questions'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAssessmentForAction.due_at ? (
                      <div>Due: {formatDate(selectedAssessmentForAction.due_at)}</div>
                    ) : (
                      <div>No due date set</div>
                    )}
                    <div>Duration: {selectedAssessmentForAction.exam_duration} minutes</div>
                    <div>SEB Required: {selectedAssessmentForAction.is_seb ? 'Yes' : 'No'}</div>
                    <div>Assigned by: {selectedAssessmentForAction.assigned_by.name} ({selectedAssessmentForAction.assigned_by.role})</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    const assessment = selectedAssessmentForAction;
                    setSelectedAssessmentForAction(null);
                    const mockEvent = { stopPropagation: () => {} };
                    openViewDialog(assessment, mockEvent);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    const assessment = selectedAssessmentForAction;
                    setSelectedAssessmentForAction(null);
                    const mockEvent = { stopPropagation: () => {} };
                    openEditDialog(assessment, mockEvent);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Assessment
                </Button>
                
                <Button
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  variant="outline"
                  onClick={() => {
                    const assessment = selectedAssessmentForAction;
                    setSelectedAssessmentForAction(null);
                    const mockEvent = { stopPropagation: () => {} };
                    openDeleteDialog(
                      assessment._id,
                      `${assessment.candidate.first_name} ${assessment.candidate.last_name}`,
                      mockEvent
                    );
                  }}
                  disabled={deleteLoadingId === selectedAssessmentForAction._id}
                >
                  {deleteLoadingId === selectedAssessmentForAction._id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash className="w-4 h-4 mr-2" />
                  )}
                  Delete Assessment
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssessmentForAction(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="h-screen max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full max-h-none sm:max-h-none flex flex-col overflow-hidden bg-background border-0 sm:border rounded-none sm:rounded-lg m-0 sm:m-2 p-0">

          {/* Main Content - NO SCROLL */}
          <div className="flex-1 min-h-0 px-4 py-3 sm:px-6 sm:py-4 flex flex-col overflow-hidden">
            <div className="flex flex-col h-full space-y-4 sm:space-y-6 overflow-hidden">
              

              {/* Form Content - Fills remaining space */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Create Form */}
                {!isEditing && (
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex-1 min-h-0 flex flex-col space-y-4 sm:space-y-6 overflow-hidden">
                    
                    {/* Candidates Selection - Compact Popover */}
                    <div className="flex-shrink-0 space-y-3">
                      <Label className="text-sm font-medium">Select Candidates ({getAvailableCandidates().length} available)</Label>
                      
                      {/* Job Auto-Select Section - Fixed Height */}
                      <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-border dark:border-border">
                        <Label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Quick Select by Job Applied:</Label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                                <SelectTrigger className="w-full sm:w-64">
                                  <SelectValue placeholder="Select a job to auto-select candidates" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getUniqueJobs().map((job) => {
                                    const candidateCount = getAvailableCandidates().filter(
                                      c => c.applied_job?._id === job._id
                                    ).length;
                                    return (
                                      <SelectItem key={job._id} value={job._id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{job.title}</span>
                                          <Badge variant="secondary" className="ml-2 text-xs">
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
                                createForm.setValue('candidates', []);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Clear
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                          Select a job to automatically choose all candidates who applied for that position
                        </p>
                      </div>

                      {/* Multiselect Candidates Popover */}
                      <Controller
                        name="candidates"
                        control={createForm.control}
                        render={({ field }) => (
                          <CandidateMultiSelect
                            candidates={getAvailableCandidates()}
                            selectedCandidates={field.value || []}
                            onSelectionChange={field.onChange}
                            selectedJobId={selectedJobForAutoSelect}
                          />
                        )}
                      />
                      {createForm.formState.errors.candidates && (
                        <p className="text-red-600 text-sm">{createForm.formState.errors.candidates.message}</p>
                      )}
                    </div>

                    {/* Questions Selection - Takes remaining space */}
                    <div className="flex-1 min-h-0 flex flex-col space-y-0.5 overflow-hidden">
                      {/* Tag Selection - Fixed Height */}
                      {getUniqueTags().length > 0 && (
                        <div className="flex-shrink-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Quick Select by Tags:</Label>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
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
                                      variant={isTagSelected ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => toggleTagSelection(tag, field)}
                                      className="text-xs h-6 px-2 sm:h-7"
                                    >
                                      {isTagSelected && "✓ "}{tag}
                                      <Badge variant="secondary" className="ml-1 text-xs h-3 sm:h-4 px-1">
                                        {questions.filter(q => q.tags?.includes(tag)).length}
                                      </Badge>
                                    </Button>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Questions List - Only this scrolls, NOW WITH MORE SPACE! */}
                      <Controller
                        name="assigned_questions"
                        control={createForm.control}
                        render={({ field }) => (
                          <div className="flex-1 min-h-0 border border-border dark:border-border rounded-lg flex flex-col overflow-hidden">
                            {/* Header with Integrated Count - Fixed */}
                            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 border-b border-border dark:border-border bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium">Select Questions</span>
                                <Badge variant="secondary" className="text-xs">
                                  {field.value?.length || 0} / {questions.length}
                                </Badge>
                                {field.value?.length > 0 && createTotalMarks > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {createTotalMarks} pts
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    field.onChange(questions.map((q) => q._id));
                                    setSelectedTags(new Set(getUniqueTags()));
                                  }}
                                  className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                                >
                                  <span className="sm:hidden">All</span>
                                  <span className="hidden sm:inline">Select All</span>
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => selectRequiredQuestions(field)}
                                  className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                                >
                                  <span className="sm:hidden">Req</span>
                                  <span className="hidden sm:inline">Required</span>
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    field.onChange([]);
                                    setSelectedTags(new Set());
                                  }}
                                  className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>


                            {/* EXPANDED SCROLLABLE AREA - No Footer Taking Space! */}
                            <div className="flex-1 min-h-0 overflow-y-auto">
                              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                {questions.map((question) => {
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
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-foreground dark:text-foreground line-clamp-2">
                                          {question.text}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          <Badge variant="outline" className="text-xs h-4">
                                            {question.type.toUpperCase()}
                                          </Badge>
                                          {question.max_score && (
                                            <Badge variant="secondary" className="text-xs h-4">
                                              {question.max_score} pts
                                            </Badge>
                                          )}
                                          {question.is_must_ask && <Badge variant='destructive'>
                                            {"Must ask"}
                                          </Badge>}
                                          {question.tags?.slice(0, 2).map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs h-4">
                                              {tag}
                                            </Badge>
                                          ))}
                                          {question.tags && question.tags.length > 2 && (
                                            <span className="text-xs text-muted-foreground self-center">
                                              +{question.tags.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* NO FOOTER - More space for questions! */}
                            
                          </div>
                        )}
                      />
                      {createForm.formState.errors.assigned_questions && (
                        <p className="text-red-600 text-sm">{createForm.formState.errors.assigned_questions.message}</p>
                      )}
                    </div>
                    {/* Assessment Configuration - Fixed at bottom */}
                    <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* SEB Field */}
                      <div className="">
                        <Label htmlFor="is_seb" className="text-sm font-medium">Safe Exam Browser (SEB)</Label>
                        <Controller
                          name="is_seb"
                          control={createForm.control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2 p-2 border border-border dark:border-border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="is_seb"
                              />
                              <Label htmlFor="is_seb" className="text-sm font-normal">
                                Required
                              </Label>
                            </div>
                          )}
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Secure browser requirement
                        </p>
                      </div>

                      {/* AI Proctoring Field - NEW */}
                      <div className="">
                        <Label htmlFor="is_aiproctored" className="text-sm font-medium">AI Proctoring</Label>
                        <Controller
                          name="is_aiproctored"
                          control={createForm.control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2 p-2 border border-border dark:border-border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="is_aiproctored"
                              />
                              <Label htmlFor="is_aiproctored" className="text-sm font-normal">
                                Enabled
                              </Label>
                            </div>
                          )}
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          AI-based monitoring
                        </p>
                      </div>

                      {/* Exam Duration Field */}
                      <div className="space-y-2">
                        <Label htmlFor="exam_duration" className="text-sm font-medium">
                          Exam Duration (Required)
                        </Label>
                        <Input
                          type="number"
                          {...createForm.register('exam_duration', { valueAsNumber: true })}
                          min={1}
                          max={600}
                          placeholder="60"
                          className="w-full h-8"
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {createForm.watch('exam_duration')
                            ? `${Math.floor((createForm.watch('exam_duration') || 60) / 60)}h ${(createForm.watch('exam_duration') || 60) % 60}m`
                            : "Time in minutes"
                          }
                        </p>
                        {createForm.formState.errors.exam_duration && (
                          <p className="text-red-600 text-sm">{createForm.formState.errors.exam_duration.message}</p>
                        )}
                      </div>

                      {/* Total Marks Field */}
                      <div className="space-y-2">
                        <Label htmlFor="total_marks" className="text-sm font-medium">Total Marks</Label>
                        <Input
                          id="total_marks"
                          type="number"
                          value={createTotalMarks}
                          readOnly
                          className="w-full h-8 bg-gray-50 dark:bg-gray-800"
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Sum of selected questions
                        </p>
                      </div>

                      {/* Days to Complete Field */}
                      <div className="space-y-2">
                        <Label htmlFor="days_to_complete" className="text-sm font-medium">Days to Complete</Label>
                        <Input
                          type="number"
                          {...createForm.register('days_to_complete', { valueAsNumber: true })}
                          min={1}
                          max={30}
                          className="w-full h-8"
                          defaultValue={7}
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {createForm.watch('days_to_complete')
                            ? `Due: ${new Date(Date.now() + (createForm.watch('days_to_complete') || 7) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}`
                            : "Deadline calculation"
                          }
                        </p>
                        {createForm.formState.errors.days_to_complete && (
                          <p className="text-red-600 text-sm">{createForm.formState.errors.days_to_complete.message}</p>
                        )}
                      </div>
                    </div>
                  </form>
                )}

                {/* Edit Form */}
                {isEditing && (
                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex-1 min-h-0 flex flex-col space-y-4 sm:space-y-6 overflow-hidden">
                    
                    {/* Candidate Info - Fixed */}
                    {editingAssessment && (
                      <div className="flex-shrink-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Label className="text-xs font-medium block mb-1">Candidate:</Label>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={editingAssessment.candidate.profile_photo_url?.url} />
                            <AvatarFallback>
                              {editingAssessment.candidate.first_name[0]}{editingAssessment.candidate.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm text-foreground dark:text-foreground">
                              {editingAssessment.candidate.first_name} {editingAssessment.candidate.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                              {editingAssessment.candidate.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Questions Selection - Takes remaining space */}
                    <div className="flex-1 min-h-0 flex flex-col space-y-0.5 overflow-hidden">
                      <Label className="text-sm font-medium flex-shrink-0">Update Questions</Label>
                      
                      {/* Tag Selection - Fixed Height */}
                      {getUniqueTags().length > 0 && (
                        <div className="flex-shrink-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Quick Select by Tags:</Label>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
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
                                      variant={isTagSelected ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => toggleTagSelection(tag, field)}
                                      className="text-xs h-6 px-2 sm:h-7"
                                    >
                                      {isTagSelected && "✓ "}{tag}
                                      <Badge variant="secondary" className="ml-1 text-xs h-3 sm:h-4 px-1">
                                        {questions.filter(q => q.tags?.includes(tag)).length}
                                      </Badge>
                                    </Button>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                            Click tags to select/deselect all questions with that tag
                          </p>
                        </div>
                      )}

                      {/* Questions List - Only this scrolls, NOW WITH MORE SPACE! */}
                      <Controller
                        name="assigned_questions"
                        control={editForm.control}
                        render={({ field }) => (
                          <div className="flex-1 min-h-0 border border-border dark:border-border rounded-lg flex flex-col overflow-hidden">
                            {/* Header with Integrated Count and Selected Tags - Fixed */}
                            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 border-b border-border dark:border-border bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-medium">Individual Questions</span>
                                <Badge variant="secondary" className="text-xs">
                                  {field.value?.length || 0} / {questions.length}
                                </Badge>
                                {field.value?.length > 0 && editTotalMarks > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {editTotalMarks} pts
                                  </Badge>
                                )}
                                {selectedTags.size > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">Tags:</span>
                                    {Array.from(selectedTags).slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="default" className="text-xs h-4">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {selectedTags.size > 3 && (
                                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                        +{selectedTags.size - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    field.onChange(questions.map((q) => q._id));
                                    setSelectedTags(new Set(getUniqueTags()));
                                  }}
                                  className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                                >
                                  <span className="sm:hidden">All</span>
                                  <span className="hidden sm:inline">Select All</span>
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => selectRequiredQuestions(field)}
                                  className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                                >
                                  <span className="sm:hidden">Req</span>
                                  <span className="hidden sm:inline">Required</span>
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    field.onChange([]);
                                    setSelectedTags(new Set());
                                  }}
                                  className="text-xs h-6 px-2 sm:h-7 flex-1 sm:flex-none"
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>


                            {/* EXPANDED SCROLLABLE AREA - No Footer Taking Space! */}
                            <div className="flex-1 min-h-0 overflow-y-auto">
                              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                {questions.map((question) => {
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
                                            
                                            // Update selected tags if this was the last question of a tag
                                            const newSelectedTags = new Set(selectedTags);
                                            question.tags?.forEach((tag) => {
                                              const otherQuestionsWithTag = questions.filter(
                                                q => q._id !== question._id && 
                                                q.tags?.includes(tag) && 
                                                currentValue.includes(q._id)
                                              );
                                              if (otherQuestionsWithTag.length === 0) {
                                                newSelectedTags.delete(tag);
                                              }
                                            });
                                            setSelectedTags(newSelectedTags);
                                          }
                                        }}
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-foreground dark:text-foreground break-words line-clamp-2">
                                          {question.text}
                                        </p>
                                        <div className="flex items-center flex-wrap gap-1 mt-1">
                                          <Badge variant="outline" className="text-xs h-4">
                                            {question.type.toUpperCase()}
                                          </Badge>
                                          {question.max_score && (
                                            <Badge variant="secondary" className="text-xs h-4">
                                              {question.max_score} pts
                                            </Badge>
                                          )}
                                          {question.tags && question.tags.slice(0, 2).map((tag) => (
                                            <Badge 
                                              key={tag} 
                                              variant={selectedTags.has(tag) ? "default" : "secondary"} 
                                              className="text-xs h-4"
                                            >
                                              {tag}
                                            </Badge>
                                          ))}
                                          {question.tags && question.tags.length > 2 && (
                                            <span className="text-xs text-muted-foreground self-center">
                                              +{question.tags.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* NO FOOTER - More space for questions! */}
                            
                          </div>
                        )}
                      />
                      {editForm.formState.errors.assigned_questions && (
                        <p className="text-red-600 text-sm mt-1">{editForm.formState.errors.assigned_questions.message}</p>
                      )}
                    </div>

                    {/* Assessment Configuration - Fixed at bottom */}
                    <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* SEB Field */}
                      <div className="">
                        <Label htmlFor="edit_is_seb" className="text-sm font-medium">Safe Exam Browser (SEB)</Label>
                        <Controller
                          name="is_seb"
                          control={editForm.control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2 p-2 border border-border dark:border-border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="edit_is_seb"
                              />
                              <Label htmlFor="edit_is_seb" className="text-sm font-normal">
                                Required
                              </Label>
                            </div>
                          )}
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Secure browser requirement
                        </p>
                      </div>

                      {/* AI Proctoring Field - NEW */}
                      <div className="">
                        <Label htmlFor="edit_is_aiproctored" className="text-sm font-medium">AI Proctoring</Label>
                        <Controller
                          name="is_aiproctored"
                          control={editForm.control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2 p-2 border border-border dark:border-border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="edit_is_aiproctored"
                              />
                              <Label htmlFor="edit_is_aiproctored" className="text-sm font-normal">
                                Enabled
                              </Label>
                            </div>
                          )}
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          AI-based monitoring
                        </p>
                      </div>

                      {/* Exam Duration Field */}
                      <div className="space-y-2">
                        <Label htmlFor="edit_exam_duration" className="text-sm font-medium">
                          Exam Duration (Required)
                        </Label>
                        <Input
                          type="number"
                          {...editForm.register('exam_duration', { valueAsNumber: true })}
                          min={1}
                          max={600}
                          placeholder="60"
                          className="w-full h-8"
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {editForm.watch('exam_duration')
                            ? `${Math.floor((editForm.watch('exam_duration') || 60) / 60)}h ${(editForm.watch('exam_duration') || 60) % 60}m`
                            : "Time in minutes"
                          }
                        </p>
                        {editForm.formState.errors.exam_duration && (
                          <p className="text-red-600 text-sm">{editForm.formState.errors.exam_duration.message}</p>
                        )}
                      </div>

                      {/* Total Marks Field */}
                      <div className="space-y-2">
                        <Label htmlFor="edit_total_marks" className="text-sm font-medium">Total Marks</Label>
                        <Input
                          id="edit_total_marks"
                          type="number"
                          value={editTotalMarks}
                          readOnly
                          className="w-full h-8 bg-gray-50 dark:bg-gray-800"
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Sum of selected questions
                        </p>
                      </div>

                      {/* Days to Complete Field */}
                      <div className="space-y-2">
                        <Label htmlFor="edit_days_to_complete" className="text-sm font-medium">Days to Complete</Label>
                        <Input
                          type="number"
                          {...editForm.register('days_to_complete', { valueAsNumber: true })}
                          min={1}
                          max={30}
                          className="w-full h-8"
                          defaultValue={7}
                        />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {editForm.watch('days_to_complete')
                            ? `Due: ${new Date(Date.now() + (editForm.watch('days_to_complete') || 7) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}`
                            : "Deadline calculation"
                          }
                        </p>
                        {editForm.formState.errors.days_to_complete && (
                          <p className="text-red-600 text-sm">{editForm.formState.errors.days_to_complete.message}</p>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border dark:border-border bg-background">
            <div className="flex gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={isEditing ? editForm.handleSubmit(onEditSubmit) : createForm.handleSubmit(onCreateSubmit)}
                disabled={submitting}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                )}
                <span className="sm:hidden">{isEditing ? 'Update' : 'Assign'}</span>
                <span className="hidden sm:inline">{isEditing ? 'Update Assessment' : 'Assign Assessment'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={closeViewDialog}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Assessment Details</DialogTitle>
            <DialogDescription>
              Complete details of the technical assessment
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Candidate Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Candidate Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={selectedAssessment.candidate.profile_photo_url?.url} />
                        <AvatarFallback>
                          {selectedAssessment.candidate.first_name[0]}
                          {selectedAssessment.candidate.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedAssessment.candidate.first_name} {selectedAssessment.candidate.last_name}
                        </h3>
                        <p className="text-muted-foreground">{selectedAssessment.candidate.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Questions ({selectedAssessment.questions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedAssessment.questions.map((question, index) => (
                        <div key={question._id} className="border rounded-lg p-4" onClick={() => {console.log(question)}}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium mb-2">
                                {index + 1}. {question.text}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">
                                  {question.type.toUpperCase()}
                                </Badge>
                                <Badge variant="secondary">
                                  {question.max_score} points
                                </Badge>
                                {question.is_must_ask && (
                                  <Badge variant="destructive">
                                    REQUIRED
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Assessment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={getStatusColor(selectedAssessment.status)}>
                        {selectedAssessment.status.toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Due Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{selectedAssessment.due_at ? formatDate(selectedAssessment.due_at) : 'No due date'}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Assigned By</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{selectedAssessment.assigned_by.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAssessment.assigned_by.role}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Total Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedAssessment.questions.reduce((total, q) => total + q.max_score, 0)} pts
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Assigned At</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{formatDate(selectedAssessment.assigned_at)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Last Updated</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{formatDate(selectedAssessment.updatedAt)}</p>
                    </CardContent>
                  </Card>
                </div>
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
              Are you sure you want to delete the assessment assigned to{' '}
              <span className="font-semibold">{deleteTargetName}</span>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-4">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 text-sm">⚠️</div>
              <div className="text-sm text-yellow-800">
                This action cannot be undone. The assessment will be permanently removed 
                from the candidate's record.
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
                'Delete Assessment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentManagement;
