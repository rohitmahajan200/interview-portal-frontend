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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, FileText, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Briefcase,
  Save,
  Eye,
  X,
  MapPin,
  Users,
  Building,
  DollarSign,
  Calendar,
  Tag,
  Award,
} from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

// Updated interface based on new schema
export interface IJob {
  _id: string;
  title: string;
  category: string;
  time: string;
  country: string;
  location: string;
  slug: string;
  expInYears: string;
  description: string | object; // HTML content
  requirements: string | object; // HTML content  
  primarySkills: string[];
  secondarySkills: string[];
  position: string[];
  publishStatus: "open" | "close";
  vacancies: number;
  salary: string;
  schedule: string;
  type: string;
  industry: string;
  tags: string[];
  note?: string;
  customQuestions: string[];
  gradingParameters?: string[];
  createdAt: string;
  updatedAt: string;
}

// Autocomplete data interface
interface AutocompleteData {
  primarySkills: string[];
  secondarySkills: string[];
  category: string[];
  tags: string[];
  expInYears: string[];
  position: string[];
  gradingParameters: string[];
  country: string[];
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

  // Autocomplete data
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteData>({
    primarySkills: [],
    secondarySkills: [],
    category: [],
    tags: [],
    expInYears: [],
    position: [],
    gradingParameters: [],
    country: [],
  });

  // Form data with new schema fields
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    time: "",
    country: "",
    location: "",
    slug: "",
    expInYears: "",
    description: [] as string[], // Array of sentences for HTML formatting
    requirements: [] as string[], // Array of sentences for HTML formatting
    primarySkills: [] as string[],
    secondarySkills: [] as string[],
    position: [] as string[],
    publishStatus: "open" as "open" | "close",
    vacancies: 1,
    salary: "",
    schedule: "",
    type: "",
    industry: "",
    tags: [] as string[],
    note: "",
    customQuestions: [] as string[],
    gradingParameters: [] as string[],
  });

  const [editingJob, setEditingJob] = useState<IJob | null>(null);
  const [viewingJob, setViewingJob] = useState<IJob | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Combobox states for autocomplete
  const [openComboboxes, setOpenComboboxes] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchJobs();
    fetchAutocompleteData();
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
            const errorMessage = error?.response?.data?.message || "Failed to load jobs";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Fetch distinct values for autocomplete
  const fetchAutocompleteData = async () => {
    const fieldsToFetch = ["primarySkills", "secondarySkills", "category", "tags", "expInYears", "position", "gradingParameters", "country"];
    
    try {
      const promises = fieldsToFetch.map(async (field) => {
        try {
          const response = await api.get(`/org/jobs/distinct/${field}`);
          return {
            field,
            data: response.data.success ? response.data.data || [] : []
          };
        } catch (error) {
                    return { field, data: [] };
        }
      });

      const results = await Promise.all(promises);
      const newAutocompleteData: AutocompleteData = {
        primarySkills: [],
        secondarySkills: [],
        category: [],
        tags: [],
        expInYears: [],
        position: [],
        gradingParameters: [],
        country: [],
      };

      results.forEach(({ field, data }) => {
        if (field in newAutocompleteData) {
          newAutocompleteData[field as keyof AutocompleteData] = data;
        }
      });

      setAutocompleteData(newAutocompleteData);
    } catch (error) {
          }
  };

    // Convert sentences array to styled HTML format for Description
    const formatDescriptionToHTML = (sentences: string[]): string => {
      if (!sentences.length) return "";
      
      const listItems = sentences.map(sentence => 
        `\t<li><span style="tab-stops:list .5in"><span style="font-size:11.0pt"><span style="font-family:&quot;Aptos&quot;,sans-serif">${sentence.trim()}</span></span></span></li>`
      ).join('\n');
      
      return `<ol>\n${listItems}\n</ol>`;
    };

    // Convert sentences array to styled HTML format for Requirements  
    const formatRequirementsToHTML = (sentences: string[]): string => {
      if (!sentences.length) return "";
      
      const listItems = sentences.map(sentence => 
        `\t<li><span style="tab-stops:list .5in"><span style="font-size:11.0pt"><span style="font-family:&quot;Aptos&quot;,sans-serif">${sentence.trim()}</span></span></span></li>`
      ).join('\n');
      
      return `<ol>\n${listItems}\n</ol>`;
    };

    // Parse HTML back to sentences array for editing (updated to handle <ol> and complex spans)
    const parseFromHTML = (html: string | object): string[] => {
      if (typeof html !== 'string') return [];
      
      // Extract list items from HTML (handles both <ul> and <ol>)
      const listItemRegex = /<li[^>]*>(?:<span[^>]*>)*(?:<span[^>]*>)*(?:<span[^>]*>)*([^<]+)(?:<\/span>)*(?:<\/span>)*(?:<\/span>)*<\/li>/gi;
      const matches = [];
      let match;
      
      while ((match = listItemRegex.exec(html)) !== null) {
        const content = match[1].trim();
        if (content) {
          matches.push(content);
        }
      }
      
      // If no list items found, try to extract plain text
      if (matches.length === 0) {
        const plainText = html.replace(/<[^>]*>/g, '').trim();
        return plainText ? [plainText] : [];
      }
      
      return matches;
    };

  const handleCreateJob = async () => {
    if (!formData.title.trim() || !formData.category.trim() || !formData.description.length) {
      toast.error("Title, category, and description are required");
      return;
    }

    try {
      setIsCreating(true);
      
      // Format description and requirements as HTML
      const formattedData = {
        ...formData,
        description: formatDescriptionToHTML(formData.description),
        requirements: formatRequirementsToHTML(formData.requirements),
      };

      const response = await api.post("/org/jobs", formattedData);

      if (response.data.success) {
        toast.success("Job created successfully");
        setShowCreateDialog(false);
        resetForm();
        await fetchJobs();
        await fetchAutocompleteData(); // Refresh autocomplete data
      } else {
        toast.error(response.data.message || "Failed to create job");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to create job";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditJob = async () => {
    if (!editingJob) return;

    try {
      setIsEditing(true);
      
      // Format description and requirements as HTML
      const formattedData = {
        ...formData,
        description: formatDescriptionToHTML(formData.description),
        requirements: formatRequirementsToHTML(formData.requirements),
      };

      const response = await api.put(`/org/jobs/${editingJob._id}`, formattedData);

      if (response.data.success) {
        toast.success("Job updated successfully");
        setShowEditDialog(false);
        setEditingJob(null);
        resetForm();
        await fetchJobs();
        await fetchAutocompleteData(); // Refresh autocomplete data
      } else {
        toast.error(response.data.message || "Failed to update job");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to update job";
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
        toast.success("Job deleted successfully");
        setShowDeleteDialog(false);
        setEditingJob(null);
        await fetchJobs();
        await fetchAutocompleteData(); // Refresh autocomplete data
      } else {
        toast.error(response.data.message || "Failed to delete job");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to delete job";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (job: IJob) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      category: job.category,
      time: job.time,
      country: job.country,
      location: job.location,
      slug: job.slug,
      expInYears: job.expInYears,
      description: parseFromHTML(job.description),
      requirements: parseFromHTML(job.requirements),
      primarySkills: job.primarySkills || [],
      secondarySkills: job.secondarySkills || [],
      position: job.position || [],
      publishStatus: job.publishStatus,
      vacancies: job.vacancies,
      salary: job.salary,
      schedule: job.schedule,
      type: job.type,
      industry: job.industry,
      tags: job.tags || [],
      note: job.note || "",
      customQuestions: job.customQuestions || [],
      gradingParameters: job.gradingParameters || [],
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (job: IJob) => {
    setViewingJob(job);
    setShowViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      time: "",
      country: "",
      location: "",
      slug: "",
      expInYears: "",
      description: [],
      requirements: [],
      primarySkills: [],
      secondarySkills: [],
      position: [],
      publishStatus: "open",
      vacancies: 1,
      salary: "",
      schedule: "",
      type: "",
      industry: "",
      tags: [],
      note: "",
      customQuestions: [],
      gradingParameters: [],
    });
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
    if (selectedJobs.length === filteredJobs.length && filteredJobs.length > 0) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map((job) => job._id));
    }
  };

  const refreshData = async () => {
    await fetchJobs();
    await fetchAutocompleteData();
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
    const text = typeof content === "string" ? content.replace(/<[^>]*>/g, '') : JSON.stringify(content);
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper functions for array field management
  const addToArray = (field: keyof typeof formData, value: string) => {
    if (!value.trim()) return;
    const currentArray = formData[field] as string[];
    if (!currentArray.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  // Enhanced Autocomplete component with ability to add new values
  const AutocompleteField = ({ 
    field, 
    placeholder, 
    value, 
    onSelect,
    allowCustom = true,
    allowClear = true // New prop to show/hide clear button
  }: { 
    field: keyof AutocompleteData; 
    placeholder: string;
    value: string;
    onSelect: (value: string) => void;
    allowCustom?: boolean;
    allowClear?: boolean;
  }) => {
    const options = autocompleteData[field] || [];
    const isOpen = openComboboxes[field] || false;
    const [inputValue, setInputValue] = useState("");

    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleSelect = (selectedValue: string) => {
      onSelect(selectedValue);
      setInputValue("");
      setOpenComboboxes(prev => ({ ...prev, [field]: false }));
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the popover
      onSelect("");
      setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && allowCustom && inputValue.trim() && !filteredOptions.includes(inputValue.trim())) {
        e.preventDefault();
        handleSelect(inputValue.trim());
      }
    };

    return (
      <div className="relative">
        <Popover 
          open={isOpen} 
          onOpenChange={(open) => {
            setOpenComboboxes(prev => ({ ...prev, [field]: open }));
            if (!open) setInputValue("");
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between pr-8" // Add right padding for clear button
            >
              <span className="truncate">{value || placeholder}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] md:w-xs p-0 break-words" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                value={inputValue}
                onValueChange={setInputValue}
                onKeyDown={handleKeyDown}
              />
              <CommandEmpty>
                {allowCustom && inputValue.trim() ? (
                  <div className="p-2 text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      No existing option found.
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelect(inputValue.trim())}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add "{inputValue.trim()}"
                    </Button>
                  </div>
                ) : (
                  "No option found."
                )}
              </CommandEmpty>
              <CommandGroup className="max-h-48 overflow-y-auto">
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        
        {/* Clear button - only show when there's a value and allowClear is true */}
        {allowClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0 hover:bg-muted"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  const ArrayFieldWithAutocomplete = ({
    field,
    label,
    placeholder,
    values,
    onAdd,
    onRemove,
    variant = "default",
    icon,
    required = false
  }: {
    field: keyof AutocompleteData;
    label: string;
    placeholder: string;
    values: string[];
    onAdd: (value: string) => void;
    onRemove: (index: number) => void;
    variant?: "default" | "secondary" | "outline";
    icon?: React.ReactNode;
    required?: boolean;
  }) => {
    const options = autocompleteData[field] || [];
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(inputValue.toLowerCase()) &&
      !values.includes(option)
    );

    const handleSelect = (value: string) => {
      if (value.trim() && !values.includes(value.trim())) {
        onAdd(value.trim());
        setInputValue("");
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        handleSelect(inputValue.trim());
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      // Open popover when typing
      if (value.trim() && !isOpen) {
        setIsOpen(true);
      }
    };

    return (
      <div className="space-y-2">
        <Label>{label} {required && "*"}</Label>
        <div className="space-y-2">
          {/* Input with Add Button */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (inputValue.trim()) {
                    setIsOpen(true);
                  }
                }}
                onBlur={() => {
                  // Delay closing to allow for option selection
                  setTimeout(() => setIsOpen(false), 200);
                }}
                className="flex-1"
              />
              
              {/* Autocomplete Suggestions Dropdown */}
              {isOpen && (inputValue.trim() || filteredOptions.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredOptions.length > 0 && (
                    <div className="p-1">
                      {filteredOptions.map((option) => (
                        <div
                          key={option}
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-3 py-2 text-sm rounded-sm flex items-center"
                          onClick={() => handleSelect(option)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add custom value option */}
                  {inputValue.trim() && !values.includes(inputValue.trim()) && (
                    <div className="border-t border-border p-2">
                      <div
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-3 py-2 text-sm rounded-sm flex items-center"
                        onClick={() => handleSelect(inputValue.trim())}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add "{inputValue.trim()}"
                      </div>
                    </div>
                  )}
                  
                  {filteredOptions.length === 0 && !inputValue.trim() && (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Type to add or search options
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (inputValue.trim()) {
                  handleSelect(inputValue.trim());
                }
              }}
              disabled={!inputValue.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Display selected values as badges */}
          <div className="flex flex-wrap gap-1">
            {values.map((value, index) => (
              <Badge key={index} variant={variant} className="text-xs">
                {icon && <span className="mr-1">{icon}</span>}
                {value}
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <Toaster position="bottom-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Job Management
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create, view, edit, and manage job postings for your organization
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Jobs
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
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
                    Open Positions
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {jobs.filter(job => job.publishStatus === "open").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Selected
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {selectedJobs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    With Grading
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {jobs.filter(job => job.gradingParameters && job.gradingParameters.length > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface - Same as before but with job list rendering */}
        <Card>
          <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold">Job Operations</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={openCreateDialog} size="sm" className="flex-1 sm:flex-none h-9">
                <Plus className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Job</span>
              </Button>
              
              <Button onClick={refreshData} variant="outline" size="sm" disabled={loading} className="h-9 w-9 p-0 sm:w-auto sm:p-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, category, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1 sm:w-40 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="updatedAt">Updated</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="flex-1 sm:w-24 h-10">
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
                  checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Select All ({filteredJobs.length})</Label>
              </div>
            )}
            
            {/* Jobs List - Same as before */}
            <div className="space-y-3 sm:space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {searchTerm ? "No jobs match your search." : "No jobs available. Create your first job!"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={openCreateDialog} className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </Button>
                  )}
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedJobs.includes(job._id)}
                          onCheckedChange={(checked) => handleJobSelect(job._id, !!checked)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg break-words pr-2">
                                {job.title}
                              </h3>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Building className="h-3 w-3 mr-1" />
                                  {job.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {job.location}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {job.salary}
                                </Badge>
                                <Badge 
                                  variant={job.publishStatus === "open" ? "default" : "destructive"} 
                                  className="text-xs"
                                >
                                  {job.publishStatus}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 self-start">
                              <Button
                                onClick={() => openViewDialog(job)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => openEditDialog(job)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingJob(job);
                                  setShowDeleteDialog(true);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-muted-foreground text-xs sm:text-sm mb-3 break-words line-clamp-2">
                            {getContentPreview(job.description, 120)}
                          </p>

                          {/* Skills and Tags - Same as before */}
                          {(job.primarySkills?.length > 0 || job.tags?.length > 0) && (
                            <div className="mb-3 space-y-2">
                              {job.primarySkills?.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                    Primary Skills:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {job.primarySkills.slice(0, 3).map((skill, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {job.primarySkills.length > 3 && (
                                      <span className="text-xs text-muted-foreground self-center">
                                        +{job.primarySkills.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {job.tags?.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                                    Tags:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {job.tags.slice(0, 3).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        <Tag className="h-2 w-2 mr-1" />
                                        {tag}
                                      </Badge>
                                    ))}
                                    {job.tags.length > 3 && (
                                      <span className="text-xs text-muted-foreground self-center">
                                        +{job.tags.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Grading Parameters */}
                          {job.gradingParameters && job.gradingParameters.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                                Grading Parameters:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {job.gradingParameters.slice(0, 3).map((param, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    <Award className="h-2 w-2 mr-1" />
                                    {param}
                                  </Badge>
                                ))}
                                {job.gradingParameters.length > 3 && (
                                  <span className="text-xs text-muted-foreground self-center">
                                    +{job.gradingParameters.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs text-muted-foreground pt-2 border-t">
                            <span>Created: {formatDate(job.createdAt)}</span>
                            <span>Updated: {formatDate(job.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Job Dialog with Autocomplete and Structured HTML Input */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] xl:max-w-[95vw] w-full h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>
                Add a new job posting to your organization
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto flex-1 p-1">
              <div className="grid gap-4 py-4">
                {/* Basic Information with Autocomplete - 3 columns on large screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Job Title *</Label>
                    <Input
                      id="job-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter job title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-category">Category *</Label>
                    <AutocompleteField
                      field="category"
                      placeholder="Select or type category"
                      value={formData.category}
                      onSelect={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      allowCustom={true}
                      allowClear={true}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="job-location">Location *</Label>
                    <Input
                      id="job-location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                {/* Country, Slug, Experience - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-country">Country *</Label>
                    <AutocompleteField
                      field="country"
                      placeholder="Select or type country"
                      value={formData.country}
                      onSelect={(value) => setFormData(prev => ({ ...prev, country: value }))}
                      allowCustom={true}
                      allowClear={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-slug">URL Slug *</Label>
                    <Input
                      id="job-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                      placeholder="job-title-slug"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="job-experience">Experience Required *</Label>
                    <AutocompleteField
                      field="expInYears"
                      placeholder="Select or type experience"
                      value={formData.expInYears}
                      onSelect={(value) => setFormData(prev => ({ ...prev, expInYears: value }))}
                      allowCustom={true}
                      allowClear={true}
                    />
                  </div>
                </div>

                {/* Job Type, Schedule, Industry - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-type">Job Type *</Label>
                    <Input
                      id="job-type"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      placeholder="e.g., Full-time, Part-time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-schedule">Schedule *</Label>
                    <Input
                      id="job-schedule"
                      value={formData.schedule}
                      onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                      placeholder="e.g., Monday to Friday"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="job-industry">Industry *</Label>
                    <Input
                      id="job-industry"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Software Development"
                    />
                  </div>
                </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label htmlFor="job-salary">Salary *</Label>
                  <Input
                    id="job-salary"
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g., $50,000 - $80,000"
                  />
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label htmlFor="job-vacancies">Vacancies *</Label>
                  <Input
                    id="job-vacancies"
                    type="number"
                    min="1"
                    value={formData.vacancies}
                    onChange={(e) => setFormData(prev => ({ ...prev, vacancies: parseInt(e.target.value) || 1 }))}
                    placeholder="Number of positions"
                  />
                </div>

                {/* 👇 Status shrinks to content instead of flexing */}
                <div className="w-auto space-y-2">
                  <Label htmlFor="job-status">Status</Label>
                  <Select
                    value={formData.publishStatus}
                    onValueChange={(value: "open" | "close") => setFormData(prev => ({ ...prev, publishStatus: value }))}
                  >
                    <SelectTrigger className="min-w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="close">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label htmlFor="job-time">Working Hours *</Label>
                  <Input
                    id="job-time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                  />
                </div>
              </div>



                {/* Description and Requirements - Full width sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Enhanced Job Description Input */}
                  <div className="space-y-2">
                    <Label>Job Description *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add description point (press Enter to add)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = (e.target as HTMLInputElement).value;
                              if (value.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  description: [...prev.description, value.trim()]
                                }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                            if (input?.value.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                description: [...prev.description, input.value.trim()]
                              }));
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {formData.description.map((point, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded text-sm border-l-4 border-blue-500">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  Point {index + 1}
                                </span>
                              </div>
                              <span className="text-sm">{point}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromArray('description', index)}
                              className="hover:text-red-500 mt-0.5 p-1 hover:bg-red-50 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {formData.description.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No description points added yet. Add points above.
                          </div>
                        )}
                      </div>
                      {formData.description.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formData.description.length} point{formData.description.length !== 1 ? 's' : ''} added
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Job Requirements Input */}
                  <div className="space-y-2">
                    <Label>Job Requirements *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add requirement point (press Enter to add)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = (e.target as HTMLInputElement).value;
                              if (value.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  requirements: [...prev.requirements, value.trim()]
                                }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                            if (input?.value.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                requirements: [...prev.requirements, input.value.trim()]
                              }));
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {formData.requirements.map((point, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded text-sm border-l-4 border-green-500">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                  Req {index + 1}
                                </span>
                              </div>
                              <span className="text-sm">{point}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromArray('requirements', index)}
                              className="hover:text-red-500 mt-0.5 p-1 hover:bg-red-50 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {formData.requirements.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No requirement points added yet. Add points above.
                          </div>
                        )}
                      </div>
                      {formData.requirements.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formData.requirements.length} requirement{formData.requirements.length !== 1 ? 's' : ''} added
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills and Position - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ArrayFieldWithAutocomplete
                    field="primarySkills"
                    label="Primary Skills"
                    placeholder="Add primary skill"
                    values={formData.primarySkills}
                    onAdd={(value) => addToArray('primarySkills', value)}
                    onRemove={(index) => removeFromArray('primarySkills', index)}
                    variant="default"
                    required={true}
                  />

                  <ArrayFieldWithAutocomplete
                    field="secondarySkills"
                    label="Secondary Skills"
                    placeholder="Add secondary skill"
                    values={formData.secondarySkills}
                    onAdd={(value) => addToArray('secondarySkills', value)}
                    onRemove={(index) => removeFromArray('secondarySkills', index)}
                    variant="secondary"
                  />

                  <div className="md:col-span-2 lg:col-span-1">
                    <ArrayFieldWithAutocomplete
                      field="position"
                      label="Position Types"
                      placeholder="Add position type"
                      values={formData.position}
                      onAdd={(value) => addToArray('position', value)}
                      onRemove={(index) => removeFromArray('position', index)}
                      variant="outline"
                      required={true}
                    />
                  </div>
                </div>

                {/* Tags, Custom Questions, Grading Parameters - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ArrayFieldWithAutocomplete
                    field="tags"
                    label="Tags"
                    placeholder="Add tag"
                    values={formData.tags}
                    onAdd={(value) => addToArray('tags', value)}
                    onRemove={(index) => removeFromArray('tags', index)}
                    variant="secondary"
                    icon={<Tag className="h-2 w-2" />}
                  />

                  <div className="space-y-2">
                    <Label>Custom Questions</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add custom question"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('customQuestions', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                            if (input?.value.trim()) {
                              addToArray('customQuestions', input.value);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {formData.customQuestions.map((question, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                            <span className="text-xs flex-1">{question}</span>
                            <button
                              type="button"
                              onClick={() => removeFromArray('customQuestions', index)}
                              className="hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-1">
                    <ArrayFieldWithAutocomplete
                      field="gradingParameters"
                      label="Grading Parameters"
                      placeholder="Add grading parameter"
                      values={formData.gradingParameters}
                      onAdd={(value) => addToArray('gradingParameters', value)}
                      onRemove={(index) => removeFromArray('gradingParameters', index)}
                      variant="outline"
                      icon={<Award className="h-2 w-2" />}
                    />
                  </div>
                </div>

                {/* Note - Full width */}
                <div className="space-y-2">
                  <Label htmlFor="job-note">Additional Notes</Label>
                  <Textarea
                    id="job-note"
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Any additional notes or information"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isCreating}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateJob} 
                disabled={isCreating} 
                className="w-full sm:w-auto order-1 sm:order-2"
              >
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

        {/* Edit Job Dialog - Complete Form Content with Responsive Layout */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] xl:max-w-[95vw] w-full h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
              <DialogDescription>
                Update job posting details
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto flex-1 p-1">
              <div className="grid gap-4 py-4">
                {/* Basic Information with Autocomplete - 3 columns on large screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-title">Job Title *</Label>
                    <Input
                      id="edit-job-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter job title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-category">Category *</Label>
                    <AutocompleteField
                      field="category"
                      placeholder="Select or type category"
                      value={formData.category}
                      onSelect={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      allowCustom={true}
                      allowClear={true}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="edit-job-location">Location *</Label>
                    <Input
                      id="edit-job-location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                {/* Country, Slug, Experience - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-country">Country *</Label>
                    <AutocompleteField
                      field="country"
                      placeholder="Select or type country"
                      value={formData.country}
                      onSelect={(value) => setFormData(prev => ({ ...prev, country: value }))}
                      allowCustom={true}
                      allowClear={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-slug">URL Slug *</Label>
                    <Input
                      id="edit-job-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                      placeholder="job-title-slug"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="edit-job-experience">Experience Required *</Label>
                    <AutocompleteField
                      field="expInYears"
                      placeholder="Select or type experience"
                      value={formData.expInYears}
                      onSelect={(value) => setFormData(prev => ({ ...prev, expInYears: value }))}
                      allowCustom={true}
                      allowClear={true}
                    />
                  </div>
                </div>

                {/* Job Type, Schedule, Industry - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-type">Job Type *</Label>
                    <Input
                      id="edit-job-type"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      placeholder="e.g., Full-time, Part-time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-job-schedule">Schedule *</Label>
                    <Input
                      id="edit-job-schedule"
                      value={formData.schedule}
                      onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                      placeholder="e.g., Monday to Friday"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="edit-job-industry">Industry *</Label>
                    <Input
                      id="edit-job-industry"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Software Development"
                    />
                  </div>
                </div>

                {/* Salary, Vacancies, Status, Working Hours - Flexible layout */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label htmlFor="edit-job-salary">Salary *</Label>
                    <Input
                      id="edit-job-salary"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                      placeholder="e.g., $50,000 - $80,000"
                    />
                  </div>

                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label htmlFor="edit-job-vacancies">Vacancies *</Label>
                    <Input
                      id="edit-job-vacancies"
                      type="number"
                      min="1"
                      value={formData.vacancies}
                      onChange={(e) => setFormData(prev => ({ ...prev, vacancies: parseInt(e.target.value) || 1 }))}
                      placeholder="Number of positions"
                    />
                  </div>

                  <div className="w-auto space-y-2">
                    <Label htmlFor="edit-job-status">Status</Label>
                    <Select
                      value={formData.publishStatus}
                      onValueChange={(value: "open" | "close") => setFormData(prev => ({ ...prev, publishStatus: value }))}
                    >
                      <SelectTrigger className="min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="close">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label htmlFor="edit-job-time">Working Hours *</Label>
                    <Input
                      id="edit-job-time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      placeholder="e.g., 9:00 AM - 5:00 PM"
                    />
                  </div>
                </div>

                {/* Description and Requirements - Full width sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Enhanced Job Description Input for Edit */}
                  <div className="space-y-2">
                    <Label>Job Description *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add description point (press Enter to add)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = (e.target as HTMLInputElement).value;
                              if (value.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  description: [...prev.description, value.trim()]
                                }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                            if (input?.value.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                description: [...prev.description, input.value.trim()]
                              }));
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {formData.description.map((point, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded text-sm border-l-4 border-blue-500">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  Point {index + 1}
                                </span>
                              </div>
                              <span className="text-sm">{point}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromArray('description', index)}
                              className="hover:text-red-500 mt-0.5 p-1 hover:bg-red-50 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {formData.description.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No description points added yet. Add points above.
                          </div>
                        )}
                      </div>
                      {formData.description.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formData.description.length} point{formData.description.length !== 1 ? 's' : ''} added
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Job Requirements Input for Edit */}
                  <div className="space-y-2">
                    <Label>Job Requirements *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add requirement point (press Enter to add)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = (e.target as HTMLInputElement).value;
                              if (value.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  requirements: [...prev.requirements, value.trim()]
                                }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                            if (input?.value.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                requirements: [...prev.requirements, input.value.trim()]
                              }));
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {formData.requirements.map((point, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded text-sm border-l-4 border-green-500">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                  Req {index + 1}
                                </span>
                              </div>
                              <span className="text-sm">{point}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromArray('requirements', index)}
                              className="hover:text-red-500 mt-0.5 p-1 hover:bg-red-50 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {formData.requirements.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No requirement points added yet. Add points above.
                          </div>
                        )}
                      </div>
                      {formData.requirements.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formData.requirements.length} requirement{formData.requirements.length !== 1 ? 's' : ''} added
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills and Position - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ArrayFieldWithAutocomplete
                    field="primarySkills"
                    label="Primary Skills"
                    placeholder="Add primary skill"
                    values={formData.primarySkills}
                    onAdd={(value) => addToArray('primarySkills', value)}
                    onRemove={(index) => removeFromArray('primarySkills', index)}
                    variant="default"
                    required={true}
                  />

                  <ArrayFieldWithAutocomplete
                    field="secondarySkills"
                    label="Secondary Skills"
                    placeholder="Add secondary skill"
                    values={formData.secondarySkills}
                    onAdd={(value) => addToArray('secondarySkills', value)}
                    onRemove={(index) => removeFromArray('secondarySkills', index)}
                    variant="secondary"
                  />

                  <div className="md:col-span-2 lg:col-span-1">
                    <ArrayFieldWithAutocomplete
                      field="position"
                      label="Position Types"
                      placeholder="Add position type"
                      values={formData.position}
                      onAdd={(value) => addToArray('position', value)}
                      onRemove={(index) => removeFromArray('position', index)}
                      variant="outline"
                      required={true}
                    />
                  </div>
                </div>

                {/* Tags, Custom Questions, Grading Parameters - 3 columns responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ArrayFieldWithAutocomplete
                    field="tags"
                    label="Tags"
                    placeholder="Add tag"
                    values={formData.tags}
                    onAdd={(value) => addToArray('tags', value)}
                    onRemove={(index) => removeFromArray('tags', index)}
                    variant="secondary"
                    icon={<Tag className="h-2 w-2" />}
                  />

                  <div className="space-y-2">
                    <Label>Custom Questions</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add custom question"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('customQuestions', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                            if (input?.value.trim()) {
                              addToArray('customQuestions', input.value);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {formData.customQuestions.map((question, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                            <span className="text-xs flex-1">{question}</span>
                            <button
                              type="button"
                              onClick={() => removeFromArray('customQuestions', index)}
                              className="hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-1">
                    <ArrayFieldWithAutocomplete
                      field="gradingParameters"
                      label="Grading Parameters"
                      placeholder="Add grading parameter"
                      values={formData.gradingParameters}
                      onAdd={(value) => addToArray('gradingParameters', value)}
                      onRemove={(index) => removeFromArray('gradingParameters', index)}
                      variant="outline"
                      icon={<Award className="h-2 w-2" />}
                    />
                  </div>
                </div>

                {/* Note - Full width */}
                <div className="space-y-2">
                  <Label htmlFor="edit-job-note">Additional Notes</Label>
                  <Textarea
                    id="edit-job-note"
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Any additional notes or information"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isEditing}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditJob} 
                disabled={isEditing} 
                className="w-full sm:w-auto order-1 sm:order-2"
              >
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



        {/* View Job Dialog - Fully Responsive */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl md:max-w-[85vw] lg:max-w-[90vw] xl:max-w-[95vw] w-full h-[90vh] flex flex-col">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="truncate">{viewingJob?.title}</span>
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Detailed job information
              </DialogDescription>
            </DialogHeader>
            
            {viewingJob && (
              <div className="overflow-y-auto flex-1 p-1">
                <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                  {/* Job Status and Basic Info - Responsive badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge 
                      variant={viewingJob.publishStatus === "open" ? "default" : "destructive"} 
                      className="text-xs sm:text-sm"
                    >
                      {viewingJob.publishStatus.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{viewingJob.location}</span>
                      <span className="sm:hidden">{viewingJob.location.split(',')[0]}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      <DollarSign className="h-3 w-3 mr-1" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{viewingJob.salary}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      <Users className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{viewingJob.vacancies} positions</span>
                      <span className="sm:hidden">{viewingJob.vacancies}</span>
                    </Badge>
                  </div>

                  {/* Job Details Grid - Responsive columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4 lg:col-span-1">
                      <div className="bg-card rounded-lg border p-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          BASIC INFORMATION
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="font-medium text-muted-foreground">Category:</span>
                            <span className="text-foreground">{viewingJob.category}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="font-medium text-muted-foreground">Industry:</span>
                            <span className="text-foreground">{viewingJob.industry}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="font-medium text-muted-foreground">Type:</span>
                            <span className="text-foreground">{viewingJob.type}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="font-medium text-muted-foreground">Schedule:</span>
                            <span className="text-foreground">{viewingJob.schedule}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card rounded-lg border p-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          LOCATION & TIMING
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="font-medium text-muted-foreground">Country:</span>
                            <span className="text-foreground">{viewingJob.country}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="font-medium text-muted-foreground">Working Hours:</span>
                            <span className="text-foreground">{viewingJob.time}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="font-medium text-muted-foreground">Experience:</span>
                            <span className="text-foreground">{viewingJob.expInYears}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="space-y-4 lg:col-span-1">
                      {/* Primary Skills */}
                      {viewingJob.primarySkills?.length > 0 && (
                        <div className="bg-card rounded-lg border p-4">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3">PRIMARY SKILLS</h4>
                          <div className="flex flex-wrap gap-1">
                            {viewingJob.primarySkills.map((skill, index) => (
                              <Badge key={index} variant="default" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Secondary Skills */}
                      {viewingJob.secondarySkills?.length > 0 && (
                        <div className="bg-card rounded-lg border p-4">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3">SECONDARY SKILLS</h4>
                          <div className="flex flex-wrap gap-1">
                            {viewingJob.secondarySkills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Position Types */}
                      {viewingJob.position?.length > 0 && (
                        <div className="bg-card rounded-lg border p-4">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3">POSITION TYPES</h4>
                          <div className="flex flex-wrap gap-1">
                            {viewingJob.position.map((pos, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {pos}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Info - Tags, Grading etc. */}
                    <div className="space-y-4 lg:col-span-2 xl:col-span-1">
                      {/* Tags */}
                      {viewingJob.tags?.length > 0 && (
                        <div className="bg-card rounded-lg border p-4">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            TAGS
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {viewingJob.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grading Parameters */}
                      {viewingJob.gradingParameters?.length > 0 && (
                        <div className="bg-card rounded-lg border p-4">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            GRADING PARAMETERS
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {viewingJob.gradingParameters.map((param, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Award className="h-2 w-2 mr-1" />
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description and Requirements - Full width sections */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {/* Enhanced Description Display */}
                    <div className="bg-card rounded-lg border p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        JOB DESCRIPTION
                      </h4>
                      {(() => {
                        const descriptionPoints = parseFromHTML(viewingJob.description);
                        return descriptionPoints.length > 0 ? (
                          <div className="space-y-2">
                            {descriptionPoints.map((point, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded text-sm border-l-4 border-blue-500">
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded min-w-fit">
                                  {index + 1}
                                </span>
                                <span className="flex-1 leading-relaxed">{point}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                            No description available
                          </div>
                        );
                      })()}
                    </div>

                    {/* Enhanced Requirements Display */}
                    <div className="bg-card rounded-lg border p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        JOB REQUIREMENTS
                      </h4>
                      {(() => {
                        const requirementPoints = parseFromHTML(viewingJob.requirements);
                        return requirementPoints.length > 0 ? (
                          <div className="space-y-2">
                            {requirementPoints.map((point, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded text-sm border-l-4 border-green-500">
                                <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded min-w-fit">
                                  R{index + 1}
                                </span>
                                <span className="flex-1 leading-relaxed">{point}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                            No requirements specified
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Custom Questions - Full width if present */}
                  {viewingJob.customQuestions?.length > 0 && (
                    <div className="bg-card rounded-lg border p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">CUSTOM QUESTIONS</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {viewingJob.customQuestions.map((question, index) => (
                          <div key={index} className="p-3 bg-muted/50 rounded text-sm">
                            <span className="font-medium text-blue-600">Q{index + 1}:</span>{" "}
                            <span className="leading-relaxed">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Note */}
                  {viewingJob.note && (
                    <div className="bg-card rounded-lg border p-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">ADDITIONAL NOTES</h4>
                      <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap leading-relaxed">
                        {viewingJob.note}
                      </div>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="bg-card rounded-lg border p-4">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">METADATA</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-muted-foreground">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium">Created:</span>
                        <span className="text-foreground">{formatDate(viewingJob.createdAt)}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium">Last Updated:</span>
                        <span className="text-foreground">{formatDate(viewingJob.updatedAt)}</span>
                      </div>
                      <div className="flex flex-col space-y-1 sm:col-span-2 lg:col-span-1">
                        <span className="font-medium">Slug:</span>
                        <span className="text-foreground font-mono bg-muted/50 px-2 py-1 rounded text-xs break-all">
                          {viewingJob.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowViewDialog(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <DialogContent className="w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl h-auto max-h-[40vh] flex flex-col" >

            <DialogHeader>
              <DialogTitle>Delete Job</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{editingJob?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
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
                    Delete Job
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default JobManagement;
