import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash, Search, Filter } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Validation schema for HR question form
const hrQuestionSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  input_type: z.enum(['text', 'audio', 'date']),
  tags: z.string().optional(),
});

type HrQuestionFormValues = z.infer<typeof hrQuestionSchema>;

// Type for HR question from API
interface HrQuestion {
  _id: string;
  question: string;
  input_type: 'text' | 'audio' | 'date';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

const HrQuestionsManagement = () => {
  const [questions, setQuestions] = useState<HrQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<HrQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<HrQuestion | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<HrQuestionFormValues>({
    resolver: zodResolver(hrQuestionSchema),
  });

  // Fetch all HR questions
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

  // Filter questions based on search and type
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

  // Open dialog for creating new question
  const openCreateDialog = () => {
    setEditingQuestion(null);
    reset({ question: '', input_type: 'text', tags: '' });
    setDialogOpen(true);
  };

  // Open dialog for editing existing question
  const openEditDialog = (question: HrQuestion) => {
    setEditingQuestion(question);
    reset({
      question: question.question,
      input_type: question.input_type,
      tags: question.tags ? question.tags.join(', ') : '',
    });
    setDialogOpen(true);
  };

  // Handle form submission for create/update
  const onSubmit = async (data: HrQuestionFormValues) => {
    try {
      const payload = {
        question: data.question,
        input_type: data.input_type,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      if (editingQuestion) {
        // Update existing
        await api.put(`/org/hr-questions/${editingQuestion._id}`, payload);
        toast.success('Question updated successfully');
      } else {
        // Create new
        await api.post('/org/hr-questions', payload);
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

  // Get badge color for input type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">HR Questions Management</h1>
          <p className="text-muted-foreground">Create and manage HR interview questions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 w-4 h-4" /> Add Question
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card className='flex overflow-y-auto'>
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
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
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
                      <TableCell>
                        {question.tags && question.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {question.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No tags</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(question.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Create New Question'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="question" className='mb-2'>Question Text</Label>
              <Textarea 
                id="question" 
                {...register('question')} 
                rows={4}
                placeholder="Enter the HR interview question..."
              />
              {errors.question && (
                <p className="text-red-600 text-sm mt-1">{errors.question.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="input_type" className='mb-2'>Response Type</Label>
              <Controller
                name="input_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select response type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Response</SelectItem>
                      <SelectItem value="audio">Audio Recording</SelectItem>
                      <SelectItem value="date">Date Selection</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.input_type && (
                <p className="text-red-600 text-sm mt-1">{errors.input_type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tags" className='mb-2'>Tags (comma separated)</Label>
              <Input 
                id="tags" 
                {...register('tags')} 
                placeholder="e.g. behavioral, technical, cultural-fit"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Add tags to categorize and organize your questions
              </p>
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

export default HrQuestionsManagement;
