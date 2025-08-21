// src/components/Manager/ManagerCalendar.tsx
import React, { useEffect, useState } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Video, MapPin, Users, Phone, Copy, ExternalLink, Loader2, Mail } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

// Enhanced Interview interface matching backend response
interface ManagerCalendarInterview {
  _id: string;
  title: string;
  candidate: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    profile_photo_url?: { url: string };
    current_stage: string;
    applied_job: { name: string; description?: string };
    status: string;
  };
  interview_type: string;
  interviewers: Array<{
    _id: string;
    name: string;
    role: string;
    email?: string;
  }>;
  scheduled_at: string;
  end_time: string;
  type: 'online' | 'offline';
  meeting_link?: string;
  address?: string;
  platform?: string;
  description?: string;
  status: string;
  scheduled_by?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  remarks?: Array<{
    _id: string;
    provider: {
      _id: string;
      name: string;
      role: string;
    };
    remark: string;
    created_at: string;
  }>;
  // Enhanced metadata from backend
  canJoinMeeting?: boolean;
  isUpcoming?: boolean;
  isOngoing?: boolean;
  isCompleted?: boolean;
  candidateName?: string;
  interviewerNames?: string[];
  durationMinutes?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    interview: ManagerCalendarInterview;
    candidateName: string;
    candidateStage: string;
    candidateJob: string;
    interviewerNames: string[];
    canJoinMeeting: boolean;
    isOngoing: boolean;
  };
}

// Backend API response interface
interface InterviewsResponse {
  success: boolean;
  data: ManagerCalendarInterview[];
  count: number;
  isAdmin: boolean;
}

const ManagerCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [interviews, setInterviews] = useState<ManagerCalendarInterview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<ManagerCalendarInterview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Get user info for admin/manager role check
  const user = useSelector((state: RootState) => state.orgAuth.user);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Convert interviews to calendar events
  useEffect(() => {
    console.log('Converting interviews to calendar events:', interviews);
    
    const calendarEvents: CalendarEvent[] = interviews.map(interview => {
      const canJoin = interview.canJoinMeeting || false;
      const isOngoing = interview.isOngoing || false;
      
      return {
        id: interview._id,
        title: `${interview.title}`,
        start: new Date(interview.scheduled_at),
        end: new Date(interview.end_time),
        backgroundColor: getEventColor(interview),
        borderColor: getEventBorderColor(interview),
        extendedProps: {
          interview,
          candidateName: interview.candidateName || `${interview.candidate.first_name} ${interview.candidate.last_name}`,
          candidateStage: interview.candidate.current_stage,
          candidateJob: interview.candidate.applied_job?.name || 'No Job',
          interviewerNames: interview.interviewerNames || interview.interviewers.map(i => i.name),
          canJoinMeeting: canJoin,
          isOngoing
        }
      };
    });
    
    console.log('Generated calendar events:', calendarEvents);
    setEvents(calendarEvents);
  }, [interviews]);

  const fetchInterviews = async (): Promise<void> => {
    try {
      setLoading(true);
      // Use the new backend route
      const response = await api.get<InterviewsResponse>('/org/my-meetings/interviews');
      
      if (response.data.success) {
        setInterviews(response.data.data || []);
        toast.success(`Loaded ${response.data.count} interviews`);
      }
    } catch (error) {
      console.error('Failed to load interviews:', error);
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async (interviewId: string): Promise<void> => {
    try {
      // Direct join using the meeting link if available
      const interview = interviews.find(i => i._id === interviewId);
      if (interview?.meeting_link) {
        window.open(interview.meeting_link, '_blank');
        toast.success('Opening meeting...');
        return;
      }

      // Fallback to join endpoint if no direct link
      const response = await api.post<{ success: boolean; data: { meeting_link: string } }>(`/org/interviews/${interviewId}/join`);
      if (response.data.success && response.data.data.meeting_link) {
        window.open(response.data.data.meeting_link, '_blank');
        toast.success('Joining meeting...');
      }
    } catch (error: unknown) {
      console.error('Failed to join meeting:', error);
      if (error instanceof Error || (error && typeof error === 'object' && 'response' in error)) {
        const apiError = error as { response?: { data?: { message?: string } } };
        toast.error(apiError.response?.data?.message || 'Failed to join meeting');
      } else {
        toast.error('Failed to join meeting');
      }
    }
  };

  const copyMeetingLink = async (link: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Meeting link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const interview = clickInfo.event.extendedProps.interview as ManagerCalendarInterview;
    setSelectedInterview(interview);
  };

  // Enhanced color coding based on interview state
  const getEventColor = (interview: ManagerCalendarInterview) => {
    if (interview.canJoinMeeting) return '#22c55e'; // Green for joinable
    if (interview.isOngoing) return '#f59e0b'; // Orange for ongoing
    if (interview.isCompleted) return '#6b7280'; // Gray for completed
    
    // Default colors by type
    const typeColors = {
      'hr_questionnaire': '#3b82f6',
      'technical_interview': '#8b5cf6',
      'managerial_round': '#f59e0b'
    };
    return typeColors[interview.interview_type as keyof typeof typeColors] || '#6b7280';
  };

  const getEventBorderColor = (interview: ManagerCalendarInterview) => {
    if (interview.canJoinMeeting) return '#16a34a';
    if (interview.isOngoing) return '#d97706';
    return getEventColor(interview);
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

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (interview: ManagerCalendarInterview) => {
    if (interview.canJoinMeeting) return 'default';
    if (interview.isOngoing) return 'secondary';
    if (interview.isCompleted) return 'outline';
    return 'outline';
  };

  const getStatusText = (interview: ManagerCalendarInterview) => {
    if (interview.canJoinMeeting) return 'Join Now';
    if (interview.isOngoing) return 'Ongoing';
    if (interview.isCompleted) return 'Completed';
    if (interview.isUpcoming) return 'Upcoming';
    return interview.status;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading interview calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header - Dashboard counts removed */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Calendar</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? 'Admin view - All scheduled interviews' 
            : 'Your scheduled interviews and meetings as a manager'}
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            initialView="timeGridWeek"
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
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            eventDidMount={(info) => {
              const candidateName = info.event.extendedProps?.candidateName || 'Unknown Candidate';
              const interviewerNames = info.event.extendedProps?.interviewerNames || [];
              const canJoin = info.event.extendedProps?.canJoinMeeting;
              
              info.el.title = `${info.event.title}\nCandidate: ${candidateName}\nInterviewers: ${interviewerNames.join(', ') || 'No interviewers assigned'}${canJoin ? '\n🎥 Click to join meeting' : ''}`;
              
              // Add visual indicator for joinable meetings
              if (canJoin) {
                info.el.style.cursor = 'pointer';
                info.el.style.boxShadow = '0 0 8px rgba(34, 197, 94, 0.6)';
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Interview Details Modal - Enhanced Width */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                <div className="flex flex-col items-start">
                  <span className="text-xl font-bold">Interview Details</span>
                  {selectedInterview && (
                    <span className="text-sm text-muted-foreground font-normal">
                      {selectedInterview.title}
                    </span>
                  )}
                </div>
              </span>
              {selectedInterview && (
                <Badge variant={getStatusBadgeVariant(selectedInterview)} className="ml-2 text-sm px-3 py-1">
                  {getStatusText(selectedInterview)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInterview && (
            <div className="space-y-8 p-2">
              {/* Candidate Information - Full Width */}
              <Card className="border-2 border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xl text-blue-800">Candidate Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 border-4 border-blue-200">
                      <AvatarImage src={selectedInterview.candidate.profile_photo_url?.url} />
                      <AvatarFallback className="text-xl font-bold text-blue-700 bg-blue-100">
                        {selectedInterview.candidate.first_name[0]}{selectedInterview.candidate.last_name}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-800 mb-2">
                        {selectedInterview.candidate.first_name} {selectedInterview.candidate.last_name}
                      </h3>
                      <p className="text-blue-600 font-semibold text-lg mb-3">{selectedInterview.candidate.applied_job.name}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Email:</span>
                          <span>{selectedInterview.candidate.email}</span>
                        </div>
                        <br></br>
                        {selectedInterview.candidate.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Phone:</span>
                            <span>{selectedInterview.candidate.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={`${getStageColor(selectedInterview.candidate.current_stage)} px-4 py-2 text-sm font-semibold`}>
                        Current Stage - {selectedInterview.candidate.current_stage}
                      </Badge>
                      <Badge variant="outline" className="px-4 py-2 text-sm">
                        Status - {selectedInterview.candidate.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Three Column Layout for Details */}
              <div className="grid grid-cols-1 xxl:grid-cols- gap-8">
                {/* Interview Details */}
                <Card className="xl:col-span-1">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg text-gray-800">Interview Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Title</h4>
                      <p className="text-gray-900 font-medium">{selectedInterview.title}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Type</h4>
                      <p className="text-gray-900">{selectedInterview.interview_type.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Schedule</h4>
                      <p className="text-gray-900 font-medium">
                        {formatDateTime(selectedInterview.scheduled_at)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        until {new Date(selectedInterview.end_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {selectedInterview.durationMinutes && (
                        <p className="text-sm text-blue-600 font-medium">Duration: {selectedInterview.durationMinutes} minutes</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Format</h4>
                      <p className="flex items-center gap-2 text-gray-900">
                        {selectedInterview.type === 'online' ? (
                          <Video className="h-5 w-5 text-blue-600" />
                        ) : (
                          <MapPin className="h-5 w-5 text-green-600" />
                        )}
                        <span className="font-medium">
                          {selectedInterview.type === 'online' 
                            ? `Online (${selectedInterview.platform || 'Platform not specified'})` 
                            : 'In-person'
                          }
                        </span>
                      </p>
                    </div>
                    
                    {selectedInterview.scheduled_by && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Scheduled By</h4>
                        <p className="text-gray-900">{selectedInterview.scheduled_by.name} ({selectedInterview.scheduled_by.role})</p>
                      </div>
                    )}
                    
                    {selectedInterview.description && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
                        <p className="text-gray-900 text-sm leading-relaxed">{selectedInterview.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Meeting Actions & Interviewers */}
                <Card className="xl:col-span-1">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-lg text-green-800">Meeting Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4">
                      {selectedInterview.canJoinMeeting && (
                        <Button
                          onClick={() => joinMeeting(selectedInterview._id)}
                          className="bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                          size="lg"
                        >
                          <Video className="h-6 w-6 mr-3" />
                          Join Meeting Now
                        </Button>
                      )}
                      
                      {selectedInterview.meeting_link && (
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            onClick={() => copyMeetingLink(selectedInterview.meeting_link!)}
                            className="h-11"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => window.open(selectedInterview.meeting_link, '_blank')}
                            className="h-11"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Link
                          </Button>
                        </div>
                      )}
                      
                      {selectedInterview.candidate.phone && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(`tel:${selectedInterview.candidate.phone}`)}
                          className="h-11"
                        >
                          <Phone className="h-5 w-5 mr-2" />
                          Call Candidate
                        </Button>
                      )}

                      {selectedInterview.type === 'offline' && selectedInterview.address && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-semibold text-gray-700 mb-2">Meeting Address</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{selectedInterview.address}</p>
                        </div>
                      )}
                    </div>

                    {/* Interviewers */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Interviewers ({selectedInterview.interviewers.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedInterview.interviewers.map(interviewer => (
                          <div key={interviewer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{interviewer.name}</span>
                              {interviewer.email && (
                                <p className="text-xs text-gray-600 mt-1">{interviewer.email}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {interviewer.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerCalendar;
