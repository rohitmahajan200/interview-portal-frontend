import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash, Search, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Switch } from '../ui/switch';

// Validation schema for technical question form
const questionSchema = z.object({
  text: z.string().min(10, 'Question must be at least 10 characters'),
  type: z.enum(['mcq', 'coding', 'essay', 'voice', 'case_study']),
  options: z.array(z.string()).optional(),
  correct_answers: z.array(z.any()).optional(),
  explanation: z.string().optional(),
  is_must_ask: z.boolean().default(false),
  max_score: z.number().min(1).max(100).default(1),
  attachments: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.string().optional(),
  job_tags: z.string().optional(),
  stage: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

// Type for question from API
interface Question {
  _id: string;
  text: string;
  type: 'mcq' | 'coding' | 'essay' | 'voice' | 'case_study';
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

const InvigilatorQuestionsManagement = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showOptions, setShowOptions] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: 'mcq',
      is_must_ask: false,
      max_score: 1,
    }
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options',
  });

  const watchType = watch('type');

  useEffect(() => {
    setShowOptions(watchType === 'mcq');
  }, [watchType]);

  // Fetch all questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/org/question');
      setQuestions(response.data.data || []);
      setFilteredQuestions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filter questions based on search, type, and difficulty
  useEffect(() => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (q.job_tags && q.job_tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
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

  // Open dialog for creating new question
  const openCreateDialog = () => {
    setEditingQuestion(null);
    reset({
      text: '',
      type: 'mcq',
      options: [],
      is_must_ask: false,
      max_score: 1,
      tags: '',
      job_tags: '',
      stage: '',
      explanation: '',
    });
    setDialogOpen(true);
  };

  // Open dialog for editing existing question
  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    reset({
      text: question.text,
      type: question.type,
      options: question.options || [],
      explanation: question.explanation || '',
      is_must_ask: question.is_must_ask || false,
      max_score: question.max_score || 1,
      difficulty: question.difficulty,
      tags: question.tags ? question.tags.join(', ') : '',
      job_tags: question.job_tags ? question.job_tags.join(', ') : '',
      stage: question.stage || '',
    });
    setDialogOpen(true);
  };

  // Handle form submission for create/update
  const onSubmit = async (data: QuestionFormValues) => {
    try {
      const payload = {
        text: data.text,
        type: data.type,
        options: data.type === 'mcq' ? data.options?.filter(Boolean) : undefined,
        correct_answers: data.correct_answers || [],
        explanation: data.explanation || undefined,
        is_must_ask: data.is_must_ask,
        max_score: data.max_score,
        attachments: data.attachments || [],
        difficulty: data.difficulty,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        job_tags: data.job_tags ? data.job_tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        stage: data.stage || undefined,
      };

      if (editingQuestion) {
        await api.put(`/org/question/${editingQuestion._id}`, payload);
        toast.success('Question updated successfully');
      } else {
        await api.post('/org/question', payload);
        toast.success('Question created successfully');
      }
      
      setDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      toast.error('Failed to save question');
    }
  };

  // Delete question
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      setDeleteLoadingId(id);
      await api.delete(`/org/question/${id}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      toast.error('Failed to delete question');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Get badge color for question type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mcq': return 'bg-blue-100 text-blue-800';
      case 'coding': return 'bg-green-100 text-green-800';
      case 'essay': return 'bg-purple-100 text-purple-800';
      case 'voice': return 'bg-orange-100 text-orange-800';
      case 'case_study': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get badge color for difficulty
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Technical Questions Management</h1>
          <p className="text-muted-foreground">Create and manage technical assessment questions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 w-4 h-4" /> Add Question
        </Button>
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
                placeholder="Search questions, tags, or job tags..."
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
                <SelectItem value="voice">Voice</SelectItem>
                <SelectItem value="case_study">Case Study</SelectItem>
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
      <Card>
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
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
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Must Ask</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map(question => (
                    <TableRow key={question._id}>
                      <TableCell className="max-w-[300px] min-w-0">
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
                        {question.is_must_ask ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {question.tags && question.tags.length > 0 ? (
                            question.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No tags</span>
                          )}
                          {question.tags && question.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{question.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {question.stage ? (
                          <Badge variant="outline">{question.stage}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(question)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(question._id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Create New Question'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Question Text */}
            <div>
              <Label htmlFor="text" className="mb-2">Question Text</Label>
              <Textarea 
                id="text" 
                {...register('text')} 
                rows={4}
                placeholder="Enter the technical question..."
              />
              {errors.text && (
                <p className="text-red-600 text-sm mt-1">{errors.text.message}</p>
              )}
            </div>

            {/* Type and Difficulty Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="mb-2">Question Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="voice">Voice Recording</SelectItem>
                        <SelectItem value="case_study">Case Study</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="difficulty" className="mb-2">Difficulty</Label>
                <Controller
                  name="difficulty"
                  control={control}
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
            </div>

            {/* MCQ Options - Only show for MCQ type */}
            {showOptions && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Answer Options</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => appendOption('')}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {optionFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        {...register(`options.${index}` as const)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score and Must Ask Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_score" className="mb-2">Maximum Score</Label>
                <Input 
                  id="max_score" 
                  type="number"
                  {...register('max_score', { valueAsNumber: true })} 
                  min="1"
                  max="100"
                />
                {errors.max_score && (
                  <p className="text-red-600 text-sm mt-1">{errors.max_score.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Controller
                  name="is_must_ask"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Must Ask Question</Label>
              </div>
            </div>

            {/* Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tags" className="mb-2">Technical Tags</Label>
                <Input 
                  id="tags" 
                  {...register('tags')} 
                  placeholder="e.g. javascript, algorithms, data-structures"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Comma-separated technical skills or topics
                </p>
              </div>

              <div>
                <Label htmlFor="job_tags" className="mb-2">Job Role Tags</Label>
                <Input 
                  id="job_tags" 
                  {...register('job_tags')} 
                  placeholder="e.g. frontend-developer, backend-developer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Comma-separated job roles or positions
                </p>
              </div>
            </div>

            {/* Stage and Explanation Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage" className="mb-2">Assessment Stage</Label>
                <Input 
                  id="stage" 
                  {...register('stage')} 
                  placeholder="e.g. l1, l2, technical_interview"
                />
              </div>
            </div>

            {/* Explanation */}
            <div>
              <Label htmlFor="explanation" className="mb-2">Explanation (Optional)</Label>
              <Textarea 
                id="explanation" 
                {...register('explanation')} 
                rows={3}
                placeholder="Provide explanation or reasoning for the correct answer..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingQuestion ? 'Update Question' : 'Create Question'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvigilatorQuestionsManagement;
