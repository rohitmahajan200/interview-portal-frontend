import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash, Search, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Updated schema with correct_answer (singular) and proper required fields
const singleQuestionSchema = z.object({
  text: z.string().trim().min(10, "Question text must be at least 10 characters").max(2000, "Question text too long"),
  type: z.enum(["mcq", "coding", "essay"], {
    message: "Question type must be mcq, coding, or essay"
  }),
  options: z.array(z.string().trim().min(1)).optional(),
  correct_answer: z.string().min(1, "Correct answer is required"), // Changed to singular
  explanation: z.string().trim().max(1000, "Explanation too long").optional(),
  is_must_ask: z.boolean(),
  max_score: z.number().max(100, "Max 100 score").positive("Max score must be positive"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    message: "Difficulty must be easy, medium, or hard"
  }).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
}).strict()
.refine((data) => {
  if (data.type === "mcq" && (!data.options || data.options.length < 2)) {
    return false;
  }
  return true;
}, {
  message: "MCQ questions must have at least 2 options",
  path: ["options"]
})
.refine((data) => {
  // For MCQ, correct_answer must be one of the options
  if (data.type === "mcq" && data.options && data.correct_answer) {
    return data.options.includes(data.correct_answer);
  }
  return true;
}, {
  message: "Correct answer must be one of the provided options",
  path: ["correct_answer"]
});

const questionsArraySchema = z.object({
  questions: z.array(singleQuestionSchema).min(1, "At least one question is required").max(20, "Cannot create more than 20 questions at once")
});

type QuestionsFormValues = z.infer<typeof questionsArraySchema>;

interface Question {
  _id: string;
  text: string;
  type: 'mcq' | 'coding' | 'essay';
  options?: string[];
  correct_answers: string[]; // Backend still uses array
  explanation?: string;
  is_must_ask: boolean;
  max_score: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  createdBy?: {
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

// QuestionOptionsField component with proper typing
// QuestionOptionsField component with proper typing
const QuestionOptionsField = ({ questionIndex, form }: { 
  questionIndex: number, 
  form: UseFormReturn<QuestionsFormValues>
}) => {
  const watchedType = form.watch(`questions.${questionIndex}.type` as const);
  
  // Use manual state management for string arrays instead of useFieldArray
  const currentOptions = form.watch(`questions.${questionIndex}.options`) || [];
  
  const addOption = () => {
    const newOptions = [...currentOptions, ''];
    form.setValue(`questions.${questionIndex}.options`, newOptions);
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = currentOptions.filter((_, index) => index !== optionIndex);
    form.setValue(`questions.${questionIndex}.options`, newOptions);
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...currentOptions];
    newOptions[optionIndex] = value;
    form.setValue(`questions.${questionIndex}.options`, newOptions);
  };

  if (watchedType !== 'mcq') {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Answer Options</Label>
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          onClick={addOption}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Option
        </Button>
      </div>
      <div className="space-y-2">
        {currentOptions.map((option, optionIndex) => (
          <div key={optionIndex} className="flex gap-2 items-center">
            <Input
              value={option}
              onChange={(e) => updateOption(optionIndex, e.target.value)}
              placeholder={`Option ${optionIndex + 1}`}
              className="flex-1"
            />
            {currentOptions.length > 2 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeOption(optionIndex)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Correct Answer Field - different for MCQ vs others
const CorrectAnswerField = ({ questionIndex, form }: { 
  questionIndex: number, 
  form: UseFormReturn<QuestionsFormValues>
}) => {
  const watchedType = form.watch(`questions.${questionIndex}.type` as const);
  const watchedOptions = form.watch(`questions.${questionIndex}.options`);

  if (watchedType === 'mcq') {
    // For MCQ: dropdown to select from options
    return (
      <div>
        <Label htmlFor={`questions.${questionIndex}.correct_answer`}>Correct Answer</Label>
        <Controller
          name={`questions.${questionIndex}.correct_answer` as const}
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select correct answer from options" />
              </SelectTrigger>
              <SelectContent>
                {watchedOptions?.filter(Boolean).map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.questions?.[questionIndex]?.correct_answer && (
          <p className="text-red-600 text-sm mt-1">
            {form.formState.errors.questions[questionIndex].correct_answer?.message}
          </p>
        )}
      </div>
    );
  }

  // For coding/essay: simple text input
  return (
    <div>
      <Label htmlFor={`questions.${questionIndex}.correct_answer`}>Correct Answer/Expected Response</Label>
      <Textarea
        {...form.register(`questions.${questionIndex}.correct_answer` as const)}
        rows={3}
        placeholder="Enter the correct answer or expected response..."
      />
      {form.formState.errors.questions?.[questionIndex]?.correct_answer && (
        <p className="text-red-600 text-sm mt-1">
          {form.formState.errors.questions[questionIndex].correct_answer?.message}
        </p>
      )}
    </div>
  );
};


const InvigilatorQuestionsManagement = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [selectedQuestionForAction, setSelectedQuestionForAction] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const isMobile = useIsCompact(430);
  // Tag mode states
  const [useSameTagsForAll, setUseSameTagsForAll] = useState(false);
  const [globalTags, setGlobalTags] = useState('');

  const form = useForm<QuestionsFormValues>({
    resolver: zodResolver(questionsArraySchema),
    defaultValues: {
      questions: [
        {
          text: '',
          type: 'mcq' as const,
          options: ['', ''],
          correct_answer: '',
          explanation: '',
          is_must_ask: false,
          max_score: 1,
          difficulty: undefined,
          tags: []
        }
      ]
    }
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: "questions"
  });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/org/question');
      setQuestions(response.data.data || []);
      setFilteredQuestions(response.data.data || []);
    } catch (error) {
            toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(q => q.type === typeFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, typeFilter, difficultyFilter]);

  const openCreateDialog = () => {
    setEditingQuestion(null);
    setUseSameTagsForAll(false);
    setGlobalTags('');
    form.reset({
      questions: [
        {
          text: '',
          type: 'mcq',
          options: ['', ''],
          correct_answer: '',
          explanation: '',
          is_must_ask: false,
          max_score: 1,
          difficulty: undefined,
          tags: []
        }
      ]
    });
    setDialogOpen(true);
  };

  const openEditDialog = (question: Question,e) => {
    setEditingQuestion(question);
    form.reset({
      questions: [{
        text: question.text,
        type: question.type,
        options: question.options || [],
        correct_answer: question.correct_answers?.[0] || '', // Convert array to single value
        explanation: question.explanation || '',
        is_must_ask: question.is_must_ask,
        max_score: question.max_score,
        difficulty: question.difficulty,
        tags: question.tags || []
      }]
    });
    setDialogOpen(true);
    e.stopPropagation();
  };

  const handleTypeChangeForQuestion = (questionIndex: number, value: string) => {
    form.setValue(`questions.${questionIndex}.options`, []);
    form.setValue(`questions.${questionIndex}.correct_answer`, '');
    
    if (value === 'mcq') {
      form.setValue(`questions.${questionIndex}.options`, ['', '']);
    }
  };

  const onSubmit = async (data: QuestionsFormValues) => {
    try {
      setIsSubmitting(true);
      
      let payload;

      if (editingQuestion) {
        // Edit mode - single question
        payload = {
          text: data.questions[0].text,
          type: data.questions[0].type,
          correct_answers: [data.questions[0].correct_answer], // Convert to array for backend
          explanation: data.questions[0].explanation || undefined,
          is_must_ask: data.questions[0].is_must_ask,
          max_score: data.questions[0].max_score,
          difficulty: data.questions[0].difficulty,
          tags: data.questions[0].tags || [],
          ...(data.questions[0].options && data.questions[0].options.length > 0 && {
            options: data.questions[0].options.filter(Boolean)
          })
        };

        await api.put(`/org/question/${editingQuestion._id}`, payload);
        toast.success('Question updated successfully');
      } else {
        // Create mode - multiple questions
        const globalTagsArray = useSameTagsForAll && globalTags 
          ? globalTags.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        payload = {
          questions: data.questions.map(q => ({
            text: q.text,
            type: q.type,
            correct_answers: [q.correct_answer], // Convert to array for backend
            explanation: q.explanation || undefined,
            is_must_ask: q.is_must_ask,
            max_score: q.max_score,
            difficulty: q.difficulty,
            tags: useSameTagsForAll ? globalTagsArray : (q.tags || []),
            ...(q.options && q.options.length > 0 && {
              options: q.options.filter(Boolean)
            })
          }))
        };

        await api.post('/org/question', payload);
        toast.success(`${payload.questions.length} question(s) created successfully`);
      }
      
      setDialogOpen(false);
      fetchQuestions();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to save question(s)';
      toast.error(errorMessage || 'Failed to save question(s)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string,e) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      setDeleteLoadingId(id);
      await api.delete(`/org/question/${id}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
            toast.error('Failed to delete question');
    } finally {
      setDeleteLoadingId(null);
    }
    e.stopPropagation();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mcq': return 'bg-blue-100 text-blue-800';
      case 'coding': return 'bg-green-100 text-green-800';
      case 'essay': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold">Technical Questions Management</h1>
          <p className="text-muted-foreground">
            Create and manage technical assessment questions
          </p>
        </div>
        <div className="w-full md:w-auto">
          <Button
            onClick={openCreateDialog}
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 w-4 h-4" /> Add Questions
          </Button>
        </div>
      </div>


      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.length}</div>
            <div className="text-sm text-muted-foreground">Total Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.type === 'mcq').length}</div>
            <div className="text-sm text-muted-foreground">MCQ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.type === 'coding').length}</div>
            <div className="text-sm text-muted-foreground">Coding</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.type === 'essay').length}</div>
            <div className="text-sm text-muted-foreground">Essay</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.is_must_ask).length}</div>
            <div className="text-sm text-muted-foreground">Must Ask</div>
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
                placeholder="Search questions or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card className="flex flex-col overflow-y-auto mb-7">
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
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
                        <TableHead>Question</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Must Ask</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuestions.map((question) => (
                        <TableRow key={question._id}>
                          <TableCell className={`min-w-0 ${isCompact ? 'max-w-[100px]' : 'max-w-[300px]'}`}>
                            {question.text.length > 50 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="truncate text-sm cursor-help">
                                    {question.text}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs break-words">
                                    {question.text}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="text-sm">
                                {question.text}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(question.type)}>
                              {question.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {question.difficulty ? (
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty.toUpperCase()}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{question.max_score}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge 
                                variant={question.is_must_ask ? "destructive" : "secondary"} 
                                className="text-xs" 
                                title={question.is_must_ask ? "Required" : "Optional"}
                              >
                                {isCompact ? truncateTag(question.is_must_ask ? "Required" : "Optional", true, 3) : (question.is_must_ask ? "Required" : "Optional")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {question.tags && question.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {question.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                    title={tag}
                                  >
                                    {isCompact ? truncateTag(tag, false, 12) : tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No tags</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => openEditDialog(question, e)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => handleDelete(question._id, e)}
                                disabled={deleteLoadingId === question._id}
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
                        <TableHead className="w-full">Question</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuestions.map((question) => (
                        <TableRow
                          key={question._id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedQuestionForAction(question)}
                        >
                          <TableCell className="w-full pr-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate text-sm mb-1">
                                {question.text.length > 20 
                                  ? `${question.text.substring(0, 20)}...` 
                                  : question.text}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getTypeColor(question.type)} variant="outline">
                                  {question.type.toUpperCase()}
                                </Badge>
                                {question.difficulty && (
                                  <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                                    {question.difficulty.toUpperCase()}
                                  </Badge>
                                )}
                                <Badge variant={question.is_must_ask ? "destructive" : "secondary"} className="text-xs">
                                  {question.is_must_ask ? "Required" : "Optional"}
                                </Badge>
                              </div>
                              {question.tags && question.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {question.tags.slice(0, 3).map((tag, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {truncateTag(tag, false, 10)}
                                    </Badge>
                                  ))}
                                  {question.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{question.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredQuestions.length === 0 && !loading && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all' 
                      ? 'No questions match your filters.' 
                      : 'No questions found. Create your first question!'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile Actions Dialog */}
      <Dialog open={!!selectedQuestionForAction} onOpenChange={(open) => !open && setSelectedQuestionForAction(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Question Actions</DialogTitle>
            <DialogDescription>
              Choose an action for this technical question
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestionForAction && (
            <div className="space-y-4">
              {/* Question Preview */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm mb-2">
                  {selectedQuestionForAction.text.length > 100 
                    ? `${selectedQuestionForAction.text.substring(0, 100)}...` 
                    : selectedQuestionForAction.text}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(selectedQuestionForAction.type)} variant="outline">
                      {selectedQuestionForAction.type.toUpperCase()}
                    </Badge>
                    {selectedQuestionForAction.difficulty && (
                      <Badge className={getDifficultyColor(selectedQuestionForAction.difficulty)} variant="outline">
                        {selectedQuestionForAction.difficulty.toUpperCase()}
                      </Badge>
                    )}
                    <Badge variant={selectedQuestionForAction.is_must_ask ? "destructive" : "secondary"} className="text-xs">
                      {selectedQuestionForAction.is_must_ask ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>Max Score: {selectedQuestionForAction.max_score}</div>
                    {selectedQuestionForAction.tags && selectedQuestionForAction.tags.length > 0 && (
                      <div>Tags: {selectedQuestionForAction.tags.length}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    const question = selectedQuestionForAction;
                    setSelectedQuestionForAction(null);
                    const mockEvent = { stopPropagation: () => {} };
                    openEditDialog(question, mockEvent);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Question
                </Button>
                
                <Button
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  variant="outline"
                  onClick={() => {
                    const question = selectedQuestionForAction;
                    setSelectedQuestionForAction(null);
                    const mockEvent = { stopPropagation: () => {} };
                    handleDelete(question._id, mockEvent);
                  }}
                  disabled={deleteLoadingId === selectedQuestionForAction._id}
                >
                  {deleteLoadingId === selectedQuestionForAction._id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash className="w-4 h-4 mr-2" />
                  )}
                  Delete Question
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQuestionForAction(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Create Technical Questions'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion 
                ? 'Modify the technical question details below.' 
                : 'Create one or multiple technical assessment questions at once.'
              }
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-1">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              {!editingQuestion && (
                <>
                  {/* Header with Add Question Button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Questions to Create</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {questionFields.length} question{questionFields.length !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendQuestion({
                          text: '',
                          type: 'mcq',
                          options: ['', ''],
                          correct_answer: '',
                          explanation: '',
                          is_must_ask: false,
                          max_score: 1,
                          difficulty: undefined,
                          tags: []
                        })}
                        disabled={questionFields.length >= 20}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </div>

                  {/* Tag Mode Toggle */}
                  <Card className="p-4 bg-blue-50/50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Tag Management</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose how to apply tags to your questions
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="tag-mode" className="text-sm">
                          {useSameTagsForAll ? 'Same tags for all' : 'Individual tags'}
                        </Label>
                        <Switch
                          id="tag-mode"
                          checked={useSameTagsForAll}
                          onCheckedChange={setUseSameTagsForAll}
                        />
                      </div>
                    </div>

                    {/* Global Tags Input */}
                    {useSameTagsForAll && (
                      <div className="mt-4">
                        <Label htmlFor="global-tags">Global Tags (comma separated)</Label>
                        <Input
                          id="global-tags"
                          value={globalTags}
                          onChange={(e) => setGlobalTags(e.target.value)}
                          placeholder="e.g. javascript, algorithms, data-structures"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          These tags will be applied to all questions
                        </p>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* Questions */}
              <div className="space-y-6">
                {questionFields.map((field, questionIndex) => (
                  <Card key={field.id} className="p-4 relative">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">
                        {editingQuestion ? 'Edit Question' : `Question ${questionIndex + 1}`}
                      </h4>
                      {!editingQuestion && questionFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Question Text */}
                      <div>
                        <Label htmlFor={`questions.${questionIndex}.text`}>Question Text</Label>
                        <Textarea 
                          {...form.register(`questions.${questionIndex}.text`)}
                          rows={3}
                          placeholder="Enter the technical question..."
                        />
                        {form.formState.errors.questions?.[questionIndex]?.text && (
                          <p className="text-red-600 text-sm mt-1">
                            {form.formState.errors.questions[questionIndex].text?.message}
                          </p>
                        )}
                      </div>

                      {/* Type and Difficulty Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`questions.${questionIndex}.type`}>Question Type</Label>
                          <Controller
                            name={`questions.${questionIndex}.type`}
                            control={form.control}
                            render={({ field }) => (
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleTypeChangeForQuestion(questionIndex, value);
                                }} 
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                                  <SelectItem value="coding">Coding</SelectItem>
                                  <SelectItem value="essay">Essay</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`questions.${questionIndex}.difficulty`}>Difficulty</Label>
                          <Controller
                            name={`questions.${questionIndex}.difficulty`}
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">Easy</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`questions.${questionIndex}.max_score`}>Max Score</Label>
                          <Input
                            type="number"
                            min="1"
                            {...form.register(`questions.${questionIndex}.max_score`, { valueAsNumber: true })}
                            placeholder="Score"
                          />
                        </div>
                      </div>

                      {/* Options for MCQ */}
                      <QuestionOptionsField 
                        questionIndex={questionIndex}
                        form={form}
                      />

                      {/* Correct Answer - different for MCQ vs others */}
                      <CorrectAnswerField 
                        questionIndex={questionIndex}
                        form={form}
                      />

                      {/* Must Ask Switch */}
                      <div className="flex items-center space-x-2">
                        <Controller
                          name={`questions.${questionIndex}.is_must_ask`}
                          control={form.control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label>Must Ask Question</Label>
                      </div>

                    {(!useSameTagsForAll || editingQuestion) && (
                      <div>
                        <Label htmlFor={`questions.${questionIndex}.tags`}>
                          Tags (comma separated)
                        </Label>
                        <Controller
                          name={`questions.${questionIndex}.tags`}
                          control={form.control}
                          render={({ field }) => (
                            <Input
                              value={Array.isArray(field.value) ? field.value.join(', ') : (field.value || '')}
                              onChange={(e) => {
                                // Just update with raw value during typing
                                field.onChange(e.target.value);
                              }}
                              onBlur={(e) => {
                                // Process tags only when user finishes typing
                                const tagsArray = e.target.value
                                  .split(',')
                                  .map(tag => tag.trim())
                                  .filter(Boolean);
                                field.onChange(tagsArray);
                              }}
                              placeholder="e.g. javascript, algorithms, data-structures"
                            />
                          )}
                        />
                      </div>
                    )}


                      {/* Explanation */}
                      <div>
                        <Label htmlFor={`questions.${questionIndex}.explanation`}>
                          Explanation (Optional)
                        </Label>
                        <Textarea
                          {...form.register(`questions.${questionIndex}.explanation`)}
                          rows={2}
                          placeholder="Provide explanation or reasoning..."
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingQuestion ? 'Updating...' : `Creating ${questionFields.length} question${questionFields.length !== 1 ? 's' : ''}...`}
                    </>
                  ) : (
                    editingQuestion ? 'Update Question' : `Create ${questionFields.length} Question${questionFields.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvigilatorQuestionsManagement;
