// components/analytics/HRAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Award,
  FileText,
  BarChart3,
  Activity,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type {
  DashboardAnalytics,
  JobAnalytics,
  StageAnalytics,
  AssessmentStats,
  ScoreAnalysis,
  InterviewTypeStats,
  InterviewFormatStats,
  UpcomingInterview,
  PerformanceMetrics,
  RegistrationTrend,
  DailyActivity,
} from '../../types/analytics'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const HRAnalyticsDashboard: React.FC = () => {
  // State for different analytics data
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');

  // Analytics data state
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [jobAnalytics, setJobAnalytics] = useState<JobAnalytics[]>([]);
  const [stageAnalytics, setStageAnalytics] = useState<StageAnalytics[]>([]);
  const [assessmentData, setAssessmentData] = useState<{
    assessmentStats: AssessmentStats[];
    scoreAnalysis: ScoreAnalysis;
    assessmentByJob: any[];
    recentAssessments: any[];
  } | null>(null);
  const [interviewData, setInterviewData] = useState<{
    interviewTypeStats: InterviewTypeStats[];
    interviewFormatStats: InterviewFormatStats[];
    upcomingInterviews: UpcomingInterview[];
    interviewTrends: any[];
    interviewerWorkload: any[];
  } | null>(null);
  const [trendsData, setTrendsData] = useState<{
    registrationTrends: RegistrationTrend[];
    dailyActivity: DailyActivity[];
    performanceMetrics: PerformanceMetrics;
  } | null>(null);

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [
        dashboardRes,
        jobsRes,
        stagesRes,
        assessmentsRes,
        interviewsRes,
        trendsRes
      ] = await Promise.all([
        api.get('/org/analytics/dashboard'),
        api.get('/org/analytics/jobs'),
        api.get('/org/analytics/stages'),
        api.get('/org/analytics/assessments'),
        api.get('/org/analytics/interviews'),
        api.get('/org/analytics/trends')
      ]);

      setDashboardData(dashboardRes.data.data);
      setJobAnalytics(jobsRes.data.data.jobAnalytics);
      setStageAnalytics(stagesRes.data.data.stageDistribution);
      setAssessmentData(assessmentsRes.data.data);
      setInterviewData(interviewsRes.data.data);
      setTrendsData(trendsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const getStageColor = (stage: string): string => {
    const colors: { [key: string]: string } = {
      registered: '#3B82F6',
      hr: '#8B5CF6',
      assessment: '#F59E0B',
      tech: '#F97316',
      manager: '#10B981',
      feedback: '#6B7280'
    };
    return colors[stage] || '#6B7280';
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      active: '#10B981',
      inactive: '#6B7280',
      withdrawn: '#F59E0B',
      rejected: '#EF4444',
      hired: '#059669',
      deleted: '#DC2626'
    };
    return colors[status] || '#6B7280';
  };

  const renderMetricCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    trend?: { value: number; isPositive: boolean },
    color = 'text-blue-600'
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? formatNumber(value) : value}</div>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend.value)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your recruitment process
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard(
              "Total Candidates",
              dashboardData?.overview.totalCandidates || 0,
              <Users className="h-4 w-4" />,
              undefined,
              "text-blue-600"
            )}
            {renderMetricCard(
              "Active Candidates",
              dashboardData?.overview.activeCandidates || 0,
              <UserCheck className="h-4 w-4" />,
              undefined,
              "text-green-600"
            )}
            {renderMetricCard(
              "Hired",
              dashboardData?.overview.hiredCandidates || 0,
              <Award className="h-4 w-4" />,
              undefined,
              "text-emerald-600"
            )}
            {renderMetricCard(
              "Pending Review",
              dashboardData?.overview.pendingReview || 0,
              <Clock className="h-4 w-4" />,
              undefined,
              "text-orange-600"
            )}
          </div>

          {/* Completion Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderMetricCard(
              "Assessment Completion Rate",
              formatPercentage(dashboardData?.completionRates.assessmentCompletionRate || 0),
              <Target className="h-4 w-4" />,
              undefined,
              "text-purple-600"
            )}
            {renderMetricCard(
              "Interview Completion Rate",
              formatPercentage(dashboardData?.completionRates.interviewCompletionRate || 0),
              <Calendar className="h-4 w-4" />,
              undefined,
              "text-indigo-600"
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Stage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.distributions.stageDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {dashboardData?.distributions.stageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStageColor(entry.stage)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData?.distributions.statusDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {dashboardData?.distributions.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Job Title</th>
                      <th className="text-right p-4">Applications</th>
                      <th className="text-right p-4">Active</th>
                      <th className="text-right p-4">Shortlisted</th>
                      <th className="text-right p-4">Hired</th>
                      <th className="text-right p-4">Shortlisting Rate</th>
                      <th className="text-right p-4">Hiring Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobAnalytics.map((job) => (
                      <tr key={job._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium">{job.jobName}</div>
                        </td>
                        <td className="text-right p-4">{formatNumber(job.totalApplications)}</td>
                        <td className="text-right p-4">
                          <Badge variant="secondary">{formatNumber(job.activeApplications)}</Badge>
                        </td>
                        <td className="text-right p-4">
                          <Badge variant="default">{formatNumber(job.shortlistedApplications)}</Badge>
                        </td>
                        <td className="text-right p-4">
                          <Badge className="bg-green-100 text-green-800">
                            {formatNumber(job.hiredApplications)}
                          </Badge>
                        </td>
                        <td className="text-right p-4">{formatPercentage(job.shortlistingRate)}</td>
                        <td className="text-right p-4">{formatPercentage(job.hiringRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Job Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Job Applications vs Hiring Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={jobAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jobName" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalApplications" fill="#8884d8" name="Total Applications" />
                  <Bar yAxisId="left" dataKey="hiredApplications" fill="#82ca9d" name="Hired" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stages Tab */}
        <TabsContent value="stages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Current Stage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stageAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {stageAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStageColor(entry.stage)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stage Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Stage Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stageAnalytics.map((stage) => (
                    <div key={stage.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{stage.stage.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(stage.count)} candidates
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Avg: {stage.avgDaysInStage} days
                        </div>
                        <Badge variant="outline">
                          {formatNumber(stage.shortlisted)} shortlisted
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {assessmentData && (
              <>
                {renderMetricCard(
                  "Total Assessments",
                  assessmentData.assessmentStats.reduce((sum, stat) => sum + stat.count, 0),
                  <FileText className="h-4 w-4" />,
                  undefined,
                  "text-blue-600"
                )}
                {renderMetricCard(
                  "Average Score",
                  formatPercentage(assessmentData.scoreAnalysis.avgScore || 0),
                  <Target className="h-4 w-4" />,
                  undefined,
                  "text-green-600"
                )}
                {renderMetricCard(
                  "Evaluated Responses",
                  assessmentData.scoreAnalysis.totalEvaluated,
                  <BarChart3 className="h-4 w-4" />,
                  undefined,
                  "text-purple-600"
                )}
                {renderMetricCard(
                  "Max Score Achieved",
                  formatPercentage(assessmentData.scoreAnalysis.maxScore || 0),
                  <Award className="h-4 w-4" />,
                  undefined,
                  "text-orange-600"
                )}
              </>
            )}
          </div>

          {/* Assessment Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assessmentData?.assessmentStats || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {assessmentData?.assessmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          {assessmentData?.recentAssessments && assessmentData.recentAssessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Assessment Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentData.recentAssessments.slice(0, 5).map((assessment: any) => (
                    <div key={assessment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {assessment.candidate?.first_name} {assessment.candidate?.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{assessment.candidate?.email}</div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={
                            assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            assessment.status === 'started' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {assessment.status}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">
                          {assessment.exam_duration} min exam
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Interviews Tab */}
        <TabsContent value="interviews" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interview Type Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Type Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviewData?.interviewTypeStats.map((type) => (
                    <div key={type.interviewType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium capitalize">
                          {type.interviewType.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(type.total)} total interviews
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatPercentage(type.completionRate)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(type.completed)} completed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interview Format Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={interviewData?.interviewFormatStats || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {interviewData?.interviewFormatStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Interviews */}
          {interviewData?.upcomingInterviews && interviewData.upcomingInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Interviews (Next 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviewData.upcomingInterviews.map((interview) => (
                    <div key={interview._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{interview.title}</div>
                        <div className="text-sm text-gray-600">
                          {interview.candidate.first_name} {interview.candidate.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{interview.candidate.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Date(interview.scheduled_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(interview.scheduled_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {interview.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interviewer Workload */}
          {interviewData?.interviewerWorkload && interviewData.interviewerWorkload.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Interviewers by Workload</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interviewData.interviewerWorkload}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="interviewerName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalInterviews" fill="#8884d8" name="Total Interviews" />
                    <Bar dataKey="completedInterviews" fill="#82ca9d" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Performance Comparison */}
          {trendsData?.performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>This Month Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trendsData.performanceMetrics.thisMonth.map((metric, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 text-sm">
                        <div>Total: {formatNumber(metric.total)}</div>
                        <div className="text-green-600">Hired: {formatNumber(metric.hired)}</div>
                        <div className="text-blue-600">Shortlisted: {formatNumber(metric.shortlisted)}</div>
                        <div className="text-red-600">Rejected: {formatNumber(metric.rejected)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Last Month Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trendsData.performanceMetrics.lastMonth.map((metric, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 text-sm">
                        <div>Total: {formatNumber(metric.total)}</div>
                        <div className="text-green-600">Hired: {formatNumber(metric.hired)}</div>
                        <div className="text-blue-600">Shortlisted: {formatNumber(metric.shortlisted)}</div>
                        <div className="text-red-600">Rejected: {formatNumber(metric.rejected)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Registration Trends */}
          {trendsData?.registrationTrends && (
            <Card>
              <CardHeader>
                <CardTitle>Registration Trends (Last 12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendsData.registrationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month"
                      tickFormatter={(value) => {
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return months[value - 1];
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return months[value - 1];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="#8884d8" 
                      name="Registrations"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shortlisted" 
                      stroke="#82ca9d" 
                      name="Shortlisted"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hired" 
                      stroke="#ffc658" 
                      name="Hired"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Daily Activity (Last 30 Days) */}
          {trendsData?.dailyActivity && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Registration Activity (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendsData.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Bar dataKey="registrations" fill="#8884d8" name="Registrations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRAnalyticsDashboard;
