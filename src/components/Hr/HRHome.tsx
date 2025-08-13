import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, Users, UserCheck, UserX, Calendar, FileText } from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";
import { DialogDescription } from '@radix-ui/react-dialog';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Label } from '@radix-ui/react-label';
import { Textarea } from '../ui/textarea';

type StageHistory = { _id: string; from_stage: string; to_stage: string; changed_by: { _id: string; name: string; email: string}; remarks: string; changed_at: string }
interface Question {
  _id: string;
  question: string;
  input_type: string;
  tags?: string[];
  // Add other properties as needed
}

interface SingleCandidateFormData {
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
  shortlisted: boolean;
  profile_photo_url: {
    url: string;
    publicId: string;
  };
  applied_job: {
    name: string;
    description: {
      location: string;
      country: string;
      time: string;
      expInYears: string;
      salary: string;
    };
  };
  current_stage: "registered" | "hr" | "assessment" | "tech" | "manager" | "feedback" | "shortlisted";
  status: "active" | "inactive" | "withdrawn" | "rejected" | "hired" | "deleted";
  email_verified: boolean;
  registration_date: string;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
  documents?: { _id: string; document_type: string; document_url: string }[];
  hrQuestionnaire?: { _id: string; status: string }[];
  assessments?: { _id: string; status: string }[];
  interviews?: { _id: string; status: string }[];
  stage_history?: StageHistory[];
  default_hr_responses?: Array<{
    _id: string;
    question_text: string;
    response: string | string[];
    input_type: "text" | "audio" | "date" | "mcq" | "checkbox";
  }>;
};

const HRHome = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [assignQuestionnaireOpen, setAssignQuestionnaireOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Add these state variables to your component
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Add these state variables to your component
  const [targetCandidate, setTargetCandidate] = useState<Candidate | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const copyToClipboard = async (url: string, docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedDocId(docId);
      toast.success('Document link copied to clipboard');
      
      setTimeout(() => setCopiedDocId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  // Create a separate form for single candidate assignment
  const singleCandidateForm = useForm<SingleCandidateFormData>({
    defaultValues: {
      assigned_questions: [],
      days_to_complete: 7,
    },
  });

    // Update the function to handle null candidates:
  const openAssignQuestionnaireForCandidate = (candidate: Candidate | null) => {
    if (!candidate) {
      toast.error('No candidate selected');
      return;
    }
    
    setTargetCandidate(candidate);
    setDialogOpen(false);
    setAssignQuestionnaireOpen(true);
    singleCandidateForm.reset({
      assigned_questions: [],
      days_to_complete: 7,
    });
    setSelectedTags(new Set());
  };


  // Function to close assign questionnaire dialog
  const closeAssignQuestionnaireDialog = () => {
    setAssignQuestionnaireOpen(false);
    setTargetCandidate(null);
    singleCandidateForm.reset();
    setSelectedTags(new Set());
  };
  // Add this useEffect after your existing useEffect for loading candidates
  useEffect(() => {
    fetchAllData();
  }, []);
  // Add these functions to your component
  const rejectCandidate = async (candidateId: string, reason: string) => {
    setIsRejecting(true);
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/reject`, {
        rejection_reason: reason
      });
      
      if (response.data.success) {
        toast.success("Candidate rejected successfully");
        fetchAllData(); // Refresh the data
        setDialogOpen(false); // Close candidate details dialog
        setRejectDialogOpen(false); // Close rejection dialog
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reject candidate");
    } finally {
      setIsRejecting(false);
    }
  };


  const shortlistCandidate = async (candidateId: string, reason?: string) => {
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/shortlist`, {
        shortlist_reason: reason
      });
      
      if (response.data.success) {
        toast.success("Candidate shortlisted successfully");
        fetchAllData(); // Refresh the data
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to shortlist candidate");
    }
  };



  // Submit handler for single candidate assignment
  const onSingleCandidateSubmit = async (data: SingleCandidateFormData) => {
    if (!targetCandidate) {
      toast.error('No candidate selected');
      return;
    }

    try {
      setSubmitting(true);
      const assignments = [{
        candidate: targetCandidate._id,
        question_ids: data.assigned_questions,
        days_to_complete: data.days_to_complete
      }];

      const response = await api.post('/org/hr-questionnaires/assign', { assignments });
      
      if (response.data.success) {
        toast.success(`Questionnaire assigned to ${targetCandidate.first_name} ${targetCandidate.last_name}`);
        closeAssignQuestionnaireDialog();
        fetchAllData();
      } else {
        toast.error(response.data.message || 'Failed to assign questionnaire');
      }
    } catch (error: any) {
      console.error('Failed to assign questionnaire:', error);
      toast.error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to assign questionnaire'
      );
    } finally {
      setSubmitting(false);
    }
  };
  // Function to get unique tags from questions
const getUniqueTags = (): string[] => {
  if (!questions) return [];
  const tagsSet = new Set<string>();
  questions.forEach((q) => {
    q.tags?.forEach((tag: string) => tagsSet.add(tag));
  });
  return Array.from(tagsSet);
};

// Function to toggle tag selection
const toggleTagSelection = (tag: string, field: any) => {
  const newSelectedTags = new Set(selectedTags);
  if (selectedTags.has(tag)) {
    newSelectedTags.delete(tag);
    // Remove all questions with this tag from field.value
    const updatedQuestions = field.value.filter((qid: string) => 
      !questions.find((q) => q._id === qid)?.tags?.includes(tag)
    );
    field.onChange(updatedQuestions);
  } else {
    newSelectedTags.add(tag);
    // Add all questions with this tag to field.value
    const questionsToAdd = questions
      .filter((q) => q.tags?.includes(tag) && !field.value.includes(q._id))
      .map((q) => q._id);
    field.onChange([...field.value, ...questionsToAdd]);
  }
  setSelectedTags(newSelectedTags);
};

// Function to fetch all data (questions and candidates)
const fetchAllData = async () => {
  try {
    // Fetch questions for questionnaire assignment
    const questionsResponse = await api.get('/org/hr-questions');
    setQuestions(questionsResponse.data.data || []);
    
    // Refetch candidates to update the table
    const candidatesResponse = await api.get("/org/candidates");
    setCandidates(candidatesResponse.data.data);
    setFilteredCandidates(candidatesResponse.data.data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    toast.error('Failed to reload data');
  }
};




  // Fetch candidates
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

  // Filter candidates
  useEffect(() => {
    let filtered = candidates; // or whatever your candidates array is called

    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'shortlisted') {
        filtered = filtered.filter(candidate => candidate.shortlisted === true);
      } else if (statusFilter === 'shortlisted-only') {
        filtered = filtered.filter(candidate => candidate.shortlisted === true);
      } else if (statusFilter === 'not-shortlisted') {
        filtered = filtered.filter(candidate => candidate.shortlisted === false);
      } else {
        // Regular status filtering
        filtered = filtered.filter(candidate => candidate.status === statusFilter);
      }
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, statusFilter]);


  // Badge color functions
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "withdrawn": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "hired": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Statistics
  const stats = {
    total: candidates.length,
    active: candidates.filter(c => c.status === 'active').length,
    hr_stage: candidates.filter(c => c.current_stage === 'hr').length,
    pending_review: candidates.filter(c => c.current_stage === 'registered').length,
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster
        position="bottom-right"
        containerStyle={{ zIndex: 9999 }}
      />



      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
        <p className="text-muted-foreground">
          Manage candidates and review applications
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_review}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In HR Stage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.hr_stage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Management</CardTitle>
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
                <SelectItem value="tech">Technical</SelectItem>
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
                <SelectItem value="not-shortlisted">Not Shortlisted</SelectItem>
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
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate._id}>
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
                    <TableCell>
                      <div>
                        <div className="text-sm">{candidate.email}</div>
                        <div className="text-sm text-muted-foreground">{candidate.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageColor(candidate.current_stage)}>
                        {candidate.current_stage.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status.toUpperCase()}
                        </Badge>
                        
                        {candidate.shortlisted && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            ⭐ SHORTLISTED
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {formatDate(candidate.registration_date)}
                    </TableCell>
                    <TableCell>
                      {candidate.last_login ? formatDate(candidate.last_login) : 'Never'}
                    </TableCell>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No candidates found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Details Dialog - Outside of table */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Candidate Details</DialogTitle>
          </div>
        </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Comprehensive Personal Information Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>Personal Information</CardTitle>
                    
                    {/* Action Buttons Group - Responsive */}
                    <div className="flex flex-wrap items-center gap-2">
                      <>
                        <Button
                          onClick={() => openAssignQuestionnaireForCandidate(selectedCandidate)}
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg flex-1 sm:flex-none"
                        >
                          📋 <span className="hidden md:inline">Assign Questionnaire</span><span className="md:hidden">Assign</span>
                        </Button>
                        
                        {!selectedCandidate.shortlisted && selectedCandidate.status !== 'rejected' && (
                          <Button
                            onClick={() => shortlistCandidate(selectedCandidate._id, "Shortlisted from candidate review")}
                            variant="default"
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg flex-1 sm:flex-none"
                          >
                            ⭐ <span className="hidden md:inline">Shortlist</span>
                          </Button>
                        )}
                        
                        {selectedCandidate.status !== 'rejected' && (
                          <Button
                            onClick={() => {
                              setCandidateToReject(selectedCandidate);
                              setRejectionReason("");
                              setRejectDialogOpen(true);
                            }}
                            variant="default"
                            size="sm"
                            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg flex-1 sm:flex-none"
                          >
                            ❌ <span className="hidden md:inline">Reject</span>
                          </Button>
                        )}
                        
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg flex-1 sm:flex-none"
                          disabled
                        >
                          📅 <span className="hidden xs:inline">Schedule Interview</span><span className="xs:hidden">Schedule</span>
                        </Button>
                      </>
                    </div>

                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Top Section - Main Profile Info - Responsive */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-2 p-4 sm:p-6 rounded-xl w-full lg:w-auto">
                      <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                        <AvatarImage src={selectedCandidate.profile_photo_url?.url} />
                        <AvatarFallback className="text-lg font-semibold">
                          {selectedCandidate.first_name?.[0]}{selectedCandidate.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedCandidate.first_name} {selectedCandidate.last_name}
                        </h3>
                        <div className="flex justify-center sm:justify-start">
                          <Badge className={getStageColor(selectedCandidate.current_stage)} variant="outline">
                            {selectedCandidate.current_stage?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="break-all">📧 {selectedCandidate.email}</span>
                          <span>📱 {selectedCandidate.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Applied Position - Right Side - Responsive */}
                    <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                        Applied Position
                      </h4>
                      <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {selectedCandidate.applied_job?.name}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {selectedCandidate.applied_job?.description?.location && (
                          <div>📍 {selectedCandidate.applied_job.description.location}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.country && (
                          <div>🌍 {selectedCandidate.applied_job.description.country}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.time && (
                          <div>⏰ {selectedCandidate.applied_job.description.time}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.expInYears && (
                          <div>💼 {selectedCandidate.applied_job.description.expInYears}</div>
                        )}
                        {selectedCandidate.applied_job?.description?.salary && (
                          <div className="sm:col-span-2">💰 {selectedCandidate.applied_job.description.salary}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* HR Responses Section - Responsive */}
                  {selectedCandidate.default_hr_responses && selectedCandidate.default_hr_responses.length > 0 && (
                    <div className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                          📝 Registration HR Responses
                        </h4>
                        <Badge variant="secondary">
                          {selectedCandidate.default_hr_responses.length} answered
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {selectedCandidate.default_hr_responses.map((response, index) => (
                          <div key={response._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {response.input_type.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Q{index + 1}
                              </span>
                            </div>
                            
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">
                              {response.question_text}
                            </h5>

                            <div className="text-sm">
                              {response.input_type === 'audio' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">🎵 Audio Response:</span>
                                  <audio controls className="h-8 w-full sm:w-auto">
                                    <source src={typeof response.response === 'string' ? response.response : ''} type="audio/mpeg" />
                                  </audio>
                                </div>
                              ) : response.input_type === 'date' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">📅</span>
                                  <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs sm:text-sm">
                                    {new Date(response.response as string).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : Array.isArray(response.response) ? (
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400 block mb-1 text-xs sm:text-sm">Selected:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {response.response.map((option, optionIndex) => (
                                      <Badge key={optionIndex} variant="secondary" className="text-xs">
                                        {option}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded border text-xs sm:text-sm">
                                  {response.response}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal Details Grid - Responsive */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">GENDER</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {selectedCandidate.gender || 'Not specified'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">DATE OF BIRTH</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(selectedCandidate.date_of_birth)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">REGISTRATION</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(selectedCandidate.registration_date)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">SHORTLISTED</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {selectedCandidate.shortlisted ? '✅ Yes' : '❌ No'}
                      </p>
                    </div>
                  </div>

                  {/* Address - Responsive */}
                  {selectedCandidate.address && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide">
                        Address
                      </p>
                      <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">
                        {selectedCandidate.address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>




              {/* Status Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Stage</div>
                      <Badge className={getStageColor(selectedCandidate.current_stage)}>
                        {selectedCandidate.current_stage?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge className={getStatusColor(selectedCandidate.status)}>
                        {selectedCandidate.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email Verified</div>
                      <Badge className={selectedCandidate.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedCandidate.email_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Registration Date</div>
                      <div className="text-sm">{formatDate(selectedCandidate.registration_date)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {selectedCandidate.documents && selectedCandidate.documents?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedCandidate.documents.map((doc) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.document_url);
                        const isPDF = /\.pdf$/i.test(doc.document_url);

                        const pdfThumbUrl = isPDF
                          ? doc.document_url
                              .replace("/upload/", "/upload/pg_1/")
                              .replace(/\.pdf$/i, ".jpg")
                          : null;

                        return (
                          <div
                            key={doc._id}
                            className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer bg-white dark:bg-gray-800"
                            onClick={() => window.open(doc.document_url, "_blank")}
                          >
                            {/* Copy Button - NEW */}
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                                onClick={(e) => copyToClipboard(doc.document_url, doc._id, e)}
                                title="Copy document link"
                              >
                                {copiedDocId === doc._id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </Button>
                            </div>

                            {/* Rest stays the same */}
                            <div className="h-52 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                              {isImage ? (
                                <img
                                  src={doc.document_url}
                                  alt={doc.document_type}
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                                />
                              ) : isPDF ? (
                                <img
                                  src={pdfThumbUrl!}
                                  alt={`${doc.document_type} preview`}
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/300x200?text=PDF+Preview+Not+Available";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                  <FileText className="w-10 h-10 mb-2" />
                                  <span className="text-xs">Document</span>
                                </div>
                              )}
                            </div>

                            <div className="p-3">
                              <p className="text-sm font-medium truncate capitalize">{doc.document_type}</p>
                              <p className="text-xs text-gray-500 truncate">{doc.document_url}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}



              {/* HR Questionnaire Status */}
              {selectedCandidate.hrQuestionnaire && selectedCandidate.hrQuestionnaire.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>HR Questionnaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCandidate.hrQuestionnaire.map((questionnaire: { _id: string; status: string }) => (
                        <div key={questionnaire._id} className="flex items-center justify-between">
                          <span>Questionnaire Status:</span>
                          <Badge className={questionnaire.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            {questionnaire.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessments Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.assessments && selectedCandidate.assessments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCandidate.assessments.map((assessment: { _id: string; status: string }) => (
                        <div key={assessment._id} className="flex items-center justify-between">
                          <span>Assessment Status:</span>
                          <Badge>{assessment.status.toUpperCase()}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No assessments assigned yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Interviews Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.interviews && selectedCandidate.interviews.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCandidate.interviews.map((interview: { _id: string; status: string }) => (
                        <div key={interview._id} className="flex items-center justify-between">
                          <span>Interview Status:</span>
                          <Badge>{interview.status.toUpperCase()}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No interviews scheduled yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Stage History */}
              {selectedCandidate.stage_history && selectedCandidate.stage_history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Stage History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCandidate.stage_history.map((stage: StageHistory) => (
                        <div
                          key={stage._id}
                          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 hover:shadow transition"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-semibold capitalize">
                              {stage.from_stage ? `${stage.from_stage} → ${stage.to_stage}` : stage.to_stage}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(stage.changed_at)}
                            </span>
                          </div>

                          {stage.changed_by && (
                            <p className="text-xs text-gray-600">
                              Changed by:{" "}
                              <span className="font-medium">{stage.changed_by.name}</span>{" "}
                              ({stage.changed_by.email})
                            </p>
                          )}

                          {stage.remarks && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              "{stage.remarks}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={assignQuestionnaireOpen} onOpenChange={setAssignQuestionnaireOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Assign Questionnaire</DialogTitle>
            <DialogDescription>
              Assign questions to {targetCandidate?.first_name} {targetCandidate?.last_name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Show Selected Candidate (Read-only) */}
              {targetCandidate && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Assigning to:</Label>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={targetCandidate.profile_photo_url?.url} />
                      <AvatarFallback>
                        {targetCandidate.first_name[0]}{targetCandidate.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {targetCandidate.first_name} {targetCandidate.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {targetCandidate.email}
                      </div>
                      <Badge className={getStageColor(targetCandidate.current_stage)} variant="outline">
                        {targetCandidate.current_stage?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={singleCandidateForm.handleSubmit(onSingleCandidateSubmit)} className="space-y-6">
                {/* Questions Selection */}
                <div className="space-y-3">
                  <Label>Select Questions</Label>
                  
                  {/* Tag Selection */}
                  {getUniqueTags().length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Quick Select by Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueTags().map((tag) => (
                          <Controller
                            key={tag}
                            name="assigned_questions"
                            control={singleCandidateForm.control}
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
                    control={singleCandidateForm.control}
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
                                    <p className="text-sm font-medium">{question.question}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {question.input_type.toUpperCase()}
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
                  {singleCandidateForm.formState.errors.assigned_questions && (
                    <p className="text-red-600 text-sm">{singleCandidateForm.formState.errors.assigned_questions.message}</p>
                  )}
                </div>

                {/* Days to Complete */}
                <div className="space-y-2">
                  <Label htmlFor="days_to_complete">Days to Complete</Label>
                  <Input
                    type="number"
                    {...singleCandidateForm.register('days_to_complete', { valueAsNumber: true })}
                    min={1}
                    max={30}
                    className="w-32"
                    defaultValue={7}
                  />
                  {singleCandidateForm.formState.errors.days_to_complete && (
                    <p className="text-red-600 text-sm">{singleCandidateForm.formState.errors.days_to_complete.message}</p>
                  )}
                </div>
              </form>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeAssignQuestionnaireDialog}>
              Cancel
            </Button>
            <Button 
              onClick={singleCandidateForm.handleSubmit(onSingleCandidateSubmit)}
              disabled={submitting}
            >
              {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Assign Questionnaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Rejection Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              ⚠️ Confirm Candidate Rejection
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please provide a reason for rejecting this candidate.
            </DialogDescription>
          </DialogHeader>

          {candidateToReject && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={candidateToReject.profile_photo_url?.url} />
                    <AvatarFallback>
                      {candidateToReject.first_name[0]}{candidateToReject.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {candidateToReject.first_name} {candidateToReject.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidateToReject.email}
                    </p>
                    <Badge className={getStageColor(candidateToReject.current_stage)} variant="outline">
                      {candidateToReject.current_stage?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a detailed reason for rejecting this candidate..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isRejecting}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be recorded in the candidate's history for future reference.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setCandidateToReject(null);
                setRejectionReason("");
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (candidateToReject && rejectionReason.trim()) {
                  rejectCandidate(candidateToReject._id, rejectionReason.trim());
                }
              }}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  ❌ Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default HRHome;
