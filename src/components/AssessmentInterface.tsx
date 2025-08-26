// src/components/AssessmentInterface.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  FileText,
  Code2,
  CheckCircle,
  AlertTriangle,
  Send,
  Timer,
  BookOpen
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getAllMetrics, getSnapshots, clearProctorStores } from '@/lib/proctorStore';
import { sebHeaders } from "@/lib/sebHashes";


// Types based on your backend models
interface Question {
  _id: string;
  text: string;
  type: 'mcq' | 'coding' | 'essay';
  options?: string[];
  correct_answers?: string[];
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  max_score?: number;
  tags?: string[];
  is_must_ask?: boolean;
}

interface Assessment {
  _id: string;
  assigned_by: {
    name: string;
    email: string;
    role: string;
  };
  assigned_at: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  status: 'pending' | 'started' | 'completed' | 'expired';
  exam_duration?: number;
  time_remaining_ms: number;
  questions: Question[];
}

interface AssessmentResponse {
  question_id: string;
  type: 'mcq' | 'coding' | 'essay';
  question_text: string;
  answer?: any; // <-- any here (submission payload can be varied)
  is_must_ask?: boolean;
  max_score?: number;
}

interface AssessmentInterfaceProps {
  assessmentId: string;
  onSubmissionComplete: () => void;
}

// Format time display
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({
  assessmentId,
  onSubmissionComplete
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessment details
  const fetchAssessment = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = `/candidates/assessments/${assessmentId}`;
      const response: any = await api.get(url, { headers: await sebHeaders(url) });

      const data: any = response.data.data; // any at fetch boundary

      setAssessment(data.assessment as Assessment);
      setTimeRemaining((data.assessment as Assessment).time_remaining_ms);

      // Initialize responses
      const initialResponses: Record<string, string> = {};
      (data.assessment as Assessment).questions.forEach((q) => {
        initialResponses[q._id] = '';
      });
      setResponses(initialResponses);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load assessment');
      toast.error('Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void fetchAssessment();
  }, [fetchAssessment]);

  // Get timer color based on remaining time
  const getTimerColor = (): string => {
    if (!assessment?.exam_duration) return 'text-gray-600';
    const totalMs = assessment.exam_duration * 60 * 1000;
    const percentage = (timeRemaining / totalMs) * 100;

    if (percentage <= 10) return 'text-red-600';
    if (percentage <= 25) return 'text-orange-600';
    return 'text-green-600';
  };

  // Handle response changes
  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Check if all questions are answered
  const areAllQuestionsAnswered = (): boolean => {
    if (!assessment) return false;
    return assessment.questions.every((q) => {
      const response = responses[q._id];
      return response !== undefined && response !== '' && response !== null;
    });
  };

  // Handle submission
  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (!assessment) return;

      if (!isAutoSubmit && !areAllQuestionsAnswered()) {
        toast.error('Please answer all questions before submitting');
        return;
      }

      try {
        setIsSubmitting(true);

        // Prepare responses in backend format
        const submissionResponses: AssessmentResponse[] = assessment.questions.map(
          (question) => ({
            question_id: question._id,
            type: question.type,
            question_text: question.text,
            answer: responses[question._id] || null,
            is_must_ask: question.is_must_ask || false,
            max_score: question.max_score || 0
          })
        );

        // Pull proctor metrics & snapshots at submit time (use any only at the boundary)
        const metrics: any = await getAllMetrics();
        const snaps: any = await getSnapshots();

        const perMinuteLogs = (metrics.minutes as any[]).flatMap((m: any) => {
          const ts = new Date(m.start).toISOString();
          return [
            {
              event: `looking_away_per_minute:${m.away}`,
              severity: 'info',
              timestamp: ts
            },
            {
              event: `speech_started_per_minute:${m.speech}`,
              severity: 'info',
              timestamp: ts
            }
          ];
        });

        const proctoring_logs = [
          ...perMinuteLogs,
          {
            event: `multi_face_total:${metrics.totals?.multiFace ?? 0}`,
            severity: 'warn',
            timestamp: new Date().toISOString()
          },
          {
            event: `no_face_total:${metrics.totals?.noFace ?? 0}`,
            severity: 'warn',
            timestamp: new Date().toISOString()
          }
        ];

        // send to backend along with responses & snapshots
        const submitUrl = `/candidates/assessments/${assessmentId}/submit`;
        await api.post(
          submitUrl,
          { responses: submissionResponses, proctoring_logs, proctoring_snapshots: snaps },
          { headers: await sebHeaders(submitUrl) }
        );


        // optional: clear local stores after successful submit
        clearProctorStores().catch(() => {});

        toast.success('Assessment submitted successfully!');
        onSubmissionComplete();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to submit assessment');
      } finally {
        setIsSubmitting(false);
        setShowSubmitDialog(false);
      }
    },
    [assessment, assessmentId, onSubmissionComplete, responses]
  );

  // Auto submit when time expires
  const handleAutoSubmit = useCallback(async () => {
    toast.error('Time expired! Auto-submitting assessment...');
    await handleSubmit(true);
  }, [handleSubmit]);

  // Timer countdown
  useEffect(() => {
    if (!assessment || assessment.status !== 'started' || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          void handleAutoSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment, timeRemaining, handleAutoSubmit]);

  // Render question based on type
  const renderQuestion = (question: Question, index: number) => {
    const questionNumber = index + 1;
    const isAnswered =
      responses[question._id] !== undefined &&
      responses[question._id] !== '' &&
      responses[question._id] !== null;

    return (
      <Card key={question._id} className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                Question {questionNumber}
              </Badge>
              {question.type === 'mcq' && (
                <CheckCircle className="h-4 w-4 text-blue-600" />
              )}
              {question.type === 'coding' && (
                <Code2 className="h-4 w-4 text-green-600" />
              )}
              {question.type === 'essay' && (
                <FileText className="h-4 w-4 text-purple-600" />
              )}
              <Badge variant="secondary" className="capitalize">
                {question.type}
              </Badge>
              {isAnswered && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✓ Answered
                </Badge>
              )}
            </div>
            {question.max_score && (
              <Badge variant="outline">{question.max_score} pts</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">
                {question.text}
              </p>
            </div>

            {question.type === 'mcq' && question.options && (
              <RadioGroup
                value={responses[question._id] || ''}
                onValueChange={(value) =>
                  handleResponseChange(question._id, value)
                }
                className="space-y-3"
              >
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <RadioGroupItem
                      value={option}
                      id={`${question._id}-${optionIndex}`}
                    />
                    <Label
                      htmlFor={`${question._id}-${optionIndex}`}
                      className="flex-1 cursor-pointer text-sm leading-relaxed"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'coding' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Your Code Solution:</Label>
                <Textarea
                  placeholder="Write your code here..."
                  value={responses[question._id] || ''}
                  onChange={(e) =>
                    handleResponseChange(question._id, (e.target as HTMLTextAreaElement).value)
                  }
                  className="min-h-[200px] font-mono text-sm bg-gray-50 dark:bg-gray-900"
                />
                <p className="text-xs text-muted-foreground">
                  Write clean, well-commented code. Include your approach and any
                  assumptions.
                </p>
              </div>
            )}

            {question.type === 'essay' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Your Answer:</Label>
                <Textarea
                  placeholder="Write your detailed answer here..."
                  value={responses[question._id] || ''}
                  onChange={(e) =>
                    handleResponseChange(question._id, (e.target as HTMLTextAreaElement).value)
                  }
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Provide a comprehensive answer with examples and explanations where
                  appropriate.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !assessment) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-12">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'Assessment not found'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalQuestions = assessment.questions.length;
  const answeredCount = Object.values(responses).filter(
    (r) => r !== '' && r !== null && r !== undefined
  ).length;
  const progress = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header with Timer and Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold">Technical Assessment</span>
              </div>
              <Badge variant="outline">{assessment.questions.length} Questions</Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${getTimerColor()}`}>
                <Timer className="h-4 w-4" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {answeredCount} / {assessment.questions.length} completed
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Time Warning */}
      {timeRemaining <= 5 * 60 * 1000 && timeRemaining > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            ⚠️ Warning: Less than 5 minutes remaining! Please review your answers.
          </AlertDescription>
        </Alert>
      )}

      {/* Questions */}
      <ScrollArea className="h-[60vh]">
        <div className="space-y-6 pr-4">
          {assessment.questions.map((question, index) =>
            renderQuestion(question, index)
          )}
        </div>
      </ScrollArea>

      {/* Submit Button */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {areAllQuestionsAnswered() ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  All questions answered
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  {assessment.questions.length - answeredCount} questions remaining
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowSubmitDialog(true)}
              disabled={isSubmitting || timeRemaining <= 0}
              className="flex items-center gap-2"
              size="lg"
            >
              <Send className="h-4 w-4" />
              Submit Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Questions:</span>
                  <div className="font-semibold">{assessment.questions.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Answered:</span>
                  <div className="font-semibold">{answeredCount}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Time Remaining:</span>
                  <div className="font-semibold">{formatTime(timeRemaining)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="font-semibold">
                    {areAllQuestionsAnswered() ? (
                      <span className="text-green-600">Complete</span>
                    ) : (
                      <span className="text-orange-600">Incomplete</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!areAllQuestionsAnswered() && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have unanswered questions. Are you sure you want to submit?
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              )}
              {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentInterface;
