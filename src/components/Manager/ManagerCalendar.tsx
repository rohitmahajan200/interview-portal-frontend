import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, MapPin, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from "@/lib/api";

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

const InterviewScheduling = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch interviews on component mount
  useEffect(() => {
    fetchInterviews();
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

  const fetchInterviews = async () => {
    try {
      // The backend already filters interviews for invigilators - only returns interviews where they are assigned
      const response = await api.get("/org/interviews");
      if (response.data.success) {
        setInterviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const interview = clickInfo.event.extendedProps.interview as Interview;
    setSelectedInterview(interview);
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

      {/* Interview Details Dialog - Read Only */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-4xl md:max-w-[70vw] lg:max-w-[90vw] w-full h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader className="mt-4">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Interview Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedInterview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Interview Information
                </h4>
                <div className="space-y-2">
                  <p><strong>Title:</strong> {selectedInterview.title}</p>
                  <p><strong>Type:</strong> 
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {selectedInterview.interview_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                  <p><strong>Status:</strong> 
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {selectedInterview.status}
                    </span>
                  </p>
                  <p><strong>Date:</strong> {new Date(selectedInterview.scheduled_at).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(selectedInterview.scheduled_at).toLocaleTimeString()} - {new Date(selectedInterview.end_time).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Candidate Information
                </h4>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedInterview.candidate.first_name} {selectedInterview.candidate.last_name}</p>
                  <p><strong>Email:</strong> 
                    <a href={`mailto:${selectedInterview.candidate.email}`} className="ml-2 text-blue-600 hover:underline">
                      {selectedInterview.candidate.email}
                    </a>
                  </p>
                  <p><strong>Current Stage:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStageColor(selectedInterview.candidate.current_stage)}`}>
                      {selectedInterview.candidate.current_stage}
                    </span>
                  </p>
                  <p><strong>Applied Job:</strong> {selectedInterview.candidate.applied_job?.name || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Interview Panel
                </h4>
                <div className="space-y-2">
                  {selectedInterview.interviewers.map(interviewer => (
                    <div key={interviewer._id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{interviewer.name}</span>
                      <span className="text-sm text-gray-500">({interviewer.role})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  {selectedInterview.type === 'online' ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  Meeting Details
                </h4>
                <div className="space-y-3">
                  <p><strong>Format:</strong> 
                    <span className="ml-2 capitalize flex items-center gap-1">
                      {selectedInterview.type === 'online' ? (
                        <>
                          <Video className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Online</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-600">In-Person</span>
                        </>
                      )}
                    </span>
                  </p>
                  
                  {selectedInterview.type === 'online' ? (
                    <>
                      <div>
                        <p><strong>Platform:</strong> {selectedInterview.platform || 'Not specified'}</p>
                      </div>
                      <div>
                        <p><strong>Meeting Link:</strong></p>
                        <a 
                          href={selectedInterview.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block mt-1 p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 break-all text-sm font-medium"
                        >
                          🔗 {selectedInterview.meeting_link}
                        </a>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p><strong>Address:</strong></p>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        📍 {selectedInterview.address}
                      </div>
                    </div>
                  )}
                  
                  {selectedInterview.description && (
                    <div>
                      <p><strong>Additional Notes:</strong></p>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        {selectedInterview.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FullCalendar Component - Read Only */}
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
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '09:00',
              endTime: '18:00'
            }}
            eventDidMount={(info) => {
              const candidateName = info.event.extendedProps?.candidateName || 'Unknown Candidate';
              const interviewerNames = info.event.extendedProps?.interviewerNames || [];
              
              info.el.title = `${info.event.title}\nCandidate: ${candidateName}\nInterviewers: ${interviewerNames.join(', ') || 'No interviewers assigned'}`;
              
              // Add cursor pointer for better UX
              info.el.style.cursor = 'pointer';
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewScheduling;
