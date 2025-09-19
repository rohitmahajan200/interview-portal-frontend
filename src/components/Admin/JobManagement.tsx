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
  X,
  PlusCircle,
  Award,
  Star,
} from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

export interface IJob {
  _id: string;
  name: string;
  description: string | object;
  long_description?: string | object;
  gradingParameters?: string[]; // New field for grading parameters
  createdAt: string;
  updatedAt: string;
}

interface KeyValuePair {
  key: string;
  value: string;
}

interface BulletPoint {
  id: string;
  text: string;
}

interface BulletSection {
  id: string;
  name: string;
  bullets: BulletPoint[];
}

interface GradingParameter {
  id: string;
  name: string;
}

interface MissingJob {
  _id: string;
  title: string;
  time: string;
  country: string;
  location: string;
  expInYears: string;
  salary: string;
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
  const [missingJobs, setMissingJobs] = useState<MissingJob[]>([]);
  const [showMissingJobsSection, setShowMissingJobsSection] = useState(false);
  const [loadingMissingJobs, setLoadingMissingJobs] = useState(false);
  // Add this new state near the other state declarations
  const [currentJobPortalId, setCurrentJobPortalId] = useState<string | null>(null);


  // Form states - Support BOTH key-value pairs AND bullet sections simultaneously
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [longDescriptionPairs, setLongDescriptionPairs] = useState<
    KeyValuePair[]
  >([{ key: "", value: "" }]);
  const [bulletSections, setBulletSections] = useState<BulletSection[]>([
    { id: "1", name: "", bullets: [{ id: "1", text: "" }] },
  ]);

  // New: Grading Parameters State
  const [gradingParameters, setGradingParameters] = useState<GradingParameter[]>([
    { id: "overall", name: "Overall" }, // Default parameter
    { id: "1", name: "" }
  ]);

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

  // Bullet sections handlers
  const addBulletSection = () => {
    const newId = Date.now().toString();
    setBulletSections((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        bullets: [{ id: "1", text: "" }],
      },
    ]);
  };

  const removeBulletSection = (sectionId: string) => {
    setBulletSections((prev) =>
      prev.filter((section) => section.id !== sectionId)
    );
  };

  const updateBulletSectionName = (sectionId: string, name: string) => {
    setBulletSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, name } : section
      )
    );
  };

  const addBulletToSection = (sectionId: string) => {
    const newBulletId = Date.now().toString();
    setBulletSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              bullets: [...section.bullets, { id: newBulletId, text: "" }],
            }
          : section
      )
    );
  };

  const removeBulletFromSection = (sectionId: string, bulletId: string) => {
    setBulletSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              bullets: section.bullets.filter(
                (bullet) => bullet.id !== bulletId
              ),
            }
          : section
      )
    );
  };

  const updateBulletInSection = (
    sectionId: string,
    bulletId: string,
    text: string
  ) => {
    setBulletSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              bullets: section.bullets.map((bullet) =>
                bullet.id === bulletId ? { ...bullet, text } : bullet
              ),
            }
          : section
      )
    );
  };

  // New: Grading Parameters Handlers
  const addGradingParameter = () => {
    const newId = Date.now().toString();
    setGradingParameters((prev) => [...prev, { id: newId, name: "" }]);
  };

  const removeGradingParameter = (id: string) => {
    // Prevent removing the default "Overall" parameter
    if (id === "overall") {
      return;
    }
    setGradingParameters((prev) => prev.filter((param) => param.id !== id));
  };

  const updateGradingParameter = (id: string, name: string) => {
    setGradingParameters((prev) =>
      prev.map((param) => (param.id === id ? { ...param, name } : param))
    );
  };

  // Combined conversion function - handles BOTH key-value pairs AND bullet sections
  const convertToMixedObject = (
    pairs: KeyValuePair[],
    sections: BulletSection[]
  ) => {
    const result: { [key: string]: string | string[] } = {};

    // Add key-value pairs
    pairs.forEach((pair) => {
      if (pair.key.trim() && pair.value.trim()) {
        result[pair.key.trim()] = pair.value.trim();
      }
    });

    // Add bullet sections
    sections.forEach((section) => {
      if (section.name.trim()) {
        const validBullets = section.bullets.filter((bullet) =>
          bullet.text.trim()
        );
        if (validBullets.length > 0) {
          result[section.name.trim()] = validBullets.map((bullet) =>
            bullet.text.trim()
          );
        }
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  };

  // Convert mixed object back to separate arrays
  const convertMixedObjectToArrays = (
    obj: any
  ): { pairs: KeyValuePair[]; sections: BulletSection[] } => {
    const pairs: KeyValuePair[] = [];
    const sections: BulletSection[] = [];
    let sectionIdCounter = 1;

    if (!obj || typeof obj !== "object") {
      return {
        pairs: [{ key: "", value: "" }],
        sections: [{ id: "1", name: "", bullets: [{ id: "1", text: "" }] }],
      };
    }

    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // It's a bullet section
        const sectionBullets = value.map((text, index) => ({
          id: `${sectionIdCounter}-${index + 1}`,
          text: String(text),
        }));

        sections.push({
          id: sectionIdCounter.toString(),
          name: key,
          bullets:
            sectionBullets.length > 0
              ? sectionBullets
              : [{ id: `${sectionIdCounter}-1`, text: "" }],
        });
        sectionIdCounter++;
      } else {
        // It's a key-value pair
        pairs.push({
          key,
          value: String(value),
        });
      }
    });

    return {
      pairs: pairs.length > 0 ? pairs : [{ key: "", value: "" }],
      sections:
        sections.length > 0
          ? sections
          : [{ id: "1", name: "", bullets: [{ id: "1", text: "" }] }],
    };
  };

  const handleCreateJob = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    try {
      setIsCreating(true);

      const jobData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      // Combine both key-value pairs and bullet sections
      const mixedObj = convertToMixedObject(
        longDescriptionPairs,
        bulletSections
      );
      if (mixedObj) {
        jobData.long_description = mixedObj;
      }

      // Add grading parameters
      const validGradingParams = gradingParameters
        .filter((param) => param.name.trim() !== "")
        .map((param) => param.name.trim());

      if (validGradingParams.length > 0) {
        jobData.gradingParameters = validGradingParams;
      }

      // Add jobPortalId if available (from Change Networks import)
      if (currentJobPortalId) {
        jobData.jobPortalId = currentJobPortalId;
      }

      const response = await api.post("/org/jobs", jobData);

      if (response.data.success) {
        toast.success(response.data.message || "Job created successfully");
        setShowCreateDialog(false);
        resetForm();
        // Clear the jobPortalId after successful creation
        setCurrentJobPortalId(null);
        // Remove the job from missing jobs list if it was imported
        if (currentJobPortalId) {
          setMissingJobs(prev => prev.filter(job => job._id !== currentJobPortalId));
        }
        await fetchJobs();
      } else {
        toast.error(response.data.message || "Failed to create job");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to create job";
      
      // Handle specific case where job already exists
      if (error?.response?.status === 409) {
        toast.error("This job has already been imported from CHANGE Networks");
        // Remove from missing jobs list since it already exists
        if (currentJobPortalId) {
          setMissingJobs(prev => prev.filter(job => job._id !== currentJobPortalId));
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };


  const handleEditJob = async () => {
    if (!editingJob || !formData.name.trim() || !formData.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    try {
      setIsEditing(true);

      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      // Combine both key-value pairs and bullet sections
      const mixedObj = convertToMixedObject(
        longDescriptionPairs,
        bulletSections
      );
      if (mixedObj) {
        updateData.long_description = mixedObj;
      }

      // Add grading parameters
      const validGradingParams = gradingParameters
        .filter((param) => param.name.trim() !== "")
        .map((param) => param.name.trim());

      if (validGradingParams.length > 0) {
        updateData.gradingParameters = validGradingParams;
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

  const getOptimalLayout = (longDescription: any) => {
    if (!longDescription || typeof longDescription !== "object") return "none";
    // Check if it has any array values (bullet sections)
    const hasArrayValues = Object.values(longDescription).some((value) =>
      Array.isArray(value)
    );
    // Mixed content or bullets only
    if (hasArrayValues) {
      return "mixed";
    }

    // Key-value pairs only
    const entries = Object.entries(longDescription).filter(
      ([_, value]) => !Array.isArray(value)
    );
    const totalLength = entries.reduce(
      (acc, [key, value]) => acc + key.length + String(value).length,
      0
    );

    const hasLongValues = entries.some(
      ([_, value]) => String(value).length > 30
    );
    const hasMany = entries.length > 4;

    if (hasLongValues || hasMany || totalLength > 150) {
      return "rows";
    }
    return "grid";
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

  // Update the openEditDialog function
  const openEditDialog = (job: IJob) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      description:
        typeof job.description === "string"
          ? job.description
          : JSON.stringify(job.description),
    });

    // Convert mixed data to separate arrays
    if (job.long_description && typeof job.long_description === "object") {
      const { pairs, sections } = convertMixedObjectToArrays(
        job.long_description
      );
      setLongDescriptionPairs(pairs);
      setBulletSections(sections);
    } else {
      setLongDescriptionPairs([{ key: "", value: "" }]);
      setBulletSections([
        { id: "1", name: "", bullets: [{ id: "1", text: "" }] },
      ]);
    }

    // Convert grading parameters - always ensure "Overall" is included
    if (job.gradingParameters && job.gradingParameters.length > 0) {
      const gradingParams = job.gradingParameters.map((param, index) => ({
        id: param === "Overall" ? "overall" : (index + 1).toString(),
        name: param,
      }));
      
      // Ensure "Overall" is always present
      const hasOverall = gradingParams.some(param => param.name === "Overall");
      if (!hasOverall) {
        gradingParams.unshift({ id: "overall", name: "Overall" });
      }
      
      // Add empty parameter if needed
      if (gradingParams.length === 1 || !gradingParams.some(param => param.name === "")) {
        gradingParams.push({ id: Date.now().toString(), name: "" });
      }
      
      setGradingParameters(gradingParams);
    } else {
      setGradingParameters([
        { id: "overall", name: "Overall" },
        { id: "1", name: "" }
      ]);
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
    setBulletSections([
      { id: "1", name: "", bullets: [{ id: "1", text: "" }] },
    ]);
    setGradingParameters([
      { id: "overall", name: "Overall" },
      { id: "1", name: "" }
    ]);
    // Clear the jobPortalId when resetting form
    setCurrentJobPortalId(null);
  };


  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
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

  // Fetch missing jobs from your backend
  const fetchMissingJobs = async () => {
    try {
      setLoadingMissingJobs(true);
      const response = await api.get('/org/admin/check-missing-jobs');
      
      if (response.data.success) {
        setMissingJobs(response.data.missingJobs || []);
        return response.data.missingJobs || [];
      } else {
        toast.error('Failed to fetch missing jobs');
        return [];
      }
    } catch (error: any) {
      console.error('Failed to fetch missing jobs:', error);
      toast.error('Failed to fetch missing jobs');
      return [];
    } finally {
      setLoadingMissingJobs(false);
    }
  };

  // Fetch job details from your backend
  const fetchJobDetails = async (jobId: string) => {
    try {
      const response = await api.get(`/org/admin/jobdetails?id=${jobId}`);
      
      if (response.data.success) {
        return response.data.job;
      } else {
        toast.error('Failed to fetch job details');
        return null;
      }
    } catch (error: any) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to fetch job details');
      return null;
    }
  };

  // Helper function to parse HTML and extract text content
  const parseHtmlToText = (htmlString: string): string => {
    if (!htmlString) return '';
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Helper function to parse HTML and extract bullet points
  const parseHtmlToBullets = (htmlString: string): string[] => {
    if (!htmlString) return [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const listItems = tempDiv.querySelectorAll('li');
    return Array.from(listItems).map(li => li.textContent?.trim() || '').filter(Boolean);
  };

  // Convert Change Networks job to your internal format
  const convertChangeNetworksJob = (cnJob: any) => {
    // Parse description and requirements
    const descriptionText = parseHtmlToText(cnJob.description || '');
    const descriptionBullets = parseHtmlToBullets(cnJob.description || '');
    const requirementsBullets = parseHtmlToBullets(cnJob.requirements || '');

    // Create key-value pairs for job details
    const jobDetails: { [key: string]: string | string[] } = {};
    
    // Add basic details as key-value pairs
    if (cnJob.salary) jobDetails['Salary'] = cnJob.salary;
    if (cnJob.location) jobDetails['Location'] = cnJob.location;
    if (cnJob.time) jobDetails['Work Hours'] = cnJob.time;
    if (cnJob.expInYears) jobDetails['Experience Required'] = cnJob.expInYears;
    if (cnJob.type) jobDetails['Employment Type'] = cnJob.type;
    if (cnJob.schedule) jobDetails['Schedule'] = cnJob.schedule;
    if (cnJob.industry) jobDetails['Industry'] = cnJob.industry;
    if (cnJob.category) jobDetails['Category'] = cnJob.category;
    if (cnJob.vacancies) jobDetails['Vacancies'] = cnJob.vacancies.toString();

    // Add bullet point sections
    if (descriptionBullets.length > 0) {
      jobDetails['Job Responsibilities'] = descriptionBullets;
    }
    if (requirementsBullets.length > 0) {
      jobDetails['Requirements'] = requirementsBullets;
    }
    if (cnJob.primarySkills && cnJob.primarySkills.length > 0) {
      jobDetails['Primary Skills'] = cnJob.primarySkills;
    }
    if (cnJob.secondarySkills && cnJob.secondarySkills.length > 0) {
      jobDetails['Secondary Skills'] = cnJob.secondarySkills;
    }
    if (cnJob.position && cnJob.position.length > 0) {
      jobDetails['Position Types'] = cnJob.position;
    }

    // Convert to your format
    const { pairs, sections } = convertMixedObjectToArrays(jobDetails);

    // Create grading parameters from skills and requirements
    const gradingParams: GradingParameter[] = [
      { id: "overall", name: "Overall" } // Always include Overall
    ];

    // Add skill-based parameters
    if (cnJob.primarySkills && cnJob.primarySkills.length > 0) {
      cnJob.primarySkills.slice(0, 3).forEach((skill: string, index: number) => {
        gradingParams.push({
          id: `skill_${index}`,
          name: skill.length > 30 ? skill.substring(0, 27) + '...' : skill
        });
      });
    }

    // Add common job-related parameters
    gradingParams.push(
      { id: "tech_skills", name: "Technical Skills" },
      { id: "communication", name: "Communication" },
      { id: "problem_solving", name: "Problem Solving" }
    );

    // Add empty parameter for user to add more
    gradingParams.push({ id: Date.now().toString(), name: "" });

    return {
      formData: {
        name: cnJob.title || '',
        description: descriptionText || cnJob.title || 'Job imported from CHANGE Networks'
      },
      longDescriptionPairs: pairs,
      bulletSections: sections,
      gradingParameters: gradingParams
    };
  };

  // Handle adding job from Change Networks
  const handleAddFromChangeNetworks = async (jobId: string) => {
    try {
      const jobDetails = await fetchJobDetails(jobId);
      if (!jobDetails) return;

      const convertedJob = convertChangeNetworksJob(jobDetails);
      
      // Populate form with converted data
      setFormData(convertedJob.formData);
      setLongDescriptionPairs(convertedJob.longDescriptionPairs);
      setBulletSections(convertedJob.bulletSections);
      setGradingParameters(convertedJob.gradingParameters);
      
      // Set the current job portal ID
      setCurrentJobPortalId(jobId);
      
      // Open create dialog
      setShowCreateDialog(true);
      
      toast.success('Job details loaded from CHANGE Networks portal');
    } catch (error: any) {
      console.error('Failed to add job from CHANGE Networks:', error);
      toast.error('Failed to load job details');
    }
  };


  // Main function to sync with Change Networks
  const syncWithChangeNetworks = async () => {
    try {
      const missingJobsList = await fetchMissingJobs();
      if (missingJobsList.length === 0) {
        toast.success('All CHANGE Networks jobs are already synced!');
        setShowMissingJobsSection(false);
      } else {
        toast.success(`Found ${missingJobsList.length} jobs that need to be synced`);
        setShowMissingJobsSection(true);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync with CHANGE Networks');
    }
  };

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
            Job Management with Glory System
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create, view, edit, and delete job postings with candidate grading
            parameters
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
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Jobs with Grading
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {
                      jobs.filter(
                        (job) =>
                          job.gradingParameters &&
                          job.gradingParameters.length > 0
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Networks Integration Section */}
        {showMissingJobsSection && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400">
                    🔗 CHANGE Networks Jobs Integration
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Jobs from CHANGE Networks portal that are not yet in your database
                  </p>
                </div>
                <Button
                  onClick={() => setShowMissingJobsSection(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMissingJobs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  <span className="text-muted-foreground">
                    Checking missing jobs...
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {missingJobs.length === 0 ? (
                    <div className="text-center py-6">
                      <Briefcase className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">All jobs are already synced!</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <h3 className="font-medium mb-2">
                          Missing Jobs ({missingJobs.length})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Click "Add to Portal" to import these jobs with auto-filled details
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {missingJobs.map((missingJob) => (
                          <div
                            key={missingJob._id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm sm:text-base truncate">
                                {missingJob.title}
                              </h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  📍 {missingJob.location}
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  💰 {missingJob.salary}
                                </span>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  📅 {missingJob.expInYears}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAddFromChangeNetworks(missingJob._id)}
                              size="sm"
                              className="ml-3 shrink-0"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add to Portal
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              
              <Button
                onClick={syncWithChangeNetworks}
                variant="outline"
                size="sm"
                disabled={loadingMissingJobs}
                className="h-8 sm:h-9"
              >
                {loadingMissingJobs ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current mr-1 sm:mr-2" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Sync with CHANGE Networks</span>
                <span className="sm:hidden">Sync</span>
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
                                {job.gradingParameters &&
                                  job.gradingParameters.length > 0 && (
                                    <span className="inline-flex items-center px-2 py-1 ml-2 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                      <Award className="h-3 w-3 mr-1" />
                                      {job.gradingParameters.length} params
                                    </span>
                                  )}
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

                            {/* Display Grading Parameters */}
                            {job.gradingParameters &&
                              job.gradingParameters.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                                    Glory Parameters:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {job.gradingParameters
                                      .slice(0, 5)
                                      .map((param, index) => (
                                        <span
                                          key={index}
                                          className="inline-flex items-center px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                                        >
                                          {param}
                                        </span>
                                      ))}
                                    {job.gradingParameters.length > 5 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{job.gradingParameters.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Unified Bullet Display - Both key-value pairs AND bullet sections as bullets */}
                            {job.long_description &&
                              typeof job.long_description === "object" && (
                                <div className="mb-3">
                                  <div className="space-y-2">
                                    {/* Bullet Sections - render as bullets */}
                                    {Object.entries(job.long_description)
                                      .filter(([_, value]) =>
                                        Array.isArray(value)
                                      )
                                      .slice(0, 2)
                                      .map(
                                        ([sectionName, bullets]: [
                                          string,
                                          any
                                        ]) => (
                                          <div
                                            key={sectionName}
                                            className="space-y-1"
                                          >
                                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 capitalize mb-1">
                                              {sectionName}:
                                            </div>
                                            <ul className="space-y-1 ml-2">
                                              {bullets
                                                .slice(0, 3)
                                                .map(
                                                  (
                                                    bullet: string,
                                                    index: number
                                                  ) => (
                                                    <li
                                                      key={index}
                                                      className="flex items-start text-sm"
                                                    >
                                                      <span className="text-blue-600 mr-2 mt-0.5 flex-shrink-0">
                                                        •
                                                      </span>
                                                      <span className="text-gray-900 dark:text-gray-100 break-words">
                                                        {bullet.length > 50
                                                          ? `${bullet.substring(
                                                              0,
                                                              50
                                                            )}...`
                                                          : bullet}
                                                      </span>
                                                    </li>
                                                  )
                                                )}
                                            </ul>
                                            {bullets.length > 3 && (
                                              <div className="text-xs text-muted-foreground ml-4">
                                                +{bullets.length - 3} more
                                                points
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}

                                    {/* Key-Value Pairs - render as bullets too */}
                                    {Object.entries(
                                      job.long_description
                                    ).filter(
                                      ([_, value]) => !Array.isArray(value)
                                    ).length > 0 && (
                                      <div className="space-y-1">
                                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                          Extra Details:
                                        </div>
                                        <ul className="space-y-1 ml-2">
                                          {Object.entries(job.long_description)
                                            .filter(
                                              ([_, value]) =>
                                                !Array.isArray(value)
                                            )
                                            .slice(0, 4)
                                            .map(([key, value]) => (
                                              <li
                                                key={key}
                                                className="flex items-start text-sm"
                                              >
                                                <span className="text-blue-600 mr-2 mt-0.5 flex-shrink-0">
                                                  •
                                                </span>
                                                <span className="text-gray-900 dark:text-gray-100 break-words">
                                                  <span className="font-medium capitalize">
                                                    {key
                                                      .replace(
                                                        /([A-Z])/g,
                                                        " $1"
                                                      )
                                                      .trim()}
                                                    :
                                                  </span>{" "}
                                                  {String(value).length > 40
                                                    ? `${String(
                                                        value
                                                      ).substring(0, 40)}...`
                                                    : String(value)}
                                                </span>
                                              </li>
                                            ))}
                                        </ul>
                                        {Object.entries(
                                          job.long_description
                                        ).filter(
                                          ([_, value]) => !Array.isArray(value)
                                        ).length > 4 && (
                                          <div className="text-xs text-muted-foreground ml-4">
                                            +
                                            {Object.entries(
                                              job.long_description
                                            ).filter(
                                              ([_, value]) =>
                                                !Array.isArray(value)
                                            ).length - 4}{" "}
                                            more details
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* View More Button */}
                                    {(Object.keys(job.long_description).filter(
                                      (key) =>
                                        Array.isArray(job.long_description[key])
                                    ).length > 2 ||
                                      Object.keys(job.long_description).filter(
                                        (key) =>
                                          !Array.isArray(
                                            job.long_description[key]
                                          )
                                      ).length > 4) && (
                                      <div className="text-center mt-3">
                                        <button
                                          onClick={() => openViewDialog(job)}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                                        >
                                          View all details
                                        </button>
                                      </div>
                                    )}
                                  </div>
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
              {currentJobPortalId 
                ? "Importing job from CHANGE Networks portal with auto-filled details" 
                : "Add a new job posting to your organization with glory parameters"
              }
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

            {/* Grading Parameters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-purple-700 dark:text-purple-400">
                  <Award className="inline h-4 w-4 mr-2" />
                  Add Glory Parameters
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGradingParameter}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Parameter
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                {gradingParameters.map((param, index) => (
                  <div key={param.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Parameter name (e.g., Technical Skills, Communication, Problem Solving)"
                      value={param.name}
                      onChange={(e) =>
                        updateGradingParameter(param.id, e.target.value)
                      }
                      className="flex-1"
                    />
                    {gradingParameters.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGradingParameter(param.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Key-Value Pairs Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Key-Value Details
                </Label>
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
                      placeholder="Field name (e.g., Salary, Location)"
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

            {/* Bullet Sections */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Bullet Point Sections
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulletSection}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {bulletSections.map((section) => (
                  <div
                    key={section.id}
                    className="border rounded-lg p-3 space-y-3 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Section name (e.g., Responsibilities, Requirements, Benefits)"
                        value={section.name}
                        onChange={(e) =>
                          updateBulletSectionName(section.id, e.target.value)
                        }
                        className="flex-1 font-medium"
                      />
                      {bulletSections.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBulletSection(section.id)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 ml-2">
                      {section.bullets.map((bullet, bulletIndex) => (
                        <div key={bullet.id} className="flex gap-2 items-start">
                          <div className="flex items-center justify-center w-6 h-9 text-sm text-muted-foreground">
                            •
                          </div>
                          <Textarea
                            placeholder={`Point ${bulletIndex + 1}`}
                            value={bullet.text}
                            onChange={(e) =>
                              updateBulletInSection(
                                section.id,
                                bullet.id,
                                e.target.value
                              )
                            }
                            className="flex-1 min-h-[36px] resize-none"
                            rows={1}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = "auto";
                              target.style.height = target.scrollHeight + "px";
                            }}
                          />
                          {section.bullets.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeBulletFromSection(section.id, bullet.id)
                              }
                              className="p-2 text-red-600 hover:text-red-700 mt-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBulletToSection(section.id)}
                        className="ml-6 mt-2"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Add Point
                      </Button>
                    </div>
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

      {/* Edit Job Dialog - Similar to Create but with editing state */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update the job posting details and glory parameters
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

            {/* Grading Parameters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-purple-700 dark:text-purple-400">
                  <Award className="inline h-4 w-4 mr-2" />
                  Glory Parameters (A+, A, B, C, D, E)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGradingParameter}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Parameter
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                {gradingParameters.map((param, index) => (
                  <div key={param.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Parameter name (e.g., Technical Skills, Communication, Problem Solving)"
                      value={param.name}
                      onChange={(e) =>
                        updateGradingParameter(param.id, e.target.value)
                      }
                      className="flex-1"
                    />
                    {gradingParameters.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGradingParameter(param.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Key-Value Pairs Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Key-Value Details
                </Label>
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
                      placeholder="Field name (e.g., Salary, Location)"
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

            {/* Bullet Sections */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Bullet Point Sections
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulletSection}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {bulletSections.map((section, sectionIndex) => (
                  <div
                    key={section.id}
                    className="border rounded-lg p-3 space-y-3 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Section name (e.g., Responsibilities, Requirements, Benefits)"
                        value={section.name}
                        onChange={(e) =>
                          updateBulletSectionName(section.id, e.target.value)
                        }
                        className="flex-1 font-medium"
                      />
                      {bulletSections.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBulletSection(section.id)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 ml-2">
                      {section.bullets.map((bullet, bulletIndex) => (
                        <div key={bullet.id} className="flex gap-2 items-start">
                          <div className="flex items-center justify-center w-6 h-9 text-sm text-muted-foreground">
                            •
                          </div>
                          <Textarea
                            placeholder={`Point ${bulletIndex + 1}`}
                            value={bullet.text}
                            onChange={(e) =>
                              updateBulletInSection(
                                section.id,
                                bullet.id,
                                e.target.value
                              )
                            }
                            className="flex-1 min-h-[36px] resize-none"
                            rows={1}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = "auto";
                              target.style.height = target.scrollHeight + "px";
                            }}
                          />
                          {section.bullets.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeBulletFromSection(section.id, bullet.id)
                              }
                              className="p-2 text-red-600 hover:text-red-700 mt-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBulletToSection(section.id)}
                        className="ml-6 mt-2"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Add Point
                      </Button>
                    </div>
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

              {/* Display Grading Parameters */}
              {viewingJob.gradingParameters &&
                viewingJob.gradingParameters.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-purple-700 dark:text-purple-400">
                      <Award className="inline h-4 w-4 mr-2" />
                      Grading Parameters
                    </Label>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {viewingJob.gradingParameters.map((param, index) => (
                          <div
                            key={index}
                            className="flex items-center p-2 bg-white dark:bg-purple-800/30 rounded border"
                          >
                            <Star className="h-3 w-3 text-purple-600 mr-2" />
                            <span className="text-sm font-medium">{param}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Candidates will be graded on these parameters using A+,
                        A, B, C, D, E scale
                      </div>
                    </div>
                  </div>
                )}

              {viewingJob.long_description && (
                <div className="space-y-4">
                  {/* Unified Bullet Display in View Dialog */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Additional Details</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="space-y-4">
                        {/* Key-Value Pairs as Bullets */}
                        {Object.entries(viewingJob.long_description).filter(
                          ([_, value]) => !Array.isArray(value)
                        ).length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 border-b pb-1">
                              Additional Details
                            </div>
                            <ul className="space-y-2 ml-2">
                              {Object.entries(viewingJob.long_description)
                                .filter(([_, value]) => !Array.isArray(value))
                                .map(([key, value]) => (
                                  <li key={key} className="flex items-start">
                                    <span className="text-green-600 mr-2 mt-1 flex-shrink-0">
                                      •
                                    </span>
                                    <span className="text-sm break-words flex-1">
                                      <span className="font-medium capitalize">
                                        {key.replace(/([A-Z])/g, " $1").trim()}:
                                      </span>{" "}
                                      {String(value)}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                        {/* Bullet Sections */}
                        {Object.entries(viewingJob.long_description)
                          .filter(([_, value]) => Array.isArray(value))
                          .map(([sectionName, bullets]: [string, any]) => (
                            <div key={sectionName} className="space-y-2">
                              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 capitalize border-b pb-1">
                                {sectionName}
                              </div>
                              <ul className="space-y-2 ml-2">
                                {bullets.map(
                                  (bullet: string, index: number) => (
                                    <li
                                      key={index}
                                      className="flex items-start"
                                    >
                                      <span className="text-blue-600 mr-2 mt-1 flex-shrink-0">
                                        •
                                      </span>
                                      <span className="text-sm break-words flex-1">
                                        {bullet}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          ))}
                      </div>
                    </div>
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
