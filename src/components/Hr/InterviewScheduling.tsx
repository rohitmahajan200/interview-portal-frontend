import { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSelector, useDispatch } from 'react-redux';
import { clearPreSelectedCandidate } from '@/features/Org/HR/interviewSchedulingSlice';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users, MapPin, Video, Loader2, Edit, Trash2, Search, ChevronsUpDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import api from "@/lib/api";
import type { RootState } from '@/app/store';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command';
import { cn } from '@/lib/utils';
import { useAppSelector } from "@/hooks/useAuth"; // ⬅️ added for org user

// Client-side Zod schema for validation
const createInterviewSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),

  candidate: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid candidate ID format"),

  interview_type: z.enum(['hr_questionnaire', 'technical_interview', 'managerial_round']),

  interviewers: z.array(
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid interviewer ID format")
  ).min(1, "At least one interviewer is required"),

  scheduled_at: z.coerce.date()
    .refine((date) => date > new Date(), {
      message: "Scheduled time must be in the future"
    }),

  end_time: z.coerce.date(),

  type: z.enum(['online', 'offline']),

  meeting_link: z.string()
    .url("Invalid URL format")
    .optional(),

  address: z.string()
    .min(10, "Address must be at least 10 characters")
    .optional(),

  platform: z.string().optional(),

  description: z.string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
}).refine((data) => {
  return data.end_time > data.scheduled_at;
}, {
  message: "End time must be after scheduled time",
  path: ["end_time"]
}).refine((data) => {
  if (data.type === 'online') {
    return data.meeting_link && data.meeting_link.length > 0;
  }
  return true;
}, {
  message: "Meeting link is required for online interviews",
  path: ["meeting_link"]
}).refine((data) => {
  if (data.type === 'offline') {
    return data.address && data.address.length >= 10;
  }
  return true;
}, {
  message: "Address is required for offline interviews (min 10 characters)",
  path: ["address"]
});

// ===== Remarks types (added) =====
type Grade = "A+" | "A" | "B" | "C" | "D" | "E";
interface InterviewRemark {
  _id?: string;
  provider: string | { _id: string; name?: string; role?: string };
  remark: string;
  grade: Grade;
  created_at: string;
}

// Updated interfaces to match backend models
interface FormData {
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  interview_type: 'hr_questionnaire' | 'technical_interview' | 'managerial_round';
  type: 'online' | 'offline';
  meetingLink: string;
  address: string;
  description: string;
  candidate: string;
  interviewers: string[];
  platform?: string;
}

interface Interview {
  _id: string;
  title: string;
  candidate: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    current_stage: string;
    applied_job?: {
      name: string;
    };
  };
  interview_type: string;
  interviewers: Array<{
    _id: string;
    name: string;
    role: string;
  }>;
  scheduled_at: string;
  end_time: string;
  type: 'online' | 'offline';
  meeting_link?: string;
  address?: string;
  platform?: string;
  description?: string;
  status: string;
  // ⬇️ include remarks
  remarks: InterviewRemark[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    interview: Interview;
    candidateName: string;
    candidateStage: string;
    candidateJob: string;
    interviewerNames: string[];
  };
}

interface Candidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_stage: 'registered' | 'hr' | 'assessment' | 'tech' | 'manager' | 'feedback';
  applied_job: {
    _id: string;
    name: string;
  };
  status: string;
}

interface OrgUser {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'INVIGILATOR' | 'MANAGER';
}

const gradeOptions: Grade[] = ["A+", "A", "B", "C", "D", "E"];

const InterviewCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateSearchOpen, setCandidateSearchOpen] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const dispatch = useDispatch();
  const preSelectedCandidate = useSelector((state: RootState) => state.interviewScheduling.preSelectedCandidate);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState({
    candidates: true,
    users: true,
    interviews: true,
    submitting: false
  });

  // ===== current org user (added) =====
  const orgUser = useAppSelector((s) => s.orgAuth?.user);
  const userId = orgUser?.id;
  const isAdmin = orgUser?.role === "ADMIN";

  // ===== remark form state (added) =====
  const [remarkText, setRemarkText] = useState("");
  const [remarkGrade, setRemarkGrade] = useState<Grade | "">("");

  // ===== auto-open once flag (added) =====
  const didAutoOpenRef = useRef(false);

  useEffect(() => {
    if (preSelectedCandidate && candidates.length > 0) {
      setFormData(prev => ({
        ...prev,
        candidate: preSelectedCandidate._id,
        title: `Interview - ${preSelectedCandidate.first_name} ${preSelectedCandidate.last_name}`
      }));
      toast.success(`Candidate ${preSelectedCandidate.first_name} ${preSelectedCandidate.last_name} pre-selected for interview scheduling`);
      dispatch(clearPreSelectedCandidate());
    }
  }, [preSelectedCandidate, candidates, dispatch]);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    startDate: '',
    startTime: '',
    endTime: '',
    interview_type: 'technical_interview',
    type: 'online',
    meetingLink: '',
    address: '',
    description: '',
    candidate: '',
    interviewers: [],
    platform: ''
  });

  // Fetch all data on component mount
  useEffect(() => {
    Promise.all([
      fetchCandidates(),
      fetchOrgUsers(),
      fetchInterviews()
    ]);
  }, []);

  // Convert interviews to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = interviews.map(interview => ({
      id: interview._id,
      title: interview.title,
      start: new Date(interview.scheduled_at),
      end: new Date(interview.end_time),
      backgroundColor: getInterviewTypeColor(interview.interview_type),
      borderColor: getInterviewTypeColor(interview.interview_type),
      extendedProps: {
        interview,
        candidateName: `${interview.candidate.first_name} ${interview.candidate.last_name}`,
        candidateStage: interview.candidate.current_stage,
        candidateJob: interview.candidate.applied_job?.name || 'No Job',
        interviewerNames: interview.interviewers.map(i => i.name)
      }
    }));
    setEvents(calendarEvents);
  }, [interviews]);

  const fetchCandidates = async () => {
    try {
      const response = await api.get("/org/candidates");
      if (response.data.success) {
        setCandidates(response.data.data.users || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(prev => ({ ...prev, candidates: false }));
    }
  };

  const fetchOrgUsers = async () => {
    try {
      const response = await api.get("/org/users");
      if (response.data.success) {
        setOrgUsers(response.data.data.users || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching org users:', error);
      toast.error('Failed to load organization users');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchInterviews = async () => {
    try {
      const response = await api.get("/org/interviews");
      if (response.data.success) {
        setInterviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(prev => ({ ...prev, interviews: false }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterviewerToggle = (interviewerId: string) => {
    setFormData(prev => ({
      ...prev,
      interviewers: prev.interviewers.includes(interviewerId)
        ? prev.interviewers.filter(id => id !== interviewerId)
        : [...prev.interviewers, interviewerId]
    }));
  };

  const createInterviewPayload = () => {
    const scheduled_at = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
    const end_time = new Date(`${formData.startDate}T${formData.endTime}`).toISOString();

    return {
      title: formData.title,
      candidate: formData.candidate,
      interview_type: formData.interview_type,
      interviewers: formData.interviewers,
      scheduled_at,
      end_time,
      type: formData.type,
      meeting_link: formData.type === 'online' ? formData.meetingLink : undefined,
      address: formData.type === 'offline' ? formData.address : undefined,
      platform: formData.platform || undefined,
      description: formData.description || undefined
    };
  };

  // Client-side validation function - FIXED
  const validateForm = () => {
    try {
      const payload = createInterviewPayload();
      const result = createInterviewSchema.parse(payload);
      return { success: true, data: result };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        const errorMessage = firstError.message;
        const fieldPath = firstError.path.join('.');
        toast.error(`${fieldPath}: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
      return { success: false, error: 'Validation failed' };
    }
  };

  const handleCreateInterview = async () => {
    const validation = validateForm();
    if (!validation.success) {
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      const payload = createInterviewPayload();
      const response = await api.post("/org/interviews", payload);

      if (response.data.success) {
        toast.success('Interview scheduled successfully!');
        await fetchInterviews(); // Refresh interviews
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating interview:', error);

      if (error.response?.status === 409 && error.response?.data?.error === "INTERVIEW_CONFLICT") {
        const conflictData = error.response.data;
        toast.error(
          `⛔ Conflict: ${conflictData.message}\n` +
          `Requested slot: ${new Date(conflictData.requestedSlot.scheduled_at).toLocaleString()} - ${new Date(conflictData.requestedSlot.end_time).toLocaleTimeString()}`
        );
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to schedule interview';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleUpdateInterview = async () => {
    if (!editingInterviewId) {
      toast.error("No interview selected to update.");
      return;
    }

    const validation = validateForm();
    if (!validation.success) return;

    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      const payload = createInterviewPayload();
      const response = await api.put(`/org/interviews/${editingInterviewId}`, payload);

      if (response.data.success) {
        toast.success('Interview updated successfully!');
        await fetchInterviews();
        setIsEditing(false);
        setEditingInterviewId(null);
        setSelectedInterview(null);
        resetForm();
      }
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.error?.includes("CONFLICT")) {
        const conflictData = error.response.data;
        const start = new Date(conflictData.requestedSlot.scheduled_at).toLocaleString();
        const end = new Date(conflictData.requestedSlot.end_time).toLocaleString();
        toast.error(`⛔ Conflict: ${conflictData.message}\nRequested slot: ${start} - ${end}`);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to update interview';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;

    setLoading(prev => ({ ...prev, submitting: true }));
    try {
      await api.delete(`/org/interviews/${interviewId}`);
      toast.success('Interview deleted successfully!');
      await fetchInterviews();
      setSelectedInterview(null);
    } catch (error: any) {
      console.error('Error deleting interview:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete interview';
      toast.error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      startDate: '',
      startTime: '',
      endTime: '',
      interview_type: 'technical_interview',
      type: 'online',
      meetingLink: '',
      address: '',
      description: '',
      candidate: '',
      interviewers: [],
      platform: ''
    });
  };

  const populateFormWithInterview = (interview: Interview) => {
    const startDate = new Date(interview.scheduled_at);
    const endDate = new Date(interview.end_time);

    setFormData({
      title: interview.title,
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      interview_type: interview.interview_type as FormData['interview_type'],
      type: interview.type,
      meetingLink: interview.meeting_link || '',
      address: interview.address || '',
      description: interview.description || '',
      candidate: interview.candidate._id,
      interviewers: interview.interviewers.map(i => i._id),
      platform: interview.platform || ''
    });
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const interview = clickInfo.event.extendedProps.interview as Interview;
    setSelectedInterview(interview);
  };

  const handleEditInterview = () => {
    if (selectedInterview) {
      setEditingInterviewId(selectedInterview._id);
      populateFormWithInterview(selectedInterview);
      setIsEditing(true);
      setSelectedInterview(null);
      setTimeout(() => {
        const titleInput = document.getElementById('main');
        titleInput?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }, 100);
    }
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'registered': 'bg-gray-100 text-gray-800',
      'hr': 'bg-blue-100 text-blue-800',
      'assessment': 'bg-yellow-100 text-yellow-800',
      'tech': 'bg-purple-100 text-purple-800',
      'manager': 'bg-orange-100 text-orange-800',
      'feedback': 'bg-green-100 text-green-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInterviewTypeColor = (type: string) => {
    const colors = {
      'hr_questionnaire': '#3b82f6',
      'technical_interview': '#8b5cf6',
      'managerial_round': '#f59e0b'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  // ====== Remarks logic below (added) ======

  // helper: provider id from remark
  const getProviderId = (r: InterviewRemark) =>
    typeof r.provider === "string" ? r.provider : r.provider?._id;

  // am I a panelist on this interview?
  const iAmPanelist = (iv: Interview) =>
    !!userId && iv.interviewers.some(p => p._id === userId);

  const hasMyRemark = (iv: Interview) =>
    Boolean(userId) && (iv.remarks || []).some(r => getProviderId(r) === userId);

  const interviewStarted = (iv: Interview) =>
    new Date(iv.scheduled_at).getTime() <= Date.now();

  // Needs my remark only if I'm a panelist, it has started, and I haven't remarked (admins never)
  const needsRemarkForUser = (iv: Interview) => {
    if (isAdmin) return false;
    return iAmPanelist(iv) && interviewStarted(iv) && !hasMyRemark(iv);
  };

  // Auto-open once: find the first interview requiring my remark
  useEffect(() => {
    if (didAutoOpenRef.current) return;
    if (isAdmin) { didAutoOpenRef.current = true; return; }
    if (!userId) return;
    if (!interviews.length) return;
    if (selectedInterview) return;

    const firstNeeding = interviews.find(needsRemarkForUser);
    if (firstNeeding) {
      setSelectedInterview(firstNeeding);
    }
    didAutoOpenRef.current = true;
  }, [interviews, userId, isAdmin, selectedInterview]);

  // compute my remark for currently opened interview
  const myRemark = useMemo(() => {
    if (!selectedInterview || !userId) return null;
    return selectedInterview.remarks.find(r => getProviderId(r) === userId) || null;
  }, [selectedInterview, userId]);

  // reset form when dialog changes target; keep empty if no remark
  useEffect(() => {
    if (!selectedInterview) return;
    if (myRemark) {
      setRemarkText("");
      setRemarkGrade("");
    } else {
      setRemarkText("");
      setRemarkGrade("");
    }
  }, [selectedInterview, myRemark]);

  const handleSubmitRemark = async () => {
    if (isAdmin || !selectedInterview) return;
    if (!remarkText.trim()) return toast.error("Remark is required");
    if (!remarkGrade) return toast.error("Please select a grade");

    try {
      const url = `/org/interviews/${selectedInterview._id}/remarks`;
      const payload = { remark: remarkText.trim(), grade: remarkGrade };
      await api.post(url, payload);

      const newRemark: InterviewRemark = {
        provider: userId!,
        remark: payload.remark,
        grade: payload.grade,
        created_at: new Date().toISOString(),
      };

      // update both lists
      setInterviews(prev => prev.map(iv =>
        iv._id === selectedInterview._id
          ? { ...iv, remarks: [...(iv.remarks || []), newRemark] }
          : iv
      ));
      setSelectedInterview(prev =>
        prev ? { ...prev, remarks: [...(prev.remarks || []), newRemark] } : prev
      );

      toast.success("Remark added");
      // (keep dialog open to show read-only "Your Submitted Remark")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add remark");
    }
  };

  // ====== /Remarks logic ======

  if (loading.candidates || loading.users || loading.interviews) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading interview data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 overflow-y-auto mb-10" id='main'>
      {/* Event Creation/Edit Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Edit Interview Event' : 'Create Interview Event'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Technical Interview - John Doe"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* Interview Type */}
            <div className="space-y-2">
              <Label>Interview Type *</Label>
              <Select value={formData.interview_type} onValueChange={(value) => handleInputChange('interview_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose interview type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical_interview">Technical Interview</SelectItem>
                  <SelectItem value="managerial_round">Managerial Round</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Candidate Selection */}
            <div className="space-y-2">
              <Label>Select Candidate *</Label>
              <Popover open={candidateSearchOpen} onOpenChange={setCandidateSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={candidateSearchOpen}
                    className="w-full justify-between h-auto p-2"
                  >
                    {formData.candidate ? (
                      <div className="flex items-center justify-between w-full p-2 min-h-[1.5rem] bg-gray-50 rounded-md border hover:bg-gray-100 transition-colors">
                        <div className="flex gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {(() => {
                                const selected = candidates.find(c => c._id === formData.candidate);
                                return selected ? `${selected.first_name} ${selected.last_name}` : '';
                              })()}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {(() => {
                                const selected = candidates.find(c => c._id === formData.candidate);
                                return selected?.email || '';
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {(() => {
                            const selected = candidates.find(c => c._id === formData.candidate);
                            return selected ? (
                              <>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${getStageColor(selected.current_stage)}`}>
                                  {selected.current_stage}
                                </span>
                                <span className="text-xs text-gray-400 max-w-[80px] truncate">
                                  {selected.applied_job?.name || 'No Job'}
                                </span>
                              </>
                            ) : null;
                          })()}
                        </div>
                      </div>

                    ) : (
                      <div className="flex items-center justify-center gap-3 w-full p-2 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                        <Search className=" text-gray-400" />
                        <span className="text-sm text-gray-500 font-medium">Search candidate by name or email...</span>
                      </div>
                    )}

                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                  <Command>
                    <CommandInput
                      placeholder="Search candidates by name or email..."
                      className="h-9"
                    />
                    <CommandEmpty>No candidate found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {candidates.map((candidate) => (
                        <CommandItem
                          key={candidate._id}
                          value={`${candidate.first_name} ${candidate.last_name} ${candidate.email}`}
                          onSelect={() => {
                            handleInputChange('candidate', candidate._id);
                            setCandidateSearchOpen(false);
                          }}
                          className="p-3"
                        >
                          <div className="flex items-center w-full gap-3">
                            <Check
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                formData.candidate === candidate._id ? "opacity-100" : "opacity-0"
                              )}
                            />

                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm block truncate">
                                {candidate.first_name} {candidate.last_name}
                              </span>
                              <span className="text-xs text-gray-500 block truncate">
                                {candidate.email}
                              </span>
                            </div>

                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStageColor(candidate.current_stage)}`}>
                              {candidate.current_stage}
                            </span>

                            <span className="text-xs text-gray-600 max-w-[80px] truncate">
                              {candidate.applied_job?.name || 'No Job'}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>
          </div>

          {/* Online/Offline Selection */}
          <div className="space-y-3">
            <Label>Interview Format</Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="online"
                  name="type"
                  value="online"
                  checked={formData.type === 'online'}
                  onChange={(e) => handleInputChange('type', e.target.value as 'online' | 'offline')}
                  className="h-4 w-4"
                />
                <Label htmlFor="online" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Online
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="offline"
                  name="type"
                  value="offline"
                  checked={formData.type === 'offline'}
                  onChange={(e) => handleInputChange('type', e.target.value as 'online' | 'offline')}
                  className="h-4 w-4"
                />
                <Label htmlFor="offline" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Offline
                </Label>
              </div>
            </div>
          </div>

          {/* Meeting Link/Address and Platform */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {formData.type === 'online' ? (
                <>
                  <Label htmlFor="meetingLink">Meeting Link *</Label>
                  <Input
                    id="meetingLink"
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    value={formData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Office address or meeting location"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </>
              )}
            </div>

            {formData.type === 'online' && (
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  placeholder="e.g., Zoom, Google Meet, Teams"
                  value={formData.platform}
                  onChange={(e) => handleInputChange('platform', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Interview details, preparation notes, etc."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Interviewers Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Interviewers *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {orgUsers.map(user => (
                <div key={user._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`interviewer-${user._id}`}
                    checked={formData.interviewers.includes(user._id)}
                    onChange={() => handleInterviewerToggle(user._id)}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <Label htmlFor={`interviewer-${user._id}`} className="text-sm">
                    {user.name} ({user.role})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={isEditing ? handleUpdateInterview : handleCreateInterview}
              disabled={loading.submitting}
              className="flex-1"
            >
              {loading.submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Update Interview' : 'Create Interview'}
            </Button>

            {isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditingInterviewId(null);
                  setSelectedInterview(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Interview Details + Remarks */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-4xl md:max-w-[70vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className='mt-10'>
            <DialogTitle className="flex items-center justify-between">
              <span>Interview Details</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditInterview}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => selectedInterview && handleDeleteInterview(selectedInterview._id)}
                  disabled={loading.submitting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedInterview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Instruction if my remark is pending */}
              {!isAdmin && needsRemarkForUser(selectedInterview) && (
                <div className="md:col-span-2 mb-2 p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm font-medium">
                  ⚠️ Please provide your remark and grade for this interview. This is required because the interview has already been conducted and your input is pending.
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Interview Information</h4>
                <div className="space-y-2">
                  <p><strong>Title:</strong> {selectedInterview.title}</p>
                  <p><strong>Type:</strong> {selectedInterview.interview_type.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Status:</strong> {selectedInterview.status}</p>
                  <p><strong>Date:</strong> {new Date(selectedInterview.scheduled_at).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(selectedInterview.scheduled_at).toLocaleTimeString()} - {new Date(selectedInterview.end_time).toLocaleTimeString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Candidate</h4>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedInterview.candidate.first_name} {selectedInterview.candidate.last_name}</p>
                  <p><strong>Email:</strong> {selectedInterview.candidate.email}</p>
                  <p><strong>Stage:</strong> {selectedInterview.candidate.current_stage}</p>
                  <p><strong>Job:</strong> {selectedInterview.candidate.applied_job?.name || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Interviewers</h4>
                <div className="space-y-1">
                  {selectedInterview.interviewers.map(interviewer => (
                    <p key={interviewer._id}>{interviewer.name} ({interviewer.role})</p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Meeting Details</h4>
                <div className="space-y-2">
                  <p><strong>Format:</strong> {selectedInterview.type}</p>
                  {selectedInterview.type === 'online' ? (
                    <>
                      <p><strong>Platform:</strong> {selectedInterview.platform || 'Not specified'}</p>
                      <p><strong>Link:</strong>
                        <a href={selectedInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline break-all">
                          {selectedInterview.meeting_link}
                        </a>
                      </p>
                    </>
                  ) : (
                    <p><strong>Address:</strong> {selectedInterview.address}</p>
                  )}
                  {selectedInterview.description && (
                    <p><strong>Description:</strong> {selectedInterview.description}</p>
                  )}
                </div>
              </div>

              {/* My remark (read-only) OR form */}
              {selectedInterview && !isAdmin && (
                <div className="md:col-span-2 space-y-3">
                  {myRemark ? (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <h4 className="font-semibold mb-1">📝 Your Submitted Remark</h4>
                      <div className="text-sm">
                        <p className="mb-2"><strong>Grade:</strong> {myRemark.grade}</p>
                        <p className="whitespace-pre-wrap">{myRemark.remark}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted at {new Date(myRemark.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : needsRemarkForUser(selectedInterview) ? (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <h4 className="font-semibold mb-2">📝 Your Remark (required)</h4>
                      <Textarea
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        placeholder="Share your observations…"
                        rows={3}
                        className="text-sm"
                      />
                      <div className="mt-3">
                        <Select value={remarkGrade} onValueChange={(v) => setRemarkGrade(v as Grade)}>
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button size="sm" onClick={handleSubmitRemark}>Submit</Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        You’re seeing this because the interview has already started and you haven’t added your remark yet.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FullCalendar Component */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
        }}
        initialView="dayGridMonth"
        events={events}
        dayMaxEvents={true}
        weekends={true}
        eventClick={handleEventClick}
        height="auto"
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '09:00',
          endTime: '18:00'
        }}
        eventDidMount={(info) => {
          const candidateName = info.event.extendedProps?.candidateName || 'Unknown Candidate';
          const interviewerNames = info.event.extendedProps?.interviewerNames || [];

          info.el.title = `${info.event.title}\nCandidate: ${candidateName}\nInterviewers: ${interviewerNames.join(', ') || 'No interviewers assigned'}`;
        }}
      />
    </div>
  );
};

export default InterviewCalendar;
