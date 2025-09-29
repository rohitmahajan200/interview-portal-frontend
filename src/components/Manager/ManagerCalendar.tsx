import { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { Dialog, DialogContent} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, MapPin, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAppSelector } from "@/hooks/useAuth";
import { Button } from '../ui/button';

type Grade = "A+" | "A" | "B" | "C" | "D" | "E";

interface InterviewRemark {
  _id?: string;
  // provider may come as raw id string OR populated user
  provider: string | { _id: string; name?: string; role?: string };
  remark: string;
  grade: Grade;
  created_at: string;
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
      title:string;
     };
  };
  interview_type: string;
  interviewers: Array<{ _id: string; name: string; role: string }>;
  scheduled_at: string;
  end_time: string;
  type: 'online' | 'offline';
  meeting_link?: string;
  address?: string;
  platform?: string;
  description?: string;
  status: string;
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

const gradeOptions: Grade[] = ["A+", "A", "B", "C", "D", "E"];

const InterviewScheduling = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  const orgUser = useAppSelector((s) => s.orgAuth?.user); // expects { id, _id?, name, role }
  const userId = orgUser?.id;// be tolerant
  const isAdmin = orgUser?.role === "ADMIN";

  // remark form state
  const [remarkText, setRemarkText] = useState("");
  const [remarkGrade, setRemarkGrade] = useState<Grade | "">("");

  // run auto-open just once
  const didAutoOpenRef = useRef(false);

  const getProviderId = (r: InterviewRemark) =>
    typeof r.provider === "string" ? r.provider : r.provider?._id;

  const hasMyRemark = (iv: Interview) =>
    Boolean(userId) && (iv.remarks || []).some(r => getProviderId(r) === userId);

  const interviewStarted = (iv: Interview) =>
    new Date(iv.scheduled_at).getTime() <= Date.now();

  // “Needs my remark” = started AND I haven't remarked yet (admins never need)
  const needsRemarkForUser = (iv: Interview) => {
    if (isAdmin) return false;
    return interviewStarted(iv) && !hasMyRemark(iv);
  };

  // On first usable render, auto-open the first interview that needs my remark
  useEffect(() => {
    if (didAutoOpenRef.current) return;
    if (isAdmin) { didAutoOpenRef.current = true; return; }
    if (!userId) return;           // need user
    if (!interviews.length) return; // need data
    if (selectedInterview) return; // don’t override manual open

    const firstNeeding = interviews.find(needsRemarkForUser);
    if (firstNeeding) {
      setSelectedInterview(firstNeeding);
    }
    // Mark as done so it won't reopen again
    didAutoOpenRef.current = true;
  }, [interviews, userId, isAdmin, selectedInterview]);

  // Keep dialog model in sync: if interview has my remark, show it; otherwise reset form
  const myRemark = useMemo(() => {
    if (!selectedInterview || !userId) return null;
    return selectedInterview.remarks.find(r => getProviderId(r) === userId) || null;
  }, [selectedInterview, userId]);

  useEffect(() => {
    // reset form every time dialog opens to a new interview *only if* no remark from me exists
    if (!selectedInterview) return;
    if (myRemark) {
      setRemarkText("");
      setRemarkGrade("");
    } else {
      setRemarkText("");
      setRemarkGrade("");
    }
  }, [selectedInterview, myRemark]);

  // Fetch interviews
  useEffect(() => {
    fetchInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await api.get("/org/interviews");
      if (response.data.success) {
        setInterviews(response.data.data as Interview[]);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  // Submit remark
  const handleSubmitRemark = async () => {
    if (isAdmin || !selectedInterview) return;
    if (!remarkText.trim()) return toast.error("Remark is required");
    if (!remarkGrade) return toast.error("Please select a grade");

    try {
      const url = `/org/interviews/${selectedInterview._id}/remarks`;
      const payload = { remark: remarkText.trim(), grade: remarkGrade };
      await api.post(url, payload);

      // Update local cache for both list & selected
      const newRemark: InterviewRemark = {
        provider: userId!,
        remark: payload.remark,
        grade: payload.grade,
        created_at: new Date().toISOString(),
      };

      setInterviews(prev => prev.map(iv =>
        iv._id === selectedInterview._id
          ? { ...iv, remarks: [...(iv.remarks || []), newRemark] }
          : iv
      ));
      setSelectedInterview(prev =>
        prev ? { ...prev, remarks: [...(prev.remarks || []), newRemark] } : prev
      );

      toast.success("Remark added");
      // Optionally close dialog after submit; or keep open to show read-only view
      // setSelectedInterview(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add remark");
    }
  };

  // Calendar events
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
        candidateJob: interview.candidate.applied_job?.title || 'No Job',
        interviewerNames: interview.interviewers.map(i => i.name)
      }
    }));
    setEvents(calendarEvents);
  }, [interviews]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const interview = clickInfo.event.extendedProps.interview as Interview;
    setSelectedInterview(interview);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'registered': 'bg-gray-100 text-gray-800',
      'hr': 'bg-blue-100 text-blue-800',
      'assessment': 'bg-yellow-100 text-yellow-800',
      'tech': 'bg-purple-100 text-purple-800',
      'manager': 'bg-orange-100 text-orange-800',
      'feedback': 'bg-green-100 text-green-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getInterviewTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'hr_questionnaire': '#3b82f6',
      'technical_interview': '#8b5cf6',
      'managerial_round': '#f59e0b'
    };
    return colors[type] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading interview schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mb-10 overflow-y-auto">
      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Interview Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View all interviews where you are assigned as an interviewer. Click on any event to see detailed information.
          </p>
          {interviews.length === 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                📅 No interviews scheduled yet. You'll see your assigned interviews here once they're scheduled by HR.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Details Dialog */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-3xl md:max-w-[80vw] w-full h-auto max-h-[85vh] flex flex-col overflow-y-auto bg-background dark:bg-background border-border dark:border-border">

          {selectedInterview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm md:text-base">
              {/* Instruction banner only if remark required */}
              {!isAdmin && needsRemarkForUser(selectedInterview) && (
                <div className="md:col-span-2 mb-2 p-3 rounded-lg border border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs md:text-sm font-medium">
                  ⚠️ Please provide your remark and grade for this interview. This is required because the interview has already been conducted and your input is pending.
                </div>
              )}

              {/* Interview Information */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base text-foreground dark:text-foreground">
                  <Calendar className="h-4 w-4" />
                  Interview Information
                </h4>
                <p className="text-foreground dark:text-foreground">
                  <strong>Title:</strong> {selectedInterview.title}
                </p>
                <p className="text-foreground dark:text-foreground">
                  <strong>Type:</strong>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    {selectedInterview.interview_type.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
                <p className="text-foreground dark:text-foreground">
                  <strong>Status:</strong>
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    {selectedInterview.status}
                  </span>
                </p>
                <p className="text-foreground dark:text-foreground">
                  <strong>Date:</strong> {new Date(selectedInterview.scheduled_at).toLocaleDateString()}
                </p>
                <p className="text-foreground dark:text-foreground">
                  <strong>Time:</strong> {new Date(selectedInterview.scheduled_at).toLocaleTimeString()} - {new Date(selectedInterview.end_time).toLocaleTimeString()}
                </p>
              </div>

              {/* Candidate Information */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base text-foreground dark:text-foreground">
                  <Users className="h-4 w-4" />
                  Candidate Information
                </h4>
                <p className="text-foreground dark:text-foreground">
                  <strong>Name:</strong> {selectedInterview.candidate.first_name} {selectedInterview.candidate.last_name}
                </p>
                <p className="text-foreground dark:text-foreground">
                  <strong>Email:</strong>
                  <a href={`mailto:${selectedInterview.candidate.email}`} className="ml-1 text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {selectedInterview.candidate.email}
                  </a>
                </p>
                <p className="text-foreground dark:text-foreground">
                  <strong>Stage:</strong>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStageColor(selectedInterview.candidate.current_stage)}`}>
                    {selectedInterview.candidate.current_stage}
                  </span>
                </p>
                <p className="text-foreground dark:text-foreground">
                  <strong>Applied Job:</strong> {selectedInterview.candidate.applied_job?.title || 'N/A'}
                </p>
              </div>

              {/* Panel */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base text-foreground dark:text-foreground">
                  <Users className="h-4 w-4" />
                  Interview Panel
                </h4>
                {selectedInterview.interviewers.map(interviewer => (
                  <div key={interviewer._id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                    <span className="text-foreground dark:text-foreground">{interviewer.name}</span>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">({interviewer.role})</span>
                  </div>
                ))}
              </div>

              {/* Meeting Details */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base text-foreground dark:text-foreground">
                  {selectedInterview.type === 'online' ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  Meeting Details
                </h4>

                <p className="text-foreground dark:text-foreground">
                  <strong>Format:</strong> {selectedInterview.type === 'online' ? "Online" : "In-Person"}
                </p>

                {selectedInterview.type === 'online' ? (
                  <>
                    <p className="text-foreground dark:text-foreground">
                      <strong>Platform:</strong> {selectedInterview.platform || 'Not specified'}
                    </p>
                    {selectedInterview.meeting_link && (
                      <a
                        href={selectedInterview.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 text-xs break-all hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        🔗 {selectedInterview.meeting_link}
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-foreground dark:text-foreground">
                    <strong>Address:</strong> {selectedInterview.address}
                  </p>
                )}

                {selectedInterview.description && (
                  <div>
                    <p className="text-foreground dark:text-foreground"><strong>Notes:</strong></p>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-foreground dark:text-foreground border border-border dark:border-border">
                      {selectedInterview.description}
                    </div>
                  </div>
                )}
              </div>

              {/* My remark (read-only) OR form */}
              {selectedInterview && !isAdmin && (
                <div className="md:col-span-2 space-y-3">
                  {myRemark ? (
                    <div className="p-3 border border-border dark:border-border rounded-lg bg-muted/30 dark:bg-muted/20">
                      <h4 className="font-semibold mb-1 text-foreground dark:text-foreground">📝 Your Submitted Remark</h4>
                      <div className="text-sm">
                        <p className="mb-2 text-foreground dark:text-foreground">
                          <strong>Grade:</strong> {myRemark.grade}
                        </p>
                        <p className="whitespace-pre-wrap text-foreground dark:text-foreground">{myRemark.remark}</p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                          Submitted at {new Date(myRemark.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : needsRemarkForUser(selectedInterview) ? (
                    <div className="p-3 border border-border dark:border-border rounded-lg bg-muted/30 dark:bg-muted/20">
                      <h4 className="font-semibold mb-2 text-foreground dark:text-foreground">📝 Your Remark (required)</h4>
                      <Textarea
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        placeholder="Share your observations…"
                        rows={3}
                        className="text-sm bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                      />
                      <div className="mt-3">
                        <Select value={remarkGrade} onValueChange={(v) => setRemarkGrade(v as Grade)}>
                          <SelectTrigger className="w-full text-sm bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent className="bg-background dark:bg-background border-border dark:border-border">
                            {gradeOptions.map((g) => (
                              <SelectItem 
                                key={g} 
                                value={g}
                                className="text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
                              >
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button size="sm" onClick={handleSubmitRemark}>Submit</Button>
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                        You're seeing this because the interview has already started and you haven't added your remark yet.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
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
            businessHours={{ daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' }}
            eventDidMount={(info) => {
              const candidateName = info.event.extendedProps?.candidateName || 'Unknown Candidate';
              const interviewerNames = info.event.extendedProps?.interviewerNames || [];
              info.el.title = `${info.event.title}\nCandidate: ${candidateName}\nInterviewers: ${interviewerNames.join(', ') || 'No interviewers assigned'}`;
              info.el.style.cursor = 'pointer';
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewScheduling;
