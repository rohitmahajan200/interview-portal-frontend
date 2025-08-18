import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  ClipboardList,
  Search,
  Users,
  Briefcase,
  X,
  RefreshCw,
  CheckCircle,
  ArrowRightLeft, // Adding an icon for reassignments
} from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

// TypeScript Interfaces (keeping all your existing interfaces)
type Role = "ADMIN" | "HR" | "INVIGILATOR" | "MANAGER";
type Stage =
  | "registered"
  | "hr"
  | "assessment"
  | "tech"
  | "manager"
  | "feedback";
type CandidateStatus =
  | "active"
  | "inactive"
  | "withdrawn"
  | "rejected"
  | "hired"
  | "deleted";

interface Job {
  _id: string;
  name: string;
  description?: string;
}

interface Candidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_stage: Stage;
  status: CandidateStatus;
  applied_job?: {
    _id: string;
    name: string;
    description?: string;
  };
  assigned_manager?: boolean;
  date_of_birth?: string;
  registration_date?: string;
}

interface User {
  _id: string;
  name?: string;
  email: string;
  role: Role;
  email_verified: boolean;
  candidates?: (string | Candidate)[];
  jobs?: (string | Job)[];
  createdAt: string;
  updatedAt: string;
}

const UnifiedAssignmentDashboard = () => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("manager-assignment");
  const [showReassignments, setShowReassignments] = useState(false); // New state for toggling reassignments

  // Data States
  const [managers, setManagers] = useState<User[]>([]);
  const [invigilators, setInvigilators] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [unassignedCandidates, setUnassignedCandidates] = useState<Candidate[]>(
    []
  );
  const [jobCandidates, setJobCandidates] = useState<Candidate[]>([]);

  // Manager Assignment States
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");

  // Invigilator Assignment States
  const [selectedInvigilator, setSelectedInvigilator] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  // Manager Reassignment States
  const [reassignCandidates, setReassignCandidates] = useState<string[]>([]);
  const [currentManagerForReassign, setCurrentManagerForReassign] =
    useState("");
  const [newManagerForReassign, setNewManagerForReassign] = useState("");
  const [isReassigningManager, setIsReassigningManager] = useState(false);

  // Invigilator Reassignment States
  const [reassignJobs, setReassignJobs] = useState<string[]>([]);
  const [currentInvigilatorForReassign, setCurrentInvigilatorForReassign] =
    useState("");
  const [newInvigilatorForReassign, setNewInvigilatorForReassign] =
    useState("");
  const [isReassigningInvigilator, setIsReassigningInvigilator] =
    useState(false);

  // Loading States
  const [isAssigningToManager, setIsAssigningToManager] = useState(false);
  const [isAssigningToInvigilator, setIsAssigningToInvigilator] =
    useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedJobs.length > 0) {
      fetchJobsCandidates(selectedJobs);
    } else {
      setJobCandidates([]);
    }
  }, [selectedJobs]);

  // All your existing functions (fetchInitialData, handleManagerAssignment, etc.)
  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      setError("");

      const [usersRes, jobsRes, candidatesRes] = await Promise.all([
        api.get("/org/orgUser"),
        api.get("/candidates/jobs"),
        api.get("/org/unassigned-candidates"),
      ]);

      if (usersRes.data.success) {
        const users = usersRes.data.data || [];
        console.log("new info=>", usersRes.data.data);

        setManagers(users.filter((user: User) => user.role === "MANAGER"));
        setInvigilators(
          users.filter((user: User) => user.role === "INVIGILATOR")
        );
      }

      if (jobsRes.data.success) {
        setJobs(jobsRes.data.jobs || []);
      }

      if (candidatesRes.data.success) {
        setUnassignedCandidates(candidatesRes.data.data?.candidates || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch initial data:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to load dashboard data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchJobsCandidates = async (jobIds: string[]) => {
    try {
      const candidatesPromises = jobIds.map((jobId) =>
        api.get(`/org/job/${jobId}/candidates`)
      );

      const responses = await Promise.all(candidatesPromises);

      const allCandidates: Candidate[] = [];
      responses.forEach((response) => {
        if (response.data.success) {
          allCandidates.push(...(response.data.data?.candidates || []));
        }
      });

      // Remove duplicates based on candidate ID
      const uniqueCandidates = allCandidates.filter(
        (candidate, index, self) =>
          index === self.findIndex((c) => c._id === candidate._id)
      );

      setJobCandidates(uniqueCandidates);
    } catch (error: unknown) {
      console.error("Failed to fetch job candidates:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch job candidates";
      toast.error(errorMessage);
    }
  };

  const handleManagerAssignment = async () => {
    if (!selectedManager || (selectedCandidates || []).length === 0) {
      const errorMessage = "Please select a manager and at least one candidate";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    try {
      setIsAssigningToManager(true);
      setError("");
      setSuccess("");

      const response = await api.post("/org/assign-to-manager", {
        managerId: selectedManager,
        candidateIds: selectedCandidates,
      });

      if (response.data.success) {
        const successMessage = response.data.message;
        setSuccess(successMessage);
        toast.success(successMessage);

        setSelectedCandidates([]);
        setSelectedManager("");
        setCandidateSearchTerm("");

        await fetchInitialData();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to assign candidates to manager";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAssigningToManager(false);
    }
  };

  const handleInvigilatorAssignment = async () => {
    if (!selectedInvigilator || (selectedJobs || []).length === 0) {
      const errorMessage = "Please select an invigilator and at least one job";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    try {
      setIsAssigningToInvigilator(true);
      setError("");
      setSuccess("");

      // Assign invigilator to each selected job
      const assignmentPromises = selectedJobs.map((jobId) =>
        api.post("/org/assign-to-invigilator", {
          invigilatorId: selectedInvigilator,
          jobId: jobId,
        })
      );

      const responses = await Promise.all(assignmentPromises);

      let totalAssigned = 0;
      const jobNames: string[] = [];

      responses.forEach((response, index) => {
        if (response.data.success) {
          totalAssigned += response.data.data?.assignedCandidates?.length || 0;
          jobNames.push(
            jobs.find((job) => job._id === selectedJobs[index])?.name ||
              "Unknown Job"
          );
        }
      });

      const successMessage = `Successfully assigned invigilator to ${
        selectedJobs.length
      } job(s): ${jobNames.join(
        ", "
      )}. Total candidates assigned: ${totalAssigned}`;
      setSuccess(successMessage);
      toast.success(successMessage);

      setSelectedInvigilator("");
      setSelectedJobs([]);
      setJobCandidates([]);

      await fetchInitialData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to assign invigilator to jobs";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAssigningToInvigilator(false);
    }
  };

  // Manager Reassignment handler
  const handleManagerReassignment = async () => {
    if (!newManagerForReassign || reassignCandidates.length === 0) {
      toast.error("Please select the new manager and candidates to reassign");
      return;
    }
    try {
      setIsReassigningManager(true);
      const response = await api.put("/org/update-assignment", {
        candidateIds: reassignCandidates,
        newManagerId: newManagerForReassign,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setReassignCandidates([]);
        setCurrentManagerForReassign("");
        setNewManagerForReassign("");
        await fetchInitialData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to reassign candidates."
      );
    } finally {
      setIsReassigningManager(false);
    }
  };

  // Invigilator Reassignment handler
  const handleInvigilatorReassignment = async () => {
    if (!newInvigilatorForReassign || reassignJobs.length === 0) {
      toast.error("Please select the new invigilator and jobs to reassign");
      return;
    }
    try {
      setIsReassigningInvigilator(true);
      const response = await api.put("/org/update-invigilator-assignment", {
        jobIds: reassignJobs,
        newInvigilatorId: newInvigilatorForReassign,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setReassignJobs([]);
        setCurrentInvigilatorForReassign("");
        setNewInvigilatorForReassign("");
        await fetchInitialData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reassign jobs.");
    } finally {
      setIsReassigningInvigilator(false);
    }
  };

  // All your other existing handlers...
  const handleCandidateSelect = (candidateId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCandidates((prev) => [...(prev || []), candidateId]);
    } else {
      setSelectedCandidates((prev) =>
        (prev || []).filter((id) => id !== candidateId)
      );
    }
  };

  const handleJobSelect = (jobId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedJobs((prev) => [...(prev || []), jobId]);
    } else {
      setSelectedJobs((prev) => (prev || []).filter((id) => id !== jobId));
    }
  };

  const handleSelectAllCandidates = () => {
    const filteredCandidates = (unassignedCandidates || []).filter(
      (c) =>
        c.first_name
          ?.toLowerCase()
          .includes(candidateSearchTerm.toLowerCase()) ||
        c.last_name
          ?.toLowerCase()
          .includes(candidateSearchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(candidateSearchTerm.toLowerCase())
    );

    if (
      (selectedCandidates || []).length === filteredCandidates.length &&
      filteredCandidates.length > 0
    ) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map((c) => c._id));
    }
  };

  const handleSelectAllJobs = () => {
    if ((selectedJobs || []).length === jobs.length && jobs.length > 0) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map((j) => j._id));
    }
  };

  const clearManagerAssignment = () => {
    setSelectedCandidates([]);
    setSelectedManager("");
    setCandidateSearchTerm("");
    setError("");
    setSuccess("");
  };

  const clearInvigilatorAssignment = () => {
    setSelectedInvigilator("");
    setSelectedJobs([]);
    setJobCandidates([]);
    setError("");
    setSuccess("");
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchInitialData();
    setLoading(false);
    toast.success("Data refreshed successfully");
  };

  // Utility Functions
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "registered":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "hr":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "assessment":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "tech":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "manager":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "feedback":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "withdrawn":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "hired":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const filteredCandidates = (unassignedCandidates || []).filter(
    (candidate) =>
      candidate.first_name
        ?.toLowerCase()
        .includes(candidateSearchTerm.toLowerCase()) ||
      candidate.last_name
        ?.toLowerCase()
        .includes(candidateSearchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(candidateSearchTerm.toLowerCase())
  );

  const stats = {
    unassigned: (unassignedCandidates || []).length,
    managers: (managers || []).length,
    invigilators: (invigilators || []).length,
    jobs: (jobs || []).length,
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <span className="ml-4 text-muted-foreground">
          Loading assignment dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Toaster position="bottom-right" containerStyle={{ zIndex: 9999 }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Candidate Assignment Dashboard
          </h1>
          <p className="text-muted-foreground">
            Assign unassigned candidates to managers or assign invigilators to
            jobs for automatic candidate assignment
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Unassigned Candidates
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.unassigned}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Available Managers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.managers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ClipboardList className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Available Invigilators
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.invigilators}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {jobs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Assignment Interface */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">Assignment Operations</h2>
            <div className="flex items-center space-x-2">
              {/* Reassignments Toggle Button */}
              <Button
                onClick={() => setShowReassignments(!showReassignments)}
                variant={showReassignments ? "default" : "outline"}
                size="sm"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {showReassignments ? "Hide Reassignments" : "Reassignments"}
              </Button>
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Updated TabsList to include reassignment tabs when showReassignments is true */}
              <TabsList
                className={`grid w-full ${
                  showReassignments ? "grid-cols-4" : "grid-cols-2"
                }`}
              >
                <TabsTrigger value="manager-assignment">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Manager
                </TabsTrigger>
                <TabsTrigger value="invigilator-assignment">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Assign to Invigilator
                </TabsTrigger>
                {showReassignments && (
                  <>
                    <TabsTrigger value="manager-reassignment">
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Manager Reassign
                    </TabsTrigger>
                    <TabsTrigger value="invigilator-reassignment">
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Invigilator Reassign
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* Manager Assignment Tab - keeping your existing content */}
              <TabsContent value="manager-assignment" className="mt-6">
                <div className="space-y-6">
                  {/* Manager Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="manager-select">Select Manager</Label>
                      <Select
                        value={selectedManager}
                        onValueChange={setSelectedManager}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {(managers || []).map((manager) => (
                            <SelectItem key={manager._id} value={manager._id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{manager.name || manager.email}</span>
                                <Badge variant="outline" className="ml-2">
                                  {(manager.candidates || []).length} assigned
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {(selectedCandidates || []).length} selected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearManagerAssignment}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Select Unassigned Candidates</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={
                            (selectedCandidates || []).length ===
                              filteredCandidates.length &&
                            filteredCandidates.length > 0
                          }
                          onCheckedChange={handleSelectAllCandidates}
                        />
                        <Label className="text-sm">
                          Select All ({filteredCandidates.length})
                        </Label>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search candidates by name or email..."
                        value={candidateSearchTerm}
                        onChange={(e) => setCandidateSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Candidates List */}
                    <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-4">
                      {filteredCandidates.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {candidateSearchTerm
                              ? "No candidates match your search."
                              : "No unassigned candidates available."}
                          </p>
                        </div>
                      ) : (
                        filteredCandidates.map((candidate) => (
                          <div
                            key={candidate._id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Checkbox
                              checked={(selectedCandidates || []).includes(
                                candidate._id
                              )}
                              onCheckedChange={(checked) =>
                                handleCandidateSelect(candidate._id, !!checked)
                              }
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">
                                  {candidate.first_name} {candidate.last_name}
                                </p>
                                {!candidate.assigned_manager && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-yellow-50 text-yellow-700"
                                  >
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {candidate.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                  className={`${getStageColor(
                                    candidate.current_stage
                                  )} text-xs`}
                                >
                                  {candidate.current_stage}
                                </Badge>
                                <Badge
                                  className={`${getStatusColor(
                                    candidate.status
                                  )} text-xs`}
                                >
                                  {candidate.status}
                                </Badge>
                                {candidate.applied_job && (
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.applied_job.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Assignment Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleManagerAssignment}
                      disabled={
                        isAssigningToManager ||
                        !selectedManager ||
                        (selectedCandidates || []).length === 0
                      }
                      className="min-w-[220px]"
                    >
                      {isAssigningToManager ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Assign {(selectedCandidates || []).length} Candidates
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Invigilator Assignment Tab - keeping your existing content */}
              <TabsContent value="invigilator-assignment" className="mt-6">
                <div className="space-y-6">
                  {/* Invigilator Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="invigilator-select">
                        Select Invigilator
                      </Label>
                      <Select
                        value={selectedInvigilator}
                        onValueChange={setSelectedInvigilator}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an invigilator" />
                        </SelectTrigger>
                        <SelectContent>
                          {(invigilators || []).map((invigilator) => (
                            <SelectItem
                              key={invigilator._id}
                              value={invigilator._id}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {invigilator.name || invigilator.email}
                                </span>
                                <div className="flex space-x-1">
                                  <Badge variant="outline" className="text-xs">
                                    {(invigilator.candidates || []).length}{" "}
                                    candidates
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {(invigilator.jobs || []).length} jobs
                                  </Badge>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {(selectedJobs || []).length} jobs selected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearInvigilatorAssignment}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Job Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>
                        Select Jobs (Candidates will be auto-assigned)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={
                            (selectedJobs || []).length === jobs.length &&
                            jobs.length > 0
                          }
                          onCheckedChange={handleSelectAllJobs}
                        />
                        <Label className="text-sm">
                          Select All Jobs ({jobs.length})
                        </Label>
                      </div>
                    </div>

                    {/* Jobs List */}
                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
                      {jobs.length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No jobs available.
                          </p>
                        </div>
                      ) : (
                        jobs.map((job) => (
                          <div
                            key={job._id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Checkbox
                              checked={(selectedJobs || []).includes(job._id)}
                              onCheckedChange={(checked) =>
                                handleJobSelect(job._id, !!checked)
                              }
                            />
                            <div className="flex-1">
                              <p className="font-medium">{job.name}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Job Candidates Preview */}
                  {(selectedJobs || []).length > 0 &&
                    (jobCandidates || []).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>
                            Candidates from Selected Jobs (
                            {(jobCandidates || []).length})
                          </Label>
                          <Badge variant="secondary">
                            {(jobCandidates || []).length} candidates will be
                            assigned
                          </Badge>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                          {(jobCandidates || []).map((candidate) => (
                            <div
                              key={candidate._id}
                              className="flex items-center justify-between p-2 border rounded-lg bg-white dark:bg-gray-800"
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {candidate.first_name} {candidate.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {candidate.email}
                                </p>
                                {candidate.applied_job && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1"
                                  >
                                    {candidate.applied_job.name}
                                  </Badge>
                                )}
                              </div>
                              <Badge
                                className={getStageColor(
                                  candidate.current_stage
                                )}
                              >
                                {candidate.current_stage}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {(selectedJobs || []).length > 0 &&
                    (jobCandidates || []).length === 0 && (
                      <div className="text-center py-8 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <p className="text-muted-foreground">
                          No candidates found for the selected job(s).
                        </p>
                      </div>
                    )}

                  {/* Assignment Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleInvigilatorAssignment}
                      disabled={
                        isAssigningToInvigilator ||
                        !selectedInvigilator ||
                        (selectedJobs || []).length === 0
                      }
                      className="min-w-[220px]"
                    >
                      {isAssigningToInvigilator ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Assign to {(selectedJobs || []).length} Job(s)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Manager Reassignment Tab */}
              {showReassignments && (
                <TabsContent value="manager-reassignment" className="mt-6">
                  <div className="space-y-6">
                    <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Label className="font-semibold text-lg mb-4 block">
                        Reassign Candidates to Another Manager
                      </Label>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                          <Label>Select Current Manager</Label>
                          <Select
                            value={currentManagerForReassign}
                            onValueChange={setCurrentManagerForReassign}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose current manager" />
                            </SelectTrigger>
                            <SelectContent>
                              {(managers || []).map((manager) => (
                                <SelectItem
                                  key={manager._id}
                                  value={manager._id}
                                >
                                  {manager.name || manager.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Select Candidates to Reassign</Label>
                          <div className="max-h-44 overflow-y-auto border rounded-lg p-2">
                            {(
                              managers.find(
                                (m) => m._id === currentManagerForReassign
                              )?.candidates || []
                            ).length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No candidates assigned to this manager.
                              </p>
                            ) : (
                              managers
                                .find(
                                  (m) => m._id === currentManagerForReassign
                                )
                                ?.candidates?.map((candidate) => {
                                  if (
                                    !candidate ||
                                    typeof candidate === "string"
                                  )
                                    return null;
                                  const {
                                    _id,
                                    first_name,
                                    last_name,
                                    applied_job,
                                  } = candidate;
                                  const jobLabel =
                                    applied_job && applied_job.name
                                      ? ` | ${applied_job.name}`
                                      : "";
                                  const label = `${first_name || ""} ${
                                    last_name || ""
                                  }${jobLabel}`;
                                  return (
                                    <div
                                      key={_id}
                                      className="flex items-center space-x-2 py-1"
                                    >
                                      <Checkbox
                                        checked={reassignCandidates.includes(
                                          _id
                                        )}
                                        onCheckedChange={(checked) => {
                                          if (checked)
                                            setReassignCandidates((prev) => [
                                              ...prev,
                                              _id,
                                            ]);
                                          else
                                            setReassignCandidates((prev) =>
                                              prev.filter((id) => id !== _id)
                                            );
                                        }}
                                      />
                                      <span className="text-sm">{label}</span>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Select New Manager</Label>
                          <Select
                            value={newManagerForReassign}
                            onValueChange={setNewManagerForReassign}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose new manager" />
                            </SelectTrigger>
                            <SelectContent>
                              {(managers || []).map((manager) => (
                                <SelectItem
                                  key={manager._id}
                                  value={manager._id}
                                  disabled={
                                    manager._id === currentManagerForReassign
                                  }
                                >
                                  {manager.name || manager.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleManagerReassignment}
                          disabled={
                            isReassigningManager ||
                            !newManagerForReassign ||
                            reassignCandidates.length === 0
                          }
                        >
                          {isReassigningManager ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Reassigning...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Reassign {reassignCandidates.length} Candidate(s)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Invigilator Reassignment Tab */}
              {showReassignments && (
                <TabsContent value="invigilator-reassignment" className="mt-6">
                  <div className="space-y-6">
                    <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Label className="font-semibold text-lg mb-4 block">
                        Reassign Job(s) to Another Invigilator
                      </Label>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                          <Label>Select Current Invigilator</Label>
                          <Select
                            value={currentInvigilatorForReassign}
                            onValueChange={setCurrentInvigilatorForReassign}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose current invigilator" />
                            </SelectTrigger>
                            <SelectContent>
                              {(invigilators || []).map((invigilator) => (
                                <SelectItem
                                  key={invigilator._id}
                                  value={invigilator._id}
                                >
                                  {invigilator.name || invigilator.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Select Job(s) to Reassign</Label>
                          <div className="max-h-44 overflow-y-auto border rounded-lg p-2">
                            {(
                              invigilators.find(
                                (i) => i._id === currentInvigilatorForReassign
                              )?.jobs || []
                            ).length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No jobs assigned to this invigilator.
                              </p>
                            ) : (
                              invigilators
                                .find(
                                  (i) => i._id === currentInvigilatorForReassign
                                )
                                ?.jobs?.map((jobItem) => {
                                  const jobId =
                                    typeof jobItem === "string"
                                      ? jobItem
                                      : jobItem._id;
                                  const jobData = jobs.find(
                                    (j) => j._id === jobId
                                  );
                                  const label = jobData ? jobData.name : jobId;
                                  return (
                                    <div
                                      key={jobId}
                                      className="flex items-center space-x-2 py-1"
                                    >
                                      <Checkbox
                                        checked={reassignJobs.includes(jobId)}
                                        onCheckedChange={(checked) => {
                                          if (checked)
                                            setReassignJobs((prev) => [
                                              ...prev,
                                              jobId,
                                            ]);
                                          else
                                            setReassignJobs((prev) =>
                                              prev.filter((id) => id !== jobId)
                                            );
                                        }}
                                      />
                                      <span className="text-sm">{label}</span>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>
                        <div>
                          <Label>Select New Invigilator</Label>
                          <Select
                            value={newInvigilatorForReassign}
                            onValueChange={setNewInvigilatorForReassign}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose new invigilator" />
                            </SelectTrigger>
                            <SelectContent>
                              {(invigilators || []).map((invigilator) => (
                                <SelectItem
                                  key={invigilator._id}
                                  value={invigilator._id}
                                  disabled={
                                    invigilator._id ===
                                    currentInvigilatorForReassign
                                  }
                                >
                                  {invigilator.name || invigilator.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleInvigilatorReassignment}
                          disabled={
                            isReassigningInvigilator ||
                            !newInvigilatorForReassign ||
                            reassignJobs.length === 0
                          }
                        >
                          {isReassigningInvigilator ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Reassigning...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Reassign {reassignJobs.length} Job(s)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedAssignmentDashboard;
