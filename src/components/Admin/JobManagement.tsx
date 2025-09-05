// components/JobManagement.tsx
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Briefcase,
  Save,
  Eye,
  Calendar,
  Filter,
  X,
  PlusCircle,
} from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

export interface IJob {
  _id: string;
  name: string;
  description: string | object;
  long_description?: string | object;
  createdAt: string;
  updatedAt: string;
}

interface KeyValuePair {
  key: string;
  value: string;
}

const JobManagement = () => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [longDescriptionPairs, setLongDescriptionPairs] = useState<
    KeyValuePair[]
  >([{ key: "", value: "" }]);

  const [editingJob, setEditingJob] = useState<IJob | null>(null);
  const [viewingJob, setViewingJob] = useState<IJob | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const response = await api.get(`/org/jobs?${params.toString()}`);

      if (response.data.success) {
        setJobs(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch jobs");
      }
    } catch (error: any) {
      console.error("Failed to fetch jobs:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to load jobs";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Key-Value pair handlers
  const addKeyValuePair = () => {
    setLongDescriptionPairs((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeKeyValuePair = (index: number) => {
    setLongDescriptionPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateKeyValuePair = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    setLongDescriptionPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const convertPairsToObject = (pairs: KeyValuePair[]) => {
    const result: { [key: string]: string } = {};
    pairs.forEach((pair) => {
      if (pair.key.trim() && pair.value.trim()) {
        result[pair.key.trim()] = pair.value.trim();
      }
    });
    return Object.keys(result).length > 0 ? result : null;
  };

  const convertObjectToPairs = (obj: any): KeyValuePair[] => {
    if (!obj || typeof obj !== "object") {
      return [{ key: "", value: "" }];
    }

    const pairs = Object.entries(obj).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    return pairs.length > 0 ? pairs : [{ key: "", value: "" }];
  };

  const handleCreateJob = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    try {
      setIsCreating(true);
      const longDescObj = convertPairsToObject(longDescriptionPairs);

      const jobData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (longDescObj) {
        jobData.long_description = longDescObj;
      }

      const response = await api.post("/org/jobs", jobData);

      if (response.data.success) {
        toast.success(response.data.message || "Job created successfully");
        setShowCreateDialog(false);
        resetForm();
        await fetchJobs();
      } else {
        toast.error(response.data.message || "Failed to create job");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to create job";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const getOptimalLayout = (longDescription: any) => {
    if (!longDescription || typeof longDescription !== "object") return "none";

    const entries = Object.entries(longDescription);
    const totalLength = entries.reduce(
      (acc, [key, value]) => acc + key.length + String(value).length,
      0
    );

    const hasLongValues = entries.some(
      ([_, value]) => String(value).length > 30
    );
    const hasMany = entries.length > 4;

    // Use rows for long content or many fields, grid for compact content
    if (hasLongValues || hasMany || totalLength > 150) {
      return "rows";
    }
    return "grid";
  };

  const handleEditJob = async () => {
    if (!editingJob || !formData.name.trim() || !formData.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    try {
      setIsEditing(true);
      const longDescObj = convertPairsToObject(longDescriptionPairs);

      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (longDescObj) {
        updateData.long_description = longDescObj;
      }

      const response = await api.put(`/org/jobs/${editingJob._id}`, updateData);

      if (response.data.success) {
        toast.success(response.data.message || "Job updated successfully");
        setShowEditDialog(false);
        setEditingJob(null);
        resetForm();
        await fetchJobs();
      } else {
        toast.error(response.data.message || "Failed to update job");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to update job";
      toast.error(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/org/jobs/${jobId}`);

      if (response.data.success) {
        toast.success(response.data.message || "Job deleted successfully");
        setShowDeleteDialog(false);
        setEditingJob(null);
        await fetchJobs();
      } else {
        toast.error(response.data.message || "Failed to delete job");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete job";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;

    try {
      setIsDeleting(true);
      const response = await api.delete("/org/jobs/bulk/delete", {
        data: { ids: selectedJobs },
      });

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `${response.data.deletedCount} jobs deleted successfully`
        );
        setShowBulkDeleteDialog(false);
        setSelectedJobs([]);
        await fetchJobs();
      } else {
        toast.error(response.data.message || "Failed to delete jobs");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete jobs";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (job: IJob) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      description:
        typeof job.description === "string"
          ? job.description
          : JSON.stringify(job.description),
    });

    // Convert long_description to key-value pairs
    if (job.long_description) {
      const pairs = convertObjectToPairs(job.long_description);
      setLongDescriptionPairs(pairs);
    } else {
      setLongDescriptionPairs([{ key: "", value: "" }]);
    }

    setShowEditDialog(true);
  };

  const openViewDialog = (job: IJob) => {
    setViewingJob(job);
    setShowViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setLongDescriptionPairs([{ key: "", value: "" }]);
  };

  const handleJobSelect = (jobId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedJobs((prev) => [...prev, jobId]);
    } else {
      setSelectedJobs((prev) => prev.filter((id) => id !== jobId));
    }
  };

  const handleSelectAll = () => {
    if (
      selectedJobs.length === filteredJobs.length &&
      filteredJobs.length > 0
    ) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map((job) => job._id));
    }
  };

  const refreshData = async () => {
    await fetchJobs();
    toast.success("Data refreshed successfully");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getContentPreview = (content: string | object, maxLength = 100) => {
    const text =
      typeof content === "string" ? content : JSON.stringify(content);
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof job.description === "string"
        ? job.description
        : JSON.stringify(job.description)
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <span className="ml-4 text-muted-foreground">Loading jobs...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <Toaster position="bottom-right" containerStyle={{ zIndex: 9999 }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Job Management
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create, view, edit, and delete job postings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Jobs
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {jobs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Selected
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedJobs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Filtered
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {filteredJobs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold">Job Operations</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={openCreateDialog}
                size="sm"
                className="h-8 sm:h-9"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Job</span>
                <span className="sm:hidden">Add</span>
              </Button>
              {selectedJobs.length > 0 && (
                <Button
                  onClick={() => setShowBulkDeleteDialog(true)}
                  variant="destructive"
                  size="sm"
                  className="h-8 sm:h-9"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">
                    Delete ({selectedJobs.length})
                  </span>
                  <span className="sm:hidden">Del ({selectedJobs.length})</span>
                </Button>
              )}
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-8 sm:h-9"
              >
                <RefreshCw
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 sm:w-40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="updatedAt">Updated</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-20 sm:w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Select All Checkbox */}
            {filteredJobs.length > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  checked={
                    selectedJobs.length === filteredJobs.length &&
                    filteredJobs.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">
                  Select All ({filteredJobs.length})
                </Label>
              </div>
            )}
            {/* Jobs List */}
            <div className="space-y-3 sm:space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {searchTerm
                      ? "No jobs match your search."
                      : "No jobs available. Create your first job!"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={openCreateDialog}
                      className="mt-4"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </Button>
                  )}
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const layout = getOptimalLayout(job.long_description);

                  return (
                    <Card
                      key={job._id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedJobs.includes(job._id)}
                            onCheckedChange={(checked) =>
                              handleJobSelect(job._id, !!checked)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate pr-2">
                                {job.name}
                              </h3>
                              <div className="flex items-center space-x-1 mt-2 sm:mt-0">
                                <Button
                                  onClick={() => openViewDialog(job)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  onClick={() => openEditDialog(job)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingJob(job);
                                    setShowDeleteDialog(true);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-muted-foreground text-xs sm:text-sm mb-3 break-words">
                              {getContentPreview(job.description, 120)}
                            </p>

                            {/* Flexible Key-Value Display */}
                            {job.long_description &&
                              typeof job.long_description === "object" && (
                                <div className="mb-3">
                                  {layout === "grid" ? (
                                    // Compact Grid Layout for short content
                                    <>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {Object.entries(job.long_description)
                                          .slice(0, 6)
                                          .map(([key, value]) => (
                                            <div
                                              key={key}
                                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-xs"
                                            >
                                              <span className="font-medium text-gray-600 dark:text-gray-300 capitalize mr-2">
                                                {key
                                                  .replace(/([A-Z])/g, " $1")
                                                  .trim()}
                                                :
                                              </span>
                                              <span className="text-gray-900 dark:text-gray-100 truncate flex-1 text-right">
                                                {String(value)}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                      {Object.keys(job.long_description)
                                        .length > 6 && (
                                        <div className="mt-2 text-center">
                                          <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                            +
                                            {Object.keys(job.long_description)
                                              .length - 6}{" "}
                                            more fields
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    // Row Layout for longer content
                                    <div className="space-y-2">
                                      {Object.entries(job.long_description)
                                        .slice(0, 4)
                                        .map(([key, value]) => (
                                          <div
                                            key={key}
                                            className="flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded-md border"
                                          >
                                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 capitalize mb-1">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                            </span>
                                            <span className="text-sm text-gray-900 dark:text-gray-100 break-words">
                                              {String(value).length > 80
                                                ? `${String(value).substring(
                                                    0,
                                                    80
                                                  )}...`
                                                : String(value)}
                                            </span>
                                          </div>
                                        ))}
                                      {Object.keys(job.long_description)
                                        .length > 4 && (
                                        <div className="text-center">
                                          <button
                                            onClick={() => openViewDialog(job)}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                                          >
                                            View{" "}
                                            {Object.keys(job.long_description)
                                              .length - 4}{" "}
                                            more details
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground space-y-1 sm:space-y-0">
                              <span>Created: {formatDate(job.createdAt)}</span>
                              <span>Updated: {formatDate(job.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Job Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Add a new job posting to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job-name">Job Name *</Label>
              <Input
                id="job-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter job title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Description *</Label>
              <Textarea
                id="job-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter job description"
                rows={4}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Additional Details (Key-Value Pairs)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyValuePair}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {longDescriptionPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Field name"
                      value={pair.key}
                      onChange={(e) =>
                        updateKeyValuePair(index, "key", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={pair.value}
                      onChange={(e) =>
                        updateKeyValuePair(index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    {longDescriptionPairs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyValuePair(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateJob} disabled={isCreating}>
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update the job posting details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-job-name">Job Name *</Label>
              <Input
                id="edit-job-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter job title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-description">Description *</Label>
              <Textarea
                id="edit-job-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter job description"
                rows={4}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Additional Details (Key-Value Pairs)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyValuePair}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {longDescriptionPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Field name"
                      value={pair.key}
                      onChange={(e) =>
                        updateKeyValuePair(index, "key", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={pair.value}
                      onChange={(e) =>
                        updateKeyValuePair(index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    {longDescriptionPairs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyValuePair(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingJob(null);
                resetForm();
              }}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleEditJob} disabled={isEditing}>
              {isEditing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Job Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl">{viewingJob?.name}</DialogTitle>
            <DialogDescription>Job details and information</DialogDescription>
          </DialogHeader>
          {viewingJob && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="font-semibold">Description</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {typeof viewingJob.description === "string"
                      ? viewingJob.description
                      : JSON.stringify(viewingJob.description, null, 2)}
                  </p>
                </div>
              </div>

              {viewingJob.long_description && (
                <div className="space-y-2">
                  <Label className="font-semibold">Additional Details</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {typeof viewingJob.long_description === "object" ? (
                      <div className="space-y-2">
                        {Object.entries(viewingJob.long_description).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-col sm:flex-row gap-1 sm:gap-3"
                            >
                              <span className="font-medium text-sm min-w-0 sm:min-w-[120px]">
                                {key}:
                              </span>
                              <span className="text-sm break-words flex-1">
                                {String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {String(viewingJob.long_description)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="font-semibold text-xs">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(viewingJob.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold text-xs">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(viewingJob.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {viewingJob && (
              <Button
                onClick={() => {
                  setShowViewDialog(false);
                  openEditDialog(viewingJob);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingJob?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setEditingJob(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingJob && handleDeleteJob(editingJob._id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Delete Multiple Jobs</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedJobs.length} selected
              jobs? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedJobs.length} Jobs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobManagement;
