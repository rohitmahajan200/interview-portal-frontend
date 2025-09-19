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

// Updated schema to match backend exactly
const hrQuestionsArraySchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(5, 'Question must be at least 5 characters').max(500, 'Question too long'),
      input_type: z.enum(['text', 'audio', 'date', 'mcq', 'checkbox'], { message: 'Invalid response type' }),
      tags: z.array(z.string().trim().min(1)).optional(),
      options: z.array(z.string().trim().min(1, 'Option cannot be empty')).optional(),
    }).refine((data) => {
      if ((data.input_type === 'mcq' || data.input_type === 'checkbox') && (!data.options || data.options.length < 2)) {
        return false;
      }
      if (data.input_type !== 'mcq' && data.input_type !== 'checkbox' && data.options && data.options.length > 0) {
        return false;
      }
      return true;
    }, {
      message: "MCQ and checkbox questions must have at least 2 options. Other types should not have options.",
      path: ["options"]
    })
  ).min(1, "At least one question is required").max(20, "Cannot create more than 20 questions at once")
});

type HrQuestionsFormValues = z.infer<typeof hrQuestionsArraySchema>;

interface HrQuestion {
  _id: string;
  question: string;
  input_type: 'text' | 'audio' | 'date' | 'mcq' | 'checkbox';
  tags?: string[];
  options?: string[];
  created_at: string;
  created_by?: {
    name: string;
    role: string;
  };
  updated_at: string;
}

// QuestionOptionsField component
const QuestionOptionsField = ({ questionIndex, form }: { questionIndex: number, form: any }) => {
  const watchedInputType = form.watch(`questions.${questionIndex}.input_type`);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `questions.${questionIndex}.options`
  });

  if (watchedInputType !== 'mcq' && watchedInputType !== 'checkbox') {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Options</Label>
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          onClick={() => append('')}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Option
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, optionIndex) => (
          <div key={field.id} className="flex gap-2 items-center">
            <Input
              {...form.register(`questions.${questionIndex}.options.${optionIndex}`)}
              placeholder={`Option ${optionIndex + 1}`}
              className="flex-1"
            />
            {fields.length > 2 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => remove(optionIndex)}
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

const HrQuestionsManagement = () => {
  const [questions, setQuestions] = useState<HrQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<HrQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<HrQuestion | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  // Tag mode states
  const [useSameTagsForAll, setUseSameTagsForAll] = useState(false);
  const [globalTags, setGlobalTags] = useState('');

  const form = useForm<HrQuestionsFormValues>({
    resolver: zodResolver(hrQuestionsArraySchema),
    defaultValues: {
      questions: [
        {
          question: '',
          input_type: 'text',
          tags: [],
          options: []
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
      const response = await api.get('/org/hr-questions');
      setQuestions(response.data.data || []);
      setFilteredQuestions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load HR questions');
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
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(q => q.input_type === typeFilter);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, typeFilter]);

  const openCreateDialog = () => {
    setEditingQuestion(null);
    setUseSameTagsForAll(false);
    setGlobalTags('');
    form.reset({
      questions: [
        {
          question: '',
          input_type: 'text',
          tags: [],
          options: []
        }
      ]
    });
    setDialogOpen(true);
  };

  const openEditDialog = (question: HrQuestion) => {
    setEditingQuestion(question);
    form.reset({
      questions: [{
        question: question.question,
        input_type: question.input_type,
        tags: question.tags || [],
        options: question.options || []
      }]
    });
    setDialogOpen(true);
  };

  const handleInputTypeChangeForQuestion = (questionIndex: number, value: string) => {
    form.setValue(`questions.${questionIndex}.options`, []);
    
    if (value === 'mcq' || value === 'checkbox') {
      form.setValue(`questions.${questionIndex}.options`, ['', '']);
    }
  };

  const onSubmit = async (data: HrQuestionsFormValues) => {
    try {
      setIsSubmitting(true);
      
      let payload;

      if (editingQuestion) {
        // Edit mode - single question
        payload = {
          questions: [{
            question: data.questions[0].question,
            input_type: data.questions[0].input_type,
            tags: data.questions[0].tags || [],
            ...(data.questions[0].options && data.questions[0].options.length > 0 && {
              options: data.questions[0].options.filter(Boolean)
            })
          }]
        };

        await api.put(`/org/hr-questions/${editingQuestion._id}`, payload.questions[0]);
        toast.success('Question updated successfully');
      } else {
        // Create mode - multiple questions
        const globalTagsArray = useSameTagsForAll && globalTags 
          ? globalTags.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        payload = {
          questions: data.questions.map(q => ({
            question: q.question,
            input_type: q.input_type,
            tags: useSameTagsForAll ? globalTagsArray : (q.tags || []),
            ...(q.options && q.options.length > 0 && {
              options: q.options.filter(Boolean)
            })
          }))
        };

        await api.post('/org/hr-questions', payload);
        toast.success(`${payload.questions.length} question(s) created successfully`);
      }
      
      setDialogOpen(false);
      fetchQuestions();
    } catch (error: any) {
      console.error('Failed to save question(s):', error);
      toast.error(error?.response?.data?.message || 'Failed to save question(s)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      setDeleteLoadingId(id);
      await api.delete(`/org/hr-questions/${id}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      toast.error('Failed to delete question');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'mcq': return 'bg-orange-100 text-orange-800';
      case 'checkbox': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:items-center md:text-left gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">HR Questions Management</h1>
          <p className="text-muted-foreground">
            Create and manage HR interview questions
          </p>
        </div>
        <Button onClick={openCreateDialog} className="w-full md:w-auto">
          <Plus className="mr-2 w-4 h-4" /> Add Question
        </Button>
      </div>


      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.length}</div>
            <div className="text-sm text-muted-foreground">Total Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.input_type === 'text').length}</div>
            <div className="text-sm text-muted-foreground">Text Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.input_type === 'audio').length}</div>
            <div className="text-sm text-muted-foreground">Audio Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.input_type === 'date').length}</div>
            <div className="text-sm text-muted-foreground">Date Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.input_type === 'mcq').length}</div>
            <div className="text-sm text-muted-foreground">MCQ Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{questions.filter(q => q.input_type === 'checkbox').length}</div>
            <div className="text-sm text-muted-foreground">Checkbox Questions</div>
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
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card className='flex flex-col overflow-y-auto mb-7'>
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
                    {!isCompact && <TableHead>Options</TableHead>}
                    <TableHead>Tags</TableHead>
                    {!isCompact &&<TableHead>Created By</TableHead>}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map(question => (
                    <TableRow key={question._id}>
                      <TableCell className="max-w-[300px] min-w-0">
                        {question.question.length > 50 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate text-sm cursor-help">
                                {question.question}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs break-words">
                                {question.question}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="text-sm">
                            {question.question}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(question.input_type)}>
                          {question.input_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                     {!isCompact && <TableCell>
                      {question.options && question.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {question.options.slice(0, 2).map((option, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                             {option.length > 15 ? `${option.substring(0, 15)}...` : option}
                            </Badge>
                          ))}
                          {question.options.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{question.options.length - 2} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>}
                    <TableCell>
                      {question.tags && question.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                              title={tag} // full text on hover
                            >
                              {isCompact ? truncateTag(tag, 12) : tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No tags</span>
                      )}
                    </TableCell>
                      {!isCompact && <TableCell className="text-sm text-muted-foreground">
                        {question.created_by ? 
                        <span className='flex gap-2'>
                        {question.created_by.name && <Badge>{question.created_by.name}</Badge>}
                        {question.created_by.role && <Badge>{question.created_by.role}</Badge>}
                        </span> : "-" }
                      </TableCell>}
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
                    {searchTerm || typeFilter !== 'all' 
                      ? 'No questions match your filters.' 
                      : 'No HR questions found. Create your first question!'
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
        <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Create HR Questions'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion 
                ? 'Modify the HR question details below.' 
                : 'Create one or multiple HR interview questions at once.'
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
                          question: '',
                          input_type: 'text',
                          tags: [],
                          options: []
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
                          placeholder="e.g. behavioral, technical, cultural-fit"
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
                        <Label htmlFor={`questions.${questionIndex}.question`}>Question Text</Label>
                        <Textarea 
                          {...form.register(`questions.${questionIndex}.question`)}
                          rows={3}
                          placeholder="Enter the HR interview question..."
                        />
                        {form.formState.errors.questions?.[questionIndex]?.question && (
                          <p className="text-red-600 text-sm mt-1">
                            {form.formState.errors.questions[questionIndex].question?.message}
                          </p>
                        )}
                      </div>

                      {/* Input Type */}
                      <div>
                        <Label htmlFor={`questions.${questionIndex}.input_type`}>Response Type</Label>
                        <Controller
                          name={`questions.${questionIndex}.input_type`}
                          control={form.control}
                          render={({ field }) => (
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleInputTypeChangeForQuestion(questionIndex, value);
                              }} 
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select response type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text Response</SelectItem>
                                <SelectItem value="audio">Audio Recording</SelectItem>
                                <SelectItem value="date">Date Selection</SelectItem>
                                <SelectItem value="mcq">Multiple Choice (Single Select)</SelectItem>
                                <SelectItem value="checkbox">Multiple Choice (Multi Select)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Options for MCQ/Checkbox */}
                      <QuestionOptionsField 
                        questionIndex={questionIndex}
                        form={form}
                      />

                      {/* Individual Tags (only show if not using global tags) */}
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
                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                onChange={(e) => {
                                  const tagsArray = e.target.value
                                    .split(',')
                                    .map(tag => tag.trim())
                                    .filter(Boolean);
                                  field.onChange(tagsArray);
                                }}
                                placeholder="e.g. behavioral, technical, cultural-fit"
                              />
                            )}
                          />
                        </div>
                      )}
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

export default HrQuestionsManagement;
