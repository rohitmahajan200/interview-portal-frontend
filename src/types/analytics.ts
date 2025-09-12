// types/analytics.ts
export interface AnalyticsOverview {
  totalCandidates: number;
  activeCandidates: number;
  shortlistedCandidates: number;
  rejectedCandidates: number;
  hiredCandidates: number;
  pendingReview: number;
  recentRegistrations: number;
}

export interface StageDistribution {
  stage: string;
  count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface DashboardAnalytics {
  overview: AnalyticsOverview;
  distributions: {
    stageDistribution: StageDistribution[];
    statusDistribution: StatusDistribution[];
  };
  completionRates: {
    assessmentCompletionRate: number;
    interviewCompletionRate: number;
  };
}

export interface JobAnalytics {
  _id: string;
  jobName: string;
  totalApplications: number;
  activeApplications: number;
  shortlistedApplications: number;
  rejectedApplications: number;
  hiredApplications: number;
  shortlistingRate: number;
  hiringRate: number;
}

export interface StageAnalytics {
  stage: string;
  count: number;
  shortlisted: number;
  avgDaysInStage: number;
}

export interface AssessmentStats {
  status: string;
  count: number;
  avgDuration: number;
}

export interface ScoreAnalysis {
  avgScore: number;
  minScore: number;
  maxScore: number;
  totalEvaluated: number;
}

export interface InterviewTypeStats {
  interviewType: string;
  total: number;
  completed: number;
  scheduled: number;
  completionRate: number;
}

export interface InterviewFormatStats {
  format: string;
  count: number;
}

export interface UpcomingInterview {
  _id: string;
  title: string;
  candidate: {
    first_name: string;
    last_name: string;
    email: string;
  };
  interviewers: Array<{
    name: string;
    role: string;
  }>;
  scheduled_at: string;
  end_time: string;
  type: string;
  meeting_link?: string;
  platform?: string;
}

export interface PerformanceMetrics {
  thisMonth: Array<{
    total: number;
    shortlisted: number;
    hired: number;
    rejected: number;
  }>;
  lastMonth: Array<{
    total: number;
    shortlisted: number;
    hired: number;
    rejected: number;
  }>;
}

export interface RegistrationTrend {
  month: number;
  year: number;
  registrations: number;
  shortlisted: number;
  hired: number;
}

export interface DailyActivity {
  date: string;
  registrations: number;
}

export interface ChartDataPoint {
  stage: string;
  count: number;
  [key: string]: any;
}