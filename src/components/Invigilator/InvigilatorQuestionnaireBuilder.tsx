import { useEffect, useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash, Search, Eye, Users, Clock, CheckCircle, X, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

// Replace the existing schemas with these updated ones
const assessmentSchema = z.object({
  candidates: z.array(z.string().length(24, 'Invalid candidate ID')).min(1, 'Select at least one candidate'),
  assigned_questions: z.array(z.string().length(24, 'Invalid question ID')).min(1, 'Select at least one question'),
  days_to_complete: z.number().min(1, "Must be at least 1 day").max(30, "Cannot exceed 30 days").optional(),
  is_seb: z.boolean(),
  exam_duration: z.number().min(1, "Must be at least 1 minute").max(600, "Cannot exceed 10 hours")
});

const assessmentUpdateSchema = z.object({
  assigned_questions: z.array(z.string().length(24, 'Invalid question ID')).min(1, 'Select at least one question'),
  days_to_complete: z.number().min(1, "Must be at least 1 day").max(30, "Cannot exceed 30 days").optional(),
  is_seb: z.boolean().optional(),
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
  difficulty?: 'easy' | 'medium' | 'hard';
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
  applied_job?: {
    _id: string;
    name: string;
    description: {
      time: string;
      country: string;
      location: string;
      expInYears: string;
      salary: string;
      jobId: string;
    };
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
  exam_duration: number;
  createdAt: string;
  updatedAt: string;
}


const AssessmentManagement = () => {
  // State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  // Update createForm defaultValues
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      candidates: [],
      assigned_questions: [],
      days_to_complete: 7,
      is_seb: false,
      exam_duration: 60, // Default 1 hour
    }
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(assessmentUpdateSchema),
    defaultValues: {
      assigned_questions: [],
      days_to_complete: 7,
      is_seb: false,
      exam_duration: 60, // Default 1 hour
    }
  });


  const isEditing = !!editingAssessment;

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
      console.error('Failed to fetch data:', error);
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
      days_to_complete: 7 // Changed from due_at to days_to_complete with default value
    });
    setDialogOpen(true);
  };


  // Replace the openEditDialog function
  const openEditDialog = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setSelectedTags(new Set());
    
    // Calculate days from due_at if it exists
    const daysToComplete = assessment.due_at ? 
      Math.ceil((new Date(assessment.due_at).getTime() - new Date(assessment.assigned_at).getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    editForm.reset({
      assigned_questions: assessment.questions.map(q => q._id),
      days_to_complete: Math.max(1, daysToComplete),
      is_seb: assessment.is_seb || false,
      exam_duration: assessment.exam_duration || 60,
    });
    setDialogOpen(true);
  };



  const openViewDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setViewDialogOpen(true);
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
      exam_duration: 60,
    });
    editForm.reset();
  };



  const closeViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedAssessment(null);
  };

  // Delete handlers
  const openDeleteDialog = (id: string, candidateName: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(candidateName);
    setDeleteDialogOpen(true);
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
      console.error('Failed to delete assessment:', error);
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
        exam_duration: data.exam_duration
      }));

      const response = await api.post('/org/assessment', { assessments });
      
      toast.success(`${assessments.length} assessment(s) created successfully`);
      closeDialog();
      fetchAllData();
    } catch (error: unknown) {
      console.error('Failed to create assessments:', error);
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
        exam_duration: data.exam_duration,
      };
      
      await api.put(`/org/assessment/${editingAssessment._id}`, payload);
      
      toast.success('Assessment updated successfully');
      closeDialog();
      fetchAllData();
    } catch (error: unknown) {
      console.error('Failed to update assessment:', error);
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

  // Get available candidates (those without assessments)
  const getAvailableCandidates = () => {
    return candidates.filter(candidate => 
      !assessments.some(assessment => assessment.candidate._id === candidate._id)
    );
  };

  // Statistics
  const stats = {
    total: assessments.length,
    pending: assessments.filter(a => a.status === 'pending').length,
    started: assessments.filter(a => a.status === 'started').length,
    completed: assessments.filter(a => a.status === 'completed').length,
    expired: assessments.filter(a => a.status === 'expired').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assessment Management</h1>
          <p className="text-muted-foreground">
            Assign and manage technical assessments for candidates
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={getAvailableCandidates().length === 0}>
          <Plus className="mr-2 w-4 h-4" /> Assign Assessment
        </Button>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow key={assessment._id}>
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
                        <div className="flex flex-wrap gap-1">
                          {assessment.questions.slice(0, 2).map((question) => (
                            <Badge key={question._id} variant="outline" className="text-xs">
                              {question.type.toUpperCase()}
                            </Badge>
                          ))}
                          {assessment.questions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{assessment.questions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assessment.status)}>
                          {assessment.status.toUpperCase()}
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
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(assessment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(assessment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(assessment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(
                              assessment._id, 
                              `${assessment.candidate.first_name} ${assessment.candidate.last_name}`
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>
              {isEditing ? 'Edit Assessment' : 'Assign New Assessment'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the assessment details and questions'
                : 'Select candidates and assign technical questions to create new assessments'
              }
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Create Form */}
              {!isEditing && (
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                  {/* Candidates Selection */}
                  <div className="space-y-3">
                    <Label>Select Candidates ({getAvailableCandidates().length} available)</Label>
                    
                    {/* Job Auto-Select Section - Following HR questionnaire pattern */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Label className="text-sm font-medium mb-2 block">Quick Select by Job Applied:</Label>
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
                                  const candidateCount = getAvailableCandidates().filter(
                                    c => c.applied_job?._id === job._id
                                  ).length;
                                  return (
                                    <SelectItem key={job._id} value={job._id}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{job.name}</span>
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
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a job to automatically choose all candidates who applied for that position
                      </p>
                    </div>

                    {/* Candidate Selection */}
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
                                  Auto-selected candidates for: {getUniqueJobs().find(j => j._id === selectedJobForAutoSelect)?.name}
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
                                const isChecked = field.value?.includes(candidate._id) || false;
                                const isJobMatch = selectedJobForAutoSelect && candidate.applied_job?._id === selectedJobForAutoSelect;
                                
                                return (
                                  <div 
                                    key={candidate._id} 
                                    className={`flex items-start space-x-3 p-2 rounded ${
                                      isJobMatch ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValue, candidate._id]);
                                        } else {
                                          field.onChange(currentValue.filter((id: string) => id !== candidate._id));
                                        }
                                      }}
                                    />
                                    <div className="flex items-center space-x-3 flex-1">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={candidate.profile_photo_url?.url} />
                                        <AvatarFallback>
                                          {candidate.first_name[0]}{candidate.last_name[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium">
                                          {candidate.first_name} {candidate.last_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground truncate">
                                          {candidate.email}
                                        </div>
                                        {/* Show applied job info */}
                                        {candidate.applied_job && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                              {candidate.applied_job.name}
                                            </Badge>
                                            {isJobMatch && (
                                              <Badge variant="default" className="text-xs bg-blue-600">
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
                      <p className="text-red-600 text-sm">{createForm.formState.errors.candidates.message}</p>
                    )}
                  </div>

                  {/* Questions Selection */}
                  <div className="space-y-3">
                    <Label>Select Technical Questions</Label>
                    
                    {/* Tag Selection */}
                    {getUniqueTags().length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">Quick Select by Tags:</Label>
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
                                    variant={isTagSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleTagSelection(tag, field)}
                                    className="text-xs"
                                  >
                                    {isTagSelected && "✓ "}{tag}
                                    <Badge variant="secondary" className="ml-1 text-xs">
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

                    {/* Individual Questions */}
                    <Controller
                      name="assigned_questions"
                      control={createForm.control}
                      render={({ field }) => (
                        <div className="border rounded-lg">
                          <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                            <span className="text-sm font-medium">Select Questions:</span>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange(questions.map(q => q._id));
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
                                        <Badge variant="outline" className="text-xs">
                                          {question.type.toUpperCase()}
                                        </Badge>
                                        {question.difficulty && (
                                          <Badge variant="secondary" className="text-xs">
                                            {question.difficulty.toUpperCase()}
                                          </Badge>
                                        )}
                                        <Badge variant="secondary" className="text-xs">
                                          {question.max_score} pts
                                        </Badge>
                                        {question.tags?.map((tag) => (
                                          <Badge key={tag} variant="secondary" className="text-xs">
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
                            Selected: {field.value?.length || 0} of {questions.length} questions
                          </div>
                        </div>
                      )}
                    />
                    {createForm.formState.errors.assigned_questions && (
                      <p className="text-red-600 text-sm">{createForm.formState.errors.assigned_questions.message}</p>
                    )}
                  </div>
                    {/* SEB & Exam Duration Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* SEB Field */}
                      <div className="space-y-2">
                        <Label htmlFor="is_seb">Safe Exam Browser (SEB)</Label>
                        <Controller
                          name="is_seb"
                          control={createForm.control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="is_seb"
                              />
                              <Label htmlFor="is_seb" className="text-sm font-normal">
                                Require Safe Exam Browser for this assessment
                              </Label>
                            </div>
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          When enabled, candidates must use Safe Exam Browser to take the assessment
                        </p>
                      </div>

                      {/* Exam Duration Field */}
                      <div className="space-y-2">
                        <Label htmlFor="exam_duration">Exam Duration (Required)</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            {...createForm.register('exam_duration', { valueAsNumber: true })}
                            min={1}
                            max={600}
                            placeholder="60"
                            className="w-32"
                          />
                          <div className="text-sm text-muted-foreground">
                            {createForm.watch('exam_duration') ? 
                              `${Math.floor((createForm.watch('exam_duration') || 60) / 60)}h ${(createForm.watch('exam_duration') || 60) % 60}m` 
                              : '1h 0m'
                            }
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Time allocated for the exam in minutes (1-600 minutes / 10 hours max)
                        </p>
                        {createForm.formState.errors.exam_duration && (
                          <p className="text-red-600 text-sm">{createForm.formState.errors.exam_duration.message}</p>
                        )}
                      </div>
                    </div>

                  {/* Days to Complete */}
                  <div className="space-y-2">
                    <Label htmlFor="days_to_complete">Days to Complete (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        {...createForm.register('days_to_complete', { valueAsNumber: true })}
                        min={1}
                        max={30}
                        placeholder="7"
                        className="w-32"
                      />
                      <div className="text-sm text-muted-foreground">
                        {createForm.watch('days_to_complete') ? 
                          `Due: ${new Date(Date.now() + ((createForm.watch('days_to_complete') || 7) * 24 * 60 * 60 * 1000))
                            .toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric'
                            })}` 
                          : 'No deadline'
                        }
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Number of days from assignment date for completion (1-30 days)
                    </p>
                    {createForm.formState.errors.days_to_complete && (
                      <p className="text-red-600 text-sm">{createForm.formState.errors.days_to_complete.message}</p>
                    )}
                  </div>

                </form>
              )}

              {/* Edit Form */}
              {isEditing && (
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                  {/* Candidate Info (Read-only) */}
                  {editingAssessment && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Candidate:</Label>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={editingAssessment.candidate.profile_photo_url?.url} />
                          <AvatarFallback>
                            {editingAssessment.candidate.first_name[0]}{editingAssessment.candidate.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {editingAssessment.candidate.first_name} {editingAssessment.candidate.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {editingAssessment.candidate.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions Selection for Edit */}
                  <div className="space-y-3">
                    <Label>Update Questions</Label>
                    
                    {/* Tag Selection */}
                    {getUniqueTags().length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">Quick Select by Tags:</Label>
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
                                    variant={isTagSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleTagSelection(tag, field)}
                                    className="text-xs"
                                  >
                                    {isTagSelected && "✓ "}{tag}
                                    <Badge variant="secondary" className="ml-1 text-xs">
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

                    {/* Individual Questions */}
                    <Controller
                      name="assigned_questions"
                      control={editForm.control}
                      render={({ field }) => (
                        <div className="border rounded-lg">
                          <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                            <span className="text-sm font-medium">Select Questions:</span>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange(questions.map(q => q._id));
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
                                        <Badge variant="outline" className="text-xs">
                                          {question.type.toUpperCase()}
                                        </Badge>
                                        {question.difficulty && (
                                          <Badge variant="secondary" className="text-xs">
                                            {question.difficulty.toUpperCase()}
                                          </Badge>
                                        )}
                                        <Badge variant="secondary" className="text-xs">
                                          {question.max_score} pts
                                        </Badge>
                                        {question.tags?.map((tag) => (
                                          <Badge key={tag} variant="secondary" className="text-xs">
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
                            Selected: {field.value?.length || 0} of {questions.length} questions
                          </div>
                        </div>
                      )}
                    />
                    {editForm.formState.errors.assigned_questions && (
                      <p className="text-red-600 text-sm">{editForm.formState.errors.assigned_questions.message}</p>
                    )}
                  </div>
                  {/* SEB & Exam Duration Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* SEB Field */}
                      <div className="space-y-2">
                        <Label htmlFor="is_seb">Safe Exam Browser (SEB)</Label>
                        <Controller
                          name="is_seb"
                          control={editForm.control}
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="is_seb"
                              />
                              <Label htmlFor="is_seb" className="text-sm font-normal">
                                Require Safe Exam Browser for this assessment
                              </Label>
                            </div>
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          When enabled, candidates must use Safe Exam Browser to take the assessment
                        </p>
                      </div>

                      {/* Exam Duration Field */}
                      <div className="space-y-2">
                        <Label htmlFor="exam_duration">Exam Duration (Required)</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            {...editForm.register('exam_duration', { valueAsNumber: true })}
                            min={1}
                            max={600}
                            placeholder="60"
                            className="w-32"
                          />
                          <div className="text-sm text-muted-foreground">
                            {createForm.watch('exam_duration') ? 
                              `${Math.floor((createForm.watch('exam_duration') || 60) / 60)}h ${(createForm.watch('exam_duration') || 60) % 60}m` 
                              : '1h 0m'
                            }
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Time allocated for the exam in minutes (1-600 minutes / 10 hours max)
                        </p>
                        {createForm.formState.errors.exam_duration && (
                          <p className="text-red-600 text-sm">{createForm.formState.errors.exam_duration.message}</p>
                        )}
                      </div>
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="days_to_complete">Days to Complete</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        {...editForm.register('days_to_complete', { valueAsNumber: true })}
                        min={1}
                        max={30}
                        placeholder="7"
                        className="w-32"
                      />
                      <div className="text-sm text-muted-foreground">
                        {editForm.watch('days_to_complete') ? 
                          `Due: ${new Date(Date.now() + ((editForm.watch('days_to_complete') || 7) * 24 * 60 * 60 * 1000))
                            .toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric'
                            })}` 
                          : 'No deadline'
                        }
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Number of days from assignment date for completion (1-30 days)
                    </p>
                    {editForm.formState.errors.days_to_complete && (
                      <p className="text-red-600 text-sm">{editForm.formState.errors.days_to_complete.message}</p>
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
              onClick={isEditing ? editForm.handleSubmit(onEditSubmit) : createForm.handleSubmit(onCreateSubmit)}
              disabled={submitting}
            >
              {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {isEditing ? 'Update Assessment' : 'Assign Assessment'}
            </Button>
          </DialogFooter>
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
                        <div key={question._id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium mb-2">
                                {index + 1}. {question.text}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">
                                  {question.type.toUpperCase()}
                                </Badge>
                                {question.difficulty && (
                                  <Badge variant="secondary">
                                    {question.difficulty.toUpperCase()}
                                  </Badge>
                                )}
                                <Badge variant="secondary">
                                  {question.max_score} points
                                </Badge>
                                {question.is_must_ask && (
                                  <Badge variant="destructive">
                                    REQUIRED
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
