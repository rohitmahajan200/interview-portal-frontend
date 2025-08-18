import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, Eye, FileText, User, Mail, Code, PenTool, CheckCircle, Brain, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// TypeScript interfaces for Assessment Review
interface AssessmentStatistics {
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageScore: number;
  recentEvaluations: RecentEvaluation[];
}

interface RecentEvaluation {
  _id: string;
  candidate: {
    _id: string;
    email: string;
  };
  totalScore: number;
  evaluatedAt: string;
}

interface StatisticsAPIResponse {
  success: boolean;
  data: AssessmentStatistics;
}

interface AssessmentListItem {
  _id: string;
  candidate: {
    _id: string;
    email: string;
    profile_photo_url?: {
      url: string;
      publicId: string;
    };
    name: string;
  };
  assessment: {
    _id: string;
    assigned_at: string;
    due_at: string;
    status: string;
    assigned_by: {
      name: string;
      email: string;
    };
  };
  status: 'pending' | 'completed';
  total_score?: number;
  ai_score?: number;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResponse {
  question_id: string;
  type: 'mcq' | 'coding' | 'essay';
  question_text: string;
  answer?: any;
  ai_score?: number;
  flagged?: boolean;
  max_score?: number;
}

interface AssessmentDetail {
  _id: string;
  candidate: {
    _id: string;
    name: string;
    email: string;
    profile_photo_url?: {
      url: string;
      publicId: string;
    };
    current_stage?: string; // ✅ Added for stage updates
    status?: string; // ✅ Added for stage updates
  };
  assessment: {
    _id: string;
    assigned_at: string;
    due_at: string;
    started_at?: string;
    completed_at?: string;
    status: string;
    assigned_by: {
      name: string;
      email: string;
    };
  };
  responses: AssessmentResponse[];
  total_score?: number;
  ai_score?: number;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}

const AssessmentReview = () => {
  const [assessmentsList, setAssessmentsList] = useState<AssessmentListItem[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statistics, setStatistics] = useState<AssessmentStatistics | null>(null);
  const [loadingActions, setLoadingActions] = useState<{[key: string]: boolean}>({});
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [stageUpdateModal, setStageUpdateModal] = useState(false); // ✅ Added stage update modal state

  const fetchStatistics = async () => {
    try {
      const response = await api.get<StatisticsAPIResponse>('/org/assessment/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const triggerAIEvaluation = async (responseId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    setLoadingActions(prev => ({ ...prev, [`ai_${responseId}`]: true }));
    try {
      const response = await api.post(`/org/assessment/evaluate/${responseId}`);
      
      if (selectedAssessment && selectedAssessment._id === responseId) {
        await fetchAssessmentDetail(responseId);
      }
      
      await fetchAssessmentsList();
      await fetchStatistics(); // Refresh statistics
      console.log('AI evaluation completed:', response.data.message);
    } catch (error) {
      console.error('AI evaluation failed:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [`ai_${responseId}`]: false }));
    }
  };

  // ✅ Added stage update function
  const updateCandidateStage = async (candidateId: string, newStage: string, remarks?: string) => {
    setLoadingActions(prev => ({ ...prev, [`stage_${candidateId}`]: true }));
    try {
      await api.patch(`/org/candidates/${candidateId}/update-stage`, {
        newStage,
        remarks
      });
      
      await Promise.all([
        fetchAssessmentDetail(selectedAssessment!._id),
        fetchAssessmentsList()
      ]);
      
      setStageUpdateModal(false);
      console.log('Stage updated successfully');
    } catch (error) {
      console.error('Failed to update stage:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [`stage_${candidateId}`]: false }));
    }
  };

  const fetchAssessmentsList = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/org/assessment-responses');
      setAssessmentsList(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch assessments list:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchAssessmentDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/org/assessment-responses/${id}`);
      setSelectedAssessment(response.data.data);
    } catch (error) {
      console.error('Failed to fetch assessment details:', error);
      setSelectedAssessment(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openAssessmentDialog = async (id: string) => {
    setIsDialogOpen(true);
    await fetchAssessmentDetail(id);
  };

  const closeAssessmentDialog = () => {
    setIsDialogOpen(false);
    setSelectedAssessment(null);
    setEditingResponse(null);
    setStageUpdateModal(false); // ✅ Reset stage modal state
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq':
        return <CheckCircle className="h-4 w-4" />;
      case 'coding':
        return <Code className="h-4 w-4" />;
      case 'essay':
        return <PenTool className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    const config = {
      mcq: { label: 'MCQ', variant: 'default' as const },
      coding: { label: 'Coding', variant: 'secondary' as const },
      essay: { label: 'Essay', variant: 'outline' as const }
    };
    
    const { label, variant } = config[type as keyof typeof config] || { label: type.toUpperCase(), variant: 'outline' as const };
    
    return (
      <Badge variant={variant} className="text-xs">
        {getQuestionTypeIcon(type)}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  const renderAnswer = (response: AssessmentResponse) => {
    const { type, answer } = response;

    if (!answer) {
      return <span className="text-muted-foreground italic">No answer provided</span>;
    }

    switch (type) {
      case 'mcq':
        return <Badge variant="outline">{String(answer)}</Badge>;
      case 'coding':
        return (
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
            <pre>{String(answer)}</pre>
          </div>
        );
      case 'essay':
        return <p className="whitespace-pre-wrap text-sm">{String(answer)}</p>;
      default:
        return <p className="whitespace-pre-wrap text-sm">{String(answer)}</p>;
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    fetchAssessmentsList();
    fetchStatistics();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Enhanced Header with Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment Reviews</h1>
          <p className="text-muted-foreground">Review and evaluate candidate assessment responses</p>
        </div>
        <div className="flex items-center gap-4">
          {statistics && (
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                Total: {statistics.totalAssessments}
              </Badge>
              <Badge variant="secondary">
                Pending: {statistics.pendingAssessments}
              </Badge>
              <Badge variant="default">
                Completed: {statistics.completedAssessments}
              </Badge>
              <Badge variant="outline">
                Avg Score: {statistics.averageScore.toFixed(1)}
              </Badge>
            </div>
          )}
          <Badge variant="outline" className="text-sm">
            {assessmentsList.length} Total Assessments
          </Badge>
        </div>
      </div>

      {/* Assessments Table */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessment Responses
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
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentsList.map((item) => (
                    <TableRow 
                      key={item._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openAssessmentDialog(item._id)}
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
                        <Badge 
                          variant={item.status === 'completed' ? 'default' : 'secondary'}
                          className={cn(
                            item.status === 'completed' && 'bg-green-100 text-green-800 hover:bg-green-200'
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.ai_score !== undefined ? (
                          <span className="font-medium">{item.total_score}</span>
                        ) : (
                          <Badge variant="secondary" className="text-orange-600">
                            Not evaluated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(item.updatedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.ai_score === undefined && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => triggerAIEvaluation(item._id, e)}
                              disabled={!!loadingActions[`ai_${item._id}`]}
                              className="flex items-center gap-2 mr-2"
                            >
                              {loadingActions[`ai_${item._id}`] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                <Brain className="h-3 w-3" />
                              )}
                              {loadingActions[`ai_${item._id}`] ? 'Evaluating...' : 'Evaluate'}
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssessmentDialog(item._id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedAssessment?.candidate.name || 'Assessment Details'}
            </DialogTitle>
            <DialogDescription>
              Review assessment responses and provide evaluation
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center items-center flex-1">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : selectedAssessment ? (
            <>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6 pb-4">
                    {/* Candidate Info */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage 
                              src={selectedAssessment.candidate.profile_photo_url?.url} 
                              alt={selectedAssessment.candidate.name} 
                            />
                            <AvatarFallback className="text-lg">
                              {getInitials(selectedAssessment.candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <h3 className="text-xl font-semibold">{selectedAssessment.candidate.name}</h3>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedAssessment.candidate.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="font-medium">Status: </span>
                                <Badge variant={selectedAssessment.status === 'completed' ? 'default' : 'secondary'}>
                                  {selectedAssessment.status}
                                </Badge>
                              </div>
                              {/* ✅ Added current stage display */}
                              {selectedAssessment.candidate.current_stage && (
                                <div>
                                  <span className="font-medium">Current Stage: </span>
                                  <Badge variant="outline">{selectedAssessment.candidate.current_stage}</Badge>
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Evaluation: </span>
                                {selectedAssessment.ai_score !== undefined ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    AI Evaluated
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-orange-600">
                                    Not Evaluated
                                  </Badge>
                                )}
                              </div>
                              {selectedAssessment.total_score !== undefined && (
                                <div>
                                  <span className="font-medium">Total Score: </span>
                                  <span className="text-lg font-bold">{selectedAssessment.total_score}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Assessment Timeline */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Assessment Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Assigned</p>
                            <p className="text-muted-foreground">{formatDate(selectedAssessment.assessment.assigned_at)}</p>
                            <p className="text-xs">by {selectedAssessment.assessment.assigned_by.name}</p>
                          </div>
                          <div>
                            <p className="font-medium">Due Date</p>
                            <p className="text-muted-foreground">{formatDate(selectedAssessment.assessment.due_at)}</p>
                          </div>
                          {selectedAssessment.assessment.started_at && (
                            <div>
                              <p className="font-medium">Started</p>
                              <p className="text-muted-foreground">{formatDateTime(selectedAssessment.assessment.started_at)}</p>
                            </div>
                          )}
                          {selectedAssessment.assessment.completed_at && (
                            <div>
                              <p className="font-medium">Completed</p>
                              <p className="text-muted-foreground">{formatDateTime(selectedAssessment.assessment.completed_at)}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Responses */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Assessment Questions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {selectedAssessment.responses.map((response, index) => (
                            <div key={response.question_id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                                    {getQuestionTypeBadge(response.type)}
                                    {response.max_score && (
                                      <Badge variant="outline" className="text-xs">
                                        Max: {response.max_score} pts
                                      </Badge>
                                    )}
                                  </div>
                                  <h4 className="font-medium text-sm mb-2">{response.question_text}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  {response.flagged && (
                                    <Badge variant="destructive">Flagged</Badge>
                                  )}
                                  {response.ai_score !== undefined && response.max_score && (
                                    <Badge 
                                      variant="outline"
                                      className={getScoreColor(response.ai_score, response.max_score)}
                                    >
                                      Score: {response.ai_score}/{response.max_score}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Answer:</h5>
                                  <div className="bg-muted/50 p-3 rounded">
                                    {renderAnswer(response)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed Footer */}
              <div className="flex justify-between pt-4 border-t flex-shrink-0 bg-background">
                <div className="flex gap-2">
                  {selectedAssessment && selectedAssessment.ai_score === undefined && (
                    <Button
                      variant="outline"
                      onClick={() => triggerAIEvaluation(selectedAssessment._id)}
                      disabled={!!loadingActions[`ai_${selectedAssessment._id}`]}
                      className="flex items-center gap-2"
                    >
                      {loadingActions[`ai_${selectedAssessment._id}`] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                      {loadingActions[`ai_${selectedAssessment._id}`] ? 'Evaluating...' : 'Run AI Evaluation'}
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={closeAssessmentDialog}>
                    Close
                  </Button>
                  {/* ✅ Added Update Stage button - only show if AI evaluated */}
                  {selectedAssessment && selectedAssessment.ai_score !== undefined && (
                    <Button 
                      onClick={() => setStageUpdateModal(true)}
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Update Stage
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">No assessment details found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ Added Stage Update Modal */}
      <Dialog open={stageUpdateModal} onOpenChange={setStageUpdateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Candidate Stage</DialogTitle>
            <DialogDescription>
              Move {selectedAssessment?.candidate.name} to the next stage of the hiring process
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const newStage = formData.get('stage') as string;
            const remarks = formData.get('remarks') as string;
            
            if (selectedAssessment) {
              updateCandidateStage(selectedAssessment.candidate._id, newStage, remarks);
            }
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Stage</label>
                <select name="stage" className="w-full p-2 border rounded mt-1" required>
                  <option value="">Select Stage</option>
                  <option value="assessment">Assessment</option>
                  <option value="tech">Technical Interview</option>
                  <option value="manager">Manager Review</option>
                  <option value="feedback">Final Feedback</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Remarks</label>
                <textarea
                  name="remarks"
                  placeholder="Add transition remarks..."
                  className="w-full p-2 border rounded mt-1"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setStageUpdateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!!selectedAssessment && !!loadingActions[`stage_${selectedAssessment.candidate._id}`]}
              >
                {selectedAssessment && loadingActions[`stage_${selectedAssessment.candidate._id}`] && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                )}
                Update Stage
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentReview;
