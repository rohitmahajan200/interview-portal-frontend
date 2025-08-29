import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, Eye, FileText, Play, User, Mail, Briefcase } from 'lucide-react';
import toast, { Toaster } from "react-hot-toast";
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

// TypeScript interfaces (keep your existing interfaces)

interface CandidateStatistics {
  _id: string;
  first_name: string;
  last_name: string;
}

interface RecentResponse {
  _id: string;
  candidate: CandidateStatistics;
  submitted_at: string;
  overallScore: number;
}

interface HRResponseStatistics {
  totalResponses: number;
  aiEvaluatedResponses: number;
  pendingEvaluation: number;
  averageScore: number;
  recentResponses: RecentResponse[];
}

interface StatisticsAPIResponse {
  success: boolean;
  data: HRResponseStatistics;
}

interface CandidateListItem {
  _id: string;
  candidate: {
    name: string;
    email: string;
    profile_photo_url: {
      url: string;
      publicId: string;
    };
    applied_job: string;
  };
  submitted_at: string;
  questionnaire_status: string;
  assigned_at: string;
  response_count: number;
}

interface QuestionResponse {
  _id: string;
  question: {
    _id: string;
    text: string;
    input_type: 'text' | 'audio' | 'mcq' | 'checkbox';
    options: string[];
    tags: string[];
  };
  answer: string;
  attachment?: string;
  flagged: boolean;
  ai_score?: number;
  remarks?: string;
}

interface CandidateDetail {
  _id: string;
  candidate: {
    _id: string;
    name: string;
    email: string;
    profile_photo_url: {
      url: string;
      publicId: string;
    };
    current_stage: string;
    status: string;
    applied_job: {
      _id: string;
      name: string;
      description: {
        time: string;
        country: string;
        location: string;
        expInYears: string;
        salary: string;
      };
    };
  };
  questionnaire: {
    assigned_at: string;
    due_at: string;
    status: string;
    assigned_by: {
      name: string;
      email: string;
    };
  };
  responses: QuestionResponse[];
  submitted_at: string;
  overallScore?: number;
  summary?: string;
}

// Add interface for candidate to reject (matching the structure)
interface CandidateToReject {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_stage: string;
  profile_photo_url?: {
    url: string;
  };
}

const CandidateReview = () => {
  const [responsesList, setResponsesList] = useState<CandidateListItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statistics, setStatistics] = useState<HRResponseStatistics | null>(null);
  const [loadingActions, setLoadingActions] = useState<{[key: string]: boolean}>({});
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [stageUpdateModal, setStageUpdateModal] = useState(false);
  
  // Rejection related state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<CandidateToReject | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchStatistics = async () => {
    try {
      const response = await api.get<StatisticsAPIResponse>('/org/hr-responses/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const triggerAIEvaluation = async (responseId: string) => {
    setLoadingActions(prev => ({ ...prev, [`ai_${responseId}`]: true }));
    try {
      const response = await api.post(`/org/hr-responses/${responseId}/evaluate`);
      
      if (selectedCandidate && selectedCandidate._id === responseId) {
        await fetchCandidateDetail(responseId);
      }
      
      await fetchResponsesList();
      console.log('AI evaluation completed:', response.data.message);
    } catch (error) {
      console.error('AI evaluation failed:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [`ai_${responseId}`]: false }));
    }
  };

  const updateResponseReview = async (responseId: string, questionId: string, updates: {
    flagged?: boolean;
    ai_score?: number;
    remarks?: string;
  }) => {
    setLoadingActions(prev => ({ ...prev, [`review_${questionId}`]: true }));
    try {
      await api.patch(`/org/hr-responses/${responseId}/review`, {
        questionId,
        ...updates
      });
      
      if (selectedCandidate) {
        await fetchCandidateDetail(selectedCandidate._id);
      }
      
      setEditingResponse(null);
    } catch (error) {
      console.error('Failed to update review:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [`review_${questionId}`]: false }));
    }
  };

  const updateCandidateStage = async (responseId: string, candidateId:string, newStage: string, feedback: string, remarks?: string) => {
    setLoadingActions(prev => ({ ...prev, [`stage_${responseId}`]: true }));
    try {
      await api.patch(`/org/candidates/${candidateId}/stage`, {
        newStage,
        remarks,
        internal_feedback: {feedback: feedback}
      });
      
      await Promise.all([
        fetchCandidateDetail(responseId),
        fetchResponsesList()
      ]);
      
      setStageUpdateModal(false);
      setIsDialogOpen(false)
      toast.success(`Candidate stage updated to ${newStage.toUpperCase()}`);
    } catch (error: any) {
      console.error('Failed to update stage:', error);
      toast.error(error?.response?.data?.message || "Failed to update candidate stage");
    } finally {
      setLoadingActions(prev => ({ ...prev, [`stage_${responseId}`]: false }));
    }
  };

  const fetchResponsesList = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/org/hr-responses');
      setResponsesList(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch responses list:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchCandidateDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/org/hr-responses/${id}`);
      setSelectedCandidate(response.data.data);
    } catch (error) {
      console.error('Failed to fetch candidate details:', error);
      setSelectedCandidate(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCandidateDialog = async (id: string) => {
    setIsDialogOpen(true);
    await fetchCandidateDetail(id);
  };

  const closeCandidateDialog = () => {
    setIsDialogOpen(false);
    setSelectedCandidate(null);
    setEditingResponse(null);
    setStageUpdateModal(false);
    setRejectDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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

  const renderAnswer = (response: QuestionResponse) => {
    const { question, answer, attachment } = response;

    switch (question.input_type) {
      case 'audio':
        return (
          <div className="space-y-2">
            {answer && (
              <audio controls className="w-full">
                <source src={answer} type="audio/webm" />
                <source src={answer} type="audio/wav" />
                <source src={answer} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
            )}
            {attachment && (
              <a 
                href={attachment} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
              >
                <Play className="h-4 w-4" />
                Play Audio
              </a>
            )}
          </div>
        );
      case 'checkbox':
        try {
          const selectedOptions = JSON.parse(answer);
          return (
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map((option: string, idx: number) => (
                <Badge key={idx} variant="secondary">{option}</Badge>
              ))}
            </div>
          );
        } catch {
          return <span>{answer}</span>;
        }
      case 'mcq':
        return <Badge variant="outline">{answer}</Badge>;
      default:
        return <p className="whitespace-pre-wrap text-sm">{answer}</p>;
    }
  };

  useEffect(() => {
    fetchResponsesList();
    fetchStatistics();
  }, []);

  const rejectCandidate = async (candidateId: string, reason: string) => {
    setIsRejecting(true);
    try {
      const response = await api.patch(`/org/candidates/${candidateId}/reject`, {
        rejection_reason: reason
      });
      
      if (response.data.success) {
        toast.success("Candidate rejected successfully");
        await fetchResponsesList();
        setIsDialogOpen(false);
        setRejectDialogOpen(false);
        setCandidateToReject(null);
        setRejectionReason("");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reject candidate");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      <Toaster
        position="bottom-right"
        containerStyle={{ zIndex: 9999 }}
      />
      
      {/* Enhanced Header with Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidate Reviews</h1>
          <p className="text-muted-foreground">Review and evaluate candidate questionnaire responses</p>
        </div>
        <div className="flex items-center gap-4">
          {statistics && (
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                Total: {statistics.totalResponses}
              </Badge>
              <Badge variant="secondary">
                Pending: {statistics.pendingEvaluation}
              </Badge>
              <Badge variant="default">
                AI Evaluated: {statistics.aiEvaluatedResponses}
              </Badge>
              <Badge variant="outline">
                Avg Score: {statistics.averageScore.toFixed(1)}/10
              </Badge>
            </div>
          )}
          <Badge variant="outline" className="text-sm">
            {responsesList.length} Total Responses
          </Badge>
        </div>
      </div>

      {/* Responses Table */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            HR Questionnaire Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Applied Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsesList.map((item) => (
                    <TableRow 
                      key={item._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openCandidateDialog(item._id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={item.candidate.profile_photo_url?.url} 
                              alt={item.candidate.name} 
                            />
                            <AvatarFallback>{getInitials(item.candidate.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{item.candidate.name}</p>
                            <p className="text-sm text-muted-foreground">{item.candidate.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.candidate.applied_job}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.questionnaire_status === 'submitted' ? 'default' : 'secondary'}
                          className={cn(
                            item.questionnaire_status === 'submitted' && 'bg-green-100 text-green-800 hover:bg-green-200'
                          )}
                        >
                          {item.questionnaire_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(item.submitted_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCandidateDialog(item._id);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog - FIXED */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-11/12 flex flex-col overflow-y-auto">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedCandidate?.candidate.name || 'Candidate Details'}
            </DialogTitle>
            <DialogDescription>
              Review questionnaire responses and provide evaluation
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center items-center flex-1">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : selectedCandidate ? (
            <>
              {/* Scrollable Content - FIXED */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6 pb-4">
                    {/* Candidate Info */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage 
                              src={selectedCandidate.candidate.profile_photo_url?.url} 
                              alt={selectedCandidate.candidate.name} 
                            />
                            <AvatarFallback className="text-lg">
                              {getInitials(selectedCandidate.candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <h3 className="text-xl font-semibold">{selectedCandidate.candidate.name}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedCandidate.candidate.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedCandidate.candidate.applied_job.name}</span>
                              </div>
                              <div>
                                <span className="font-medium">Current Stage: </span>
                                <Badge variant="outline">{selectedCandidate.candidate.current_stage}</Badge>
                              </div>
                              <div>
                                <span className="font-medium">Status: </span>
                                <Badge variant="secondary">{selectedCandidate.candidate.status}</Badge>
                              </div>
                            </div>
                            <div className="text-sm">
                              <p><span className="font-medium">Location:</span> {selectedCandidate.candidate.applied_job.description.location}</p>
                              <p><span className="font-medium">Experience:</span> {selectedCandidate.candidate.applied_job.description.expInYears}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Questionnaire Timeline */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Questionnaire Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Assigned</p>
                            <p className="text-muted-foreground">{formatDate(selectedCandidate.questionnaire.assigned_at)}</p>
                            <p className="text-xs">by {selectedCandidate.questionnaire.assigned_by.name}</p>
                          </div>
                          <div>
                            <p className="font-medium">Due Date</p>
                            <p className="text-muted-foreground">{formatDate(selectedCandidate.questionnaire.due_at)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Submitted</p>
                            <p className="text-muted-foreground">{formatDate(selectedCandidate.submitted_at)}</p>
                            <Badge variant="default" className="mt-1">{selectedCandidate.questionnaire.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Overall Score */}
                    {selectedCandidate.overallScore && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Overall Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="text-2xl font-bold">
                              {selectedCandidate.overallScore}/10
                            </div>
                            <Badge variant="outline" className="text-lg">
                              Overall Score
                            </Badge>
                          </div>
                          {selectedCandidate.summary && (
                            <p className="text-sm text-muted-foreground">{selectedCandidate.summary}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Responses */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Questionnaire Responses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {selectedCandidate.responses.map((response, index) => (
                            <div key={response._id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-sm">
                                  Q{index + 1}: {response.question.text}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {response.flagged && (
                                    <Badge variant="destructive">Flagged</Badge>
                                  )}
                                  {response.ai_score !== null && response.ai_score !== undefined && (
                                    <Badge variant="outline">
                                      Score: {response.ai_score}/5
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="bg-muted/50 p-3 rounded">
                                  {renderAnswer(response)}
                                </div>

                                {/* Enhanced Review Section */}
                                <div className="flex items-center justify-between border-t pt-3">
                                  <div className="flex items-center gap-4">
                                    {response.remarks && (
                                      <div className="text-sm">
                                        <span className="font-medium">Feedback: </span>
                                        <span className="text-muted-foreground">{response.remarks}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingResponse(editingResponse === response._id ? null : response._id)}
                                      disabled={response.question.input_type === 'audio'}
                                    >
                                      {editingResponse === response._id ? 'Cancel' : 'Review'}
                                    </Button>
                                  </div>
                                </div>

                                {/* Inline Edit Form */}
                                {editingResponse === response._id && (
                                  <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Score (0-5)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          max="5"
                                          defaultValue={response.ai_score || 0}
                                          className="w-full px-3 py-1 border rounded text-sm"
                                          onBlur={(e) => {
                                            const score = parseInt(e.target.value);
                                            if (score >= 0 && score <= 5) {
                                              updateResponseReview(selectedCandidate!._id, response.question._id, { ai_score: score });
                                            }
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`flag-${response._id}`}
                                          defaultChecked={response.flagged}
                                          onChange={(e) => updateResponseReview(selectedCandidate!._id, response.question._id, { flagged: e.target.checked })}
                                        />
                                        <label htmlFor={`flag-${response._id}`} className="text-sm">Flag for review</label>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Remarks</label>
                                      <textarea
                                        defaultValue={response.remarks || ''}
                                        placeholder="Add your feedback..."
                                        className="w-full px-3 py-2 border rounded text-sm"
                                        rows={3}
                                        onBlur={(e) => updateResponseReview(selectedCandidate!._id, response.question._id, { remarks: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                )}

                                {response.question.tags.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Tags:</span>
                                    {response.question.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed Footer - FIXED */}
              <div className="flex justify-between pt-4 border-t flex-shrink-0 bg-background">
                <div className="flex gap-2">
                  {selectedCandidate && !selectedCandidate.overallScore && (
                    <Button
                      variant="outline"
                      onClick={() => triggerAIEvaluation(selectedCandidate._id)}
                      disabled={!!loadingActions[`ai_${selectedCandidate._id}`]}
                      className="flex items-center gap-2"
                    >
                      {loadingActions[`ai_${selectedCandidate._id}`] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Run AI Evaluation
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={closeCandidateDialog}>
                    Close
                  </Button>
                  
                  {/* Reject Button - Added */}
                  {selectedCandidate && selectedCandidate.candidate.status !== 'rejected' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setCandidateToReject({
                          _id: selectedCandidate.candidate._id,
                          first_name: selectedCandidate.candidate.name.split(' ')[0] || '',
                          last_name: selectedCandidate.candidate.name.split(' ').slice(1).join(' ') || '',
                          email: selectedCandidate.candidate.email,
                          current_stage: selectedCandidate.candidate.current_stage,
                          profile_photo_url: selectedCandidate.candidate.profile_photo_url
                        });
                        setRejectionReason("");
                        setRejectDialogOpen(true);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      ❌ Reject Candidate
                    </Button>
                  )}
                  
                  {selectedCandidate && (
                    <Button onClick={() => setStageUpdateModal(true)}>
                      🔄 Update Stage
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">No candidate details found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stage Update Modal - FIXED */}
      <Dialog open={stageUpdateModal} onOpenChange={setStageUpdateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Candidate Stage</DialogTitle>
            <DialogDescription>
              Move {selectedCandidate?.candidate.name} to the next stage of the hiring process
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const newStage = formData.get("stage") as string;
            const remarks = formData.get("remarks") as string;
            const feedback = formData.get("feedback") as string;

            if (selectedCandidate) {
              updateCandidateStage(
                selectedCandidate._id,
                selectedCandidate.candidate._id,
                newStage,
                feedback,
                remarks
              );
            }
          }}>
            <div className="space-y-4">
              {/* Stage Selection */}
              <div>
                <label className="text-sm font-medium">New Stage</label>
                <select name="stage" className="w-full p-2 border rounded mt-1" required>
                  <option value="">Select Stage</option>
                  <option value="assessment">Assessment</option>
                  <option value="manager">Manager Review</option>
                  <option value="feedback">Final Feedback</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-sm font-medium">Remarks</label>
                <textarea
                  name="remarks"
                  placeholder="Add transition remarks..."
                  className="w-full p-2 border rounded mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be stored in stage history.
                </p>
              </div>

              {/* Internal Feedback (compulsory) */}
              <div>
                <label className="text-sm font-medium">
                  Internal Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="feedback"
                  placeholder="Provide internal feedback for this stage update..."
                  className="w-full p-2 border rounded mt-1"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This feedback will be attached to the candidate's profile and visible only internally.
                </p>
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setStageUpdateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!!selectedCandidate && !!loadingActions[`stage_${selectedCandidate._id}`]}
              >
                {selectedCandidate && loadingActions[`stage_${selectedCandidate._id}`] && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                )}
                Update Stage
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Dialog - FIXED */}
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

export default CandidateReview;
