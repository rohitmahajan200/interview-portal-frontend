import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, Users, UserCheck, UserX, Calendar } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Candidate = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  profile_photo_url: {
    url: string;
    publicId: string;
  };
  applied_job: {
    description: {
      location: string;
      country: string;
      time: string;
      expInYears: string;
      salary: string;
    };
  };
  current_stage: "registered" | "hr" | "assessment" | "tech" | "manager" | "feedback";
  status: "active" | "inactive" | "withdrawn" | "rejected" | "hired" | "deleted";
  email_verified: boolean;
  registration_date: string;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
  documents?: { _id: string; document_type: string; document_url: string }[];
  hrQuestionnaire?: { _id: string; status: string }[];
  assessments?: { _id: string; status: string }[];
  interviews?: { _id: string; status: string }[];
  stage_history?: { _id: string; changed_at: string }[];
};

const InvigilatorHome = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await api.get("/org/candidates");
        setCandidates(response.data.data);
        setFilteredCandidates(response.data.data);
      } catch (error) {
        console.error("Failed to fetch candidates:", error);
        toast.error("Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Filter candidates
  useEffect(() => {
    let filtered = candidates;

    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stageFilter !== "assessment") {
      filtered = filtered.filter(candidate => candidate.current_stage === stageFilter);
    }

    if (statusFilter !== "assessment") {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, stageFilter, statusFilter]);

  // Badge color functions
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "registered": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "hr": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "assessment": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "tech": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "manager": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "feedback": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "withdrawn": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "hired": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Statistics
  const stats = {
    total: candidates.length,
    active: candidates.filter(c => c.status === 'active').length,
    hr_stage: candidates.filter(c => c.current_stage === 'assessment').length,
    pending_review: candidates.filter(c => c.current_stage === 'registered').length,
    assessment_stage: candidates.filter(c => c.current_stage === 'assessment').length
  };

  const fetchCandidateDetails = async (candidateId: string) => {
    try {
      setLoadingCandidate(true);
      const response = await api.get(`/org/candidates/${candidateId}`);
      setSelectedCandidate(response.data.data);
      setDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
      toast.error("Failed to load candidate details");
    } finally {
      setLoadingCandidate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invigilator Dashboard</h1>
        <p className="text-muted-foreground">
          Manage candidates and review applications
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_review}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Assessment Stage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.hr_stage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="hr">HR Review</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="tech">Technical</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Candidates Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={candidate.profile_photo_url.url} />
                          <AvatarFallback>
                            {candidate.first_name[0]}{candidate.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {candidate.first_name} {candidate.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {candidate.gender} • {formatDate(candidate.date_of_birth)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{candidate.email}</div>
                        <div className="text-sm text-muted-foreground">{candidate.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStageColor(candidate.current_stage)}>
                        {candidate.current_stage.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(candidate.status)}>
                        {candidate.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(candidate.registration_date)}
                    </TableCell>
                    <TableCell>
                      {candidate.last_login ? formatDate(candidate.last_login) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchCandidateDetails(candidate._id)}
                          disabled={loadingCandidate}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No candidates found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Details Dialog - Outside of table */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Single row layout with better spacing */}
                  <div className="flex flex-col gap-6">
                    {/* Avatar and Name Section */}
                    <div className="flex items-center space-x-4 md:min-w-[300px]">
                      <Avatar className="w-20 h-20 flex-shrink-0">
                        <AvatarImage src={selectedCandidate.profile_photo_url?.url} />
                        <AvatarFallback>
                          {selectedCandidate.first_name?.[0]}{selectedCandidate.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <h3 className="text-xl font-semibold">
                          {selectedCandidate.first_name} {selectedCandidate.last_name}
                        </h3>
                        <p className="text-muted-foreground">{selectedCandidate.email}</p>
                      </div>
                    </div>
                    
                    {/* Personal Details Section */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><strong>Phone:</strong> {selectedCandidate.phone}</div>
                      <div><strong>Gender:</strong> {selectedCandidate.gender}</div>
                      <div><strong>Date of Birth:</strong> {formatDate(selectedCandidate.date_of_birth)}</div>
                      <div className="sm:col-span-2"><strong>Address:</strong> {selectedCandidate.address}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Status Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Stage</div>
                      <Badge className={getStageColor(selectedCandidate.current_stage)}>
                        {selectedCandidate.current_stage?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge className={getStatusColor(selectedCandidate.status)}>
                        {selectedCandidate.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email Verified</div>
                      <Badge className={selectedCandidate.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedCandidate.email_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Registration Date</div>
                      <div className="text-sm">{formatDate(selectedCandidate.registration_date)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Applied Job */}
              {selectedCandidate.applied_job && (
                <Card>
                  <CardHeader>
                    <CardTitle>Applied Position</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><strong>Location:</strong> {selectedCandidate.applied_job.description?.location}</div>
                      <div><strong>Country:</strong> {selectedCandidate.applied_job.description?.country}</div>
                      <div><strong>Time:</strong> {selectedCandidate.applied_job.description?.time}</div>
                      <div><strong>Experience:</strong> {selectedCandidate.applied_job.description?.expInYears}</div>
                      <div><strong>Salary:</strong> {selectedCandidate.applied_job.description?.salary}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {selectedCandidate.documents && selectedCandidate.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCandidate.documents.map((doc: { _id: string; document_type: string; document_url: string }) => (
                        <div key={doc._id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium capitalize">{doc.document_type}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(doc.document_url, '_blank')}
                          >
                            View Document
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* HR Questionnaire Status */}
              {selectedCandidate.hrQuestionnaire && selectedCandidate.hrQuestionnaire.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>HR Questionnaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCandidate.hrQuestionnaire.map((questionnaire: { _id: string; status: string }) => (
                        <div key={questionnaire._id} className="flex items-center justify-between">
                          <span>Questionnaire Status:</span>
                          <Badge className={questionnaire.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            {questionnaire.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessments Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.assessments && selectedCandidate.assessments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCandidate.assessments.map((assessment: { _id: string; status: string }) => (
                        <div key={assessment._id} className="flex items-center justify-between">
                          <span>Assessment Status:</span>
                          <Badge>{assessment.status.toUpperCase()}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No assessments assigned yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Interviews Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCandidate.interviews && selectedCandidate.interviews.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCandidate.interviews.map((interview: { _id: string; status: string }) => (
                        <div key={interview._id} className="flex items-center justify-between">
                          <span>Interview Status:</span>
                          <Badge>{interview.status.toUpperCase()}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No interviews scheduled yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Stage History */}
              {selectedCandidate.stage_history && selectedCandidate.stage_history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Stage History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCandidate.stage_history.map((stage: { _id: string; changed_at: string }) => (
                        <div key={stage._id} className="text-sm">
                          <strong>Changed At:</strong> {formatDate(stage.changed_at)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvigilatorHome;
