import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, X, Loader2, FileText, Download, GraduationCap, Building, CreditCard, Users, Camera, IndianRupee, Share2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/clodinary";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface DocumentUploadFormProps {
  candidateId: string;
  onSubmissionComplete: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

interface DocumentType {
  key: string;
  label: string;
  required: boolean;
  description?: string;
  hasTemplate?: boolean;
}

interface UploadedDocument {
  document_type: string;
  document_url: string;
  public_id: string;
  file_name: string;
}

interface CompanyReference {
  company_name: string;
  email: string;
  phone: string;
}

interface Organization {
  name: string;
  appointment_letter?: string; // Store document URL
  relieving_letter?: string;   // Store document URL
}

// Educational Documents Section
const EDUCATIONAL_DOCUMENTS: DocumentType[] = [
  {
    key: "ssc_certificate",
    label: "SSC Certificate",
    required: true,
    description: "Secondary School Certificate (10th standard)",
    hasTemplate: false,
  },
  {
    key: "hsc_certificate",
    label: "HSC Certificate",
    required: true,
    description: "Higher Secondary Certificate (12th standard)",
    hasTemplate: false,
  },
  {
    key: "graduation_certificate",
    label: "Bachelor's Degree Certificate",
    required: true,
    description: "BSc/BA/BCom or equivalent degree certificate",
    hasTemplate: false,
  },
  {
    key: "post_graduation_certificate",
    label: "Master's Degree Certificate",
    required: false,
    description: "MSc/MA/MCom or equivalent degree certificate (if applicable)",
    hasTemplate: false,
  },
  {
    key: "other_certificates",
    label: "Other Professional Certificates",
    required: false,
    description: "Additional courses, certifications, or diplomas",
    hasTemplate: false,
  },
];

// Organization Documents Section
const ORGANIZATION_DOCUMENTS: DocumentType[] = [
  {
    key: "current_relieving_letter",
    label: "Current Company Relieving Letter",
    required: false,
    description: "Relieving letter from your current/last company",
    hasTemplate: true,
  },
];

// Salary Documents Section
const SALARY_DOCUMENTS: DocumentType[] = [
  {
    key: "salary_slip_1",
    label: "Latest Month Salary Slip",
    required: false,
    description: "Most recent salary slip",
    hasTemplate: true,
  },
  {
    key: "salary_slip_2",
    label: "Previous Month Salary Slip",
    required: false,
    description: "Second most recent salary slip",
    hasTemplate: true,
  },
  {
    key: "salary_slip_3",
    label: "Third Month Salary Slip",
    required: false,
    description: "Third most recent salary slip",
    hasTemplate: true,
  },
  {
    key: "form_16",
    label: "Form 16 (Alternative)",
    required: false,
    description: "Form 16 can be uploaded instead of salary slips",
    hasTemplate: true,
  },
];

// Identity Documents Section
const IDENTITY_DOCUMENTS: DocumentType[] = [
  {
    key: "aadhar_card",
    label: "Aadhar Card",
    required: true,
    description: "Government issued Aadhar card",
    hasTemplate: false,
  },
  {
    key: "pan_card",
    label: "PAN Card",
    required: false,
    description: "Permanent Account Number card",
    hasTemplate: false,
  },
  {
    key: "address_proof",
    label: "Address Proof",
    required: false,
    description: "Required if current address differs from Aadhar card",
    hasTemplate: false,
  },
];

// Photo Section
const PHOTO_DOCUMENTS: DocumentType[] = [
  {
    key: "passport_photo",
    label: "Latest Passport Size Photo",
    required: true,
    description: "Recent passport size color photograph",
    hasTemplate: false,
  },
];

// Social media handles for background verification
const SOCIAL_MEDIA_HANDLES = [
  { key: "linkedin", label: "LinkedIn", required: false },
  { key: "facebook", label: "Facebook", required: false },
  { key: "instagram", label: "Instagram", required: false },
  { key: "youtube", label: "YouTube", required: false },
  { key: "twitter", label: "Twitter", required: false },
  { key: "other", label: "Any Other", required: false },
];

// Sample document templates for download
const DOWNLOAD_TEMPLATES: Record<string, { url: string; filename: string }> = {
  current_relieving_letter: {
    url: "/templates/relieving_letter_sample.pdf",
    filename: "Relieving-Letter-Sample.pdf"
  },
  appointment_letter: {
    url: "/templates/appointment_letter_sample.pdf",
    filename: "Appointment-Letter-Sample.pdf"
  },
  salary_slip_1: {
    url: "/templates/salary_slip_sample.pdf",
    filename: "Salary-Slip-Sample.pdf"
  },
  salary_slip_2: {
    url: "/templates/salary_slip_sample.pdf",
    filename: "Salary-Slip-Sample.pdf"
  },
  salary_slip_3: {
    url: "/templates/salary_slip_sample.pdf",
    filename: "Salary-Slip-Sample.pdf"
  },
  form_16: {
    url: "/templates/form_16_sample.pdf",
    filename: "Form-16-Sample.pdf"
  },
};

// Helper function to trigger file download
const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  candidateId,
  onSubmissionComplete,
  isOpen,
  onClose,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const [uploadingStates, setUploadingStates] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Organization data - Updated structure
  const [organizations, setOrganizations] = useState<Organization[]>([{ name: '' }]);

  // Company references
  const [companyReferences, setCompanyReferences] = useState<CompanyReference[]>([
    { company_name: '', email: '', phone: '' },
    { company_name: '', email: '', phone: '' }
  ]);

  // Social media handles
  const [socialMediaHandles, setSocialMediaHandles] = useState<Record<string, string>>({});

  const handleDialogClose = (open: boolean) => {
    if (!open && onClose) {
      const hasUploadsInProgress = Object.values(uploadingStates).some((state) => state);
      const hasUploadedDocuments = Object.keys(uploadedDocuments).length > 0;
      
      if (hasUploadsInProgress) {
        toast.error("Please wait for all uploads to complete before closing.");
        return;
      }
      
      if (hasUploadedDocuments) {
        const confirmClose = window.confirm(
          "You have uploaded documents but haven't submitted them yet. Are you sure you want to close?"
        );
        if (!confirmClose) return;
      }
      
      onClose();
    }
  };

  const handleFileChange = (documentKey: string, file: File | null) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload PDF, JPG, PNG, DOC, or DOCX files only");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedFiles((prev) => ({
      ...prev,
      [documentKey]: file,
    }));

    if (errors[documentKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[documentKey];
        return newErrors;
      });
    }

    uploadFile(documentKey, file);
  };

  const uploadFile = async (documentKey: string, file: File) => {
    setUploadingStates((prev) => ({ ...prev, [documentKey]: true }));
    setUploadProgress((prev) => ({ ...prev, [documentKey]: 0 }));

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [documentKey]: Math.min((prev[documentKey] || 0) + 15, 90),
        }));
      }, 300);

      const result = await uploadToCloudinary(file, "documents");

      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [documentKey]: 100 }));

      const uploadedDoc: UploadedDocument = {
        document_type: documentKey,
        document_url: result.url,
        public_id: result.publicId,
        file_name: file.name,
      };

      // Handle organization documents differently
      if (documentKey.startsWith('org_')) {
        const parts = documentKey.split('_');
        const orgIndex = parseInt(parts[1]);
        const docType = parts[2]; // 'appointment' or 'relieving'
        
        // Update the organizations array with the document URL
        setOrganizations(prev => {
          const newOrgs = [...prev];
          if (docType === 'appointment') {
            newOrgs[orgIndex].appointment_letter = result.url;
          } else if (docType === 'relieving') {
            newOrgs[orgIndex].relieving_letter = result.url;
          }
          return newOrgs;
        });
      } else {
        // Handle regular documents
        setUploadedDocuments((prev) => ({
          ...prev,
          [documentKey]: uploadedDoc,
        }));
      }

      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${file.name}`);

      setUploadedFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[documentKey];
        return newFiles;
      });
    } finally {
      setUploadingStates((prev) => ({ ...prev, [documentKey]: false }));
    }
  };

  const removeFile = (documentKey: string) => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[documentKey];
      return newFiles;
    });

    if (documentKey.startsWith('org_')) {
      const parts = documentKey.split('_');
      const orgIndex = parseInt(parts[1]);
      const docType = parts[2];
      
      // Remove the document URL from organizations
      setOrganizations(prev => {
        const newOrgs = [...prev];
        if (docType === 'appointment') {
          delete newOrgs[orgIndex].appointment_letter;
        } else if (docType === 'relieving') {
          delete newOrgs[orgIndex].relieving_letter;
        }
        return newOrgs;
      });
    } else {
      setUploadedDocuments((prev) => {
        const newDocs = { ...prev };
        delete newDocs[documentKey];
        return newDocs;
      });
    }

    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[documentKey];
      return newProgress;
    });

    toast.success("File removed");
  };

  const addOrganization = () => {
    setOrganizations([...organizations, { name: '' }]);
  };

  const removeOrganization = (index: number) => {
    if (organizations.length > 1) {
      const newOrgs = organizations.filter((_, i) => i !== index);
      setOrganizations(newOrgs);
      
      // Clean up any uploaded files for this organization
      Object.keys(uploadedFiles).forEach(key => {
        if (key.startsWith(`org_${index}_`)) {
          removeFile(key);
        }
      });
    }
  };

  const updateOrganizationName = (index: number, name: string) => {
    const newOrgs = [...organizations];
    newOrgs[index].name = name;
    setOrganizations(newOrgs);
  };

  const updateCompanyReference = (index: number, field: keyof CompanyReference, value: string) => {
    const newRefs = [...companyReferences];
    newRefs[index][field] = value;
    setCompanyReferences(newRefs);
  };

  const handleSocialMediaChange = (platform: string, handle: string) => {
    setSocialMediaHandles((prev) => ({
      ...prev,
      [platform]: handle,
    }));
  };

  const validateFiles = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate educational documents
    EDUCATIONAL_DOCUMENTS.forEach((doc) => {
      if (doc.required && !uploadedDocuments[doc.key]) {
        newErrors[doc.key] = `${doc.label} is required`;
      }
    });

    // Validate organization documents
    ORGANIZATION_DOCUMENTS.forEach((doc) => {
      if (doc.required && !uploadedDocuments[doc.key]) {
        newErrors[doc.key] = `${doc.label} is required`;
      }
    });

    // Validate salary documents (at least salary slips or form 16)
    const hasSalarySlips = SALARY_DOCUMENTS.slice(0, 3).every(doc => uploadedDocuments[doc.key]);
    const hasForm16 = uploadedDocuments['form_16'];
    
    if (!hasSalarySlips && !hasForm16) {
      newErrors['salary_documents'] = 'Either upload all 3 salary slips or Form 16';
    }

    // Validate identity documents
    IDENTITY_DOCUMENTS.forEach((doc) => {
      if (doc.required && !uploadedDocuments[doc.key]) {
        newErrors[doc.key] = `${doc.label} is required`;
      }
    });

    // Validate photo
    PHOTO_DOCUMENTS.forEach((doc) => {
      if (doc.required && !uploadedDocuments[doc.key]) {
        newErrors[doc.key] = `${doc.label} is required`;
      }
    });

    // Validate organizations
    organizations.forEach((org, index) => {
      if (org.name.trim() && (!org.appointment_letter && !org.relieving_letter)) {
        newErrors[`org_${index}`] = `Organization ${index + 1}: At least one document (appointment or relieving letter) is required`;
      }
    });

    // Validate company references
    companyReferences.forEach((ref, index) => {
      if (!ref.company_name || !ref.email || !ref.phone) {
        newErrors[`reference_${index}`] = `Company reference ${index + 1} is incomplete`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFiles()) {
      toast.error("Please complete all required fields and upload all required documents");
      return;
    }

    if (Object.values(uploadingStates).some((state) => state)) {
      toast.error("Please wait for all uploads to complete");
      return;
    }

    setIsSubmitting(true);

    try {
      // Only send regular documents (not organization documents)
      const documents = Object.values(uploadedDocuments).map(doc => ({
        document_type: doc.document_type,
        document_url: doc.document_url,
        public_id: doc.public_id,
        file_name: doc.file_name,
      }));

      // Filter organizations with names and clean up the data
      const validOrganizations = organizations
        .filter(org => org.name.trim())
        .map(org => ({
          name: org.name.trim(),
          appointment_letter: org.appointment_letter || null,
          relieving_letter: org.relieving_letter || null
        }));

      const payload = {
        documents, // Only regular documents
        organizations: validOrganizations,
        company_references: companyReferences.filter(ref => 
          ref.company_name.trim() && ref.email.trim() && ref.phone.trim()
        ),
        social_media_handles: Object.fromEntries(
          Object.entries(socialMediaHandles).filter(([key, value]) => value.trim())
        )
      };

      console.log("Submitting payload:", payload); // Debug log

      const response = await api.post(
        `/candidates/${candidateId}/hired_docs`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          "All documents submitted successfully! Welcome to the team! 🎉"
        );
        onSubmissionComplete();
      }
    } catch (error: any) {
      console.error("Error submitting documents:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to submit documents. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentSection = (documents: DocumentType[], title: string, icon: React.ReactNode, bgColor: string) => (
    <Card className={`${bgColor} border-2`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Card key={doc.key} className="bg-white border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {doc.label}
                      {doc.required && <span className="text-red-500">*</span>}
                    </CardTitle>
                    {doc.description && (
                      <CardDescription className="text-xs text-gray-600 mt-1">
                        {doc.description}
                      </CardDescription>
                    )}
                  </div>

                  {doc.hasTemplate && DOWNLOAD_TEMPLATES[doc.key] && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        triggerDownload(
                          DOWNLOAD_TEMPLATES[doc.key].url,
                          DOWNLOAD_TEMPLATES[doc.key].filename
                        )
                      }
                      className="whitespace-nowrap flex items-center gap-1"
                      title="Download sample/template"
                    >
                      <Download className="w-3 h-3" />
                      Sample
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!uploadedFiles[doc.key] ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) =>
                        handleFileChange(
                          doc.key,
                          e.target.files?.[0] || null
                        )
                      }
                      className="hidden"
                      id={`file-${doc.key}`}
                      disabled={uploadingStates[doc.key] || isSubmitting}
                    />
                    <Label
                      htmlFor={`file-${doc.key}`}
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Click to upload
                      </span>
                      <span className="text-xs text-gray-500">
                        PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                      </span>
                    </Label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadingStates[doc.key] ? (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-700">
                            Uploading...
                          </p>
                          <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{
                                width: `${uploadProgress[doc.key] || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : uploadedDocuments[doc.key] ? (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-green-700 truncate">
                            {uploadedFiles[doc.key]?.name}
                          </p>
                          <p className="text-xs text-green-600">
                            Uploaded successfully
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(doc.key)}
                          disabled={isSubmitting}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                        <X className="w-4 h-4 text-red-600" />
                        <p className="text-xs text-red-700">
                          Upload failed. Please try again.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(doc.key)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {errors[doc.key] && (
                  <p className="text-red-500 text-xs">{errors[doc.key]}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="p-4 w-screen sm:w-[95vw] max-w-none sm:max-w-[95vw] h-screen sm:h-[95vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <DialogTitle className="text-3xl font-bold text-green-600">
            Congratulations! Welcome to Our Team!
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-700">
            You have been successfully hired! To complete your onboarding process, 
            please upload the following documents organized by category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Educational Documents Section */}
          {renderDocumentSection(
            EDUCATIONAL_DOCUMENTS,
            "Educational Documents",
            <GraduationCap className="w-5 h-5" />,
            "bg-blue-50 border-blue-200"
          )}

          {/* Organization Documents Section */}
          <Card className="bg-green-50 border-green-200 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="w-5 h-5" />
                Organization Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Company Relieving Letter */}
              {renderDocumentSection(
                ORGANIZATION_DOCUMENTS,
                "",
                null,
                "bg-transparent border-0"
              )}

              {/* Previous Companies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Previous Organizations</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOrganization}
                    disabled={isSubmitting}
                  >
                    Add Organization
                  </Button>
                </div>
                
                {organizations.map((org, index) => (
                  <Card key={index} className="bg-white border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Organization {index + 1}
                        </CardTitle>
                        {organizations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOrganization(index)}
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor={`org-name-${index}`} className="text-sm">
                          Organization Name *
                        </Label>
                        <Input
                          id={`org-name-${index}`}
                          value={org.name}
                          onChange={(e) => updateOrganizationName(index, e.target.value)}
                          placeholder="Enter organization name"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Appointment Letter */}
                        <div className="space-y-2">
                          <Label className="text-sm">Appointment Letter</Label>
                          {!organizations[index]?.appointment_letter ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) =>
                                  handleFileChange(
                                    `org_${index}_appointment`,
                                    e.target.files?.[0] || null
                                  )
                                }
                                className="hidden"
                                id={`org-appointment-${index}`}
                                disabled={uploadingStates[`org_${index}_appointment`] || isSubmitting}
                              />
                              <Label
                                htmlFor={`org-appointment-${index}`}
                                className="cursor-pointer flex flex-col items-center gap-1"
                              >
                                <Upload className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  Upload Appointment Letter
                                </span>
                              </Label>
                            </div>
                          ) : (
                            <div className="p-2 bg-green-50 rounded-lg flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 flex-1 truncate">
                                {uploadedFiles[`org_${index}_appointment`]?.name || "Document uploaded"}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(`org_${index}_appointment`)}
                                disabled={isSubmitting}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Relieving Letter */}
                        <div className="space-y-2">
                          <Label className="text-sm">Relieving Letter</Label>
                          {!organizations[index]?.relieving_letter ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) =>
                                  handleFileChange(
                                    `org_${index}_relieving`,
                                    e.target.files?.[0] || null
                                  )
                                }
                                className="hidden"
                                id={`org-relieving-${index}`}
                                disabled={uploadingStates[`org_${index}_relieving`] || isSubmitting}
                              />
                              <Label
                                htmlFor={`org-relieving-${index}`}
                                className="cursor-pointer flex flex-col items-center gap-1"
                              >
                                <Upload className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  Upload Relieving Letter
                                </span>
                              </Label>
                            </div>
                          ) : (
                            <div className="p-2 bg-green-50 rounded-lg flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 flex-1 truncate">
                                {uploadedFiles[`org_${index}_relieving`]?.name || "Document uploaded"}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(`org_${index}_relieving`)}
                                disabled={isSubmitting}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Error display for organizations */}
                      {errors[`org_${index}`] && (
                        <p className="text-red-500 text-xs mt-2">{errors[`org_${index}`]}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Salary Documents Section */}
          {renderDocumentSection(
            SALARY_DOCUMENTS,
            "Salary Documents",
            <IndianRupee className="w-5 h-5" />,
            "bg-purple-50 border-purple-200"
          )}
          
          {errors['salary_documents'] && (
            <p className="text-red-500 text-sm ml-4">{errors['salary_documents']}</p>
          )}

          {/* Identity Document Section */}
          {renderDocumentSection(
            IDENTITY_DOCUMENTS,
            "Identity & Address Proof",
            <CreditCard className="w-5 h-5" />,
            "bg-orange-50 border-orange-200"
          )}

          {/* Company References Section */}
          <Card className="bg-yellow-50 border-yellow-200 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Last 2 Companies References
              </CardTitle>
              <CardDescription>
                Provide contact details for verification from your last 2 companies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyReferences.map((ref, index) => (
                <Card key={index} className="bg-white border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Company Reference {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm">Company Name *</Label>
                      <Input
                        value={ref.company_name}
                        onChange={(e) => updateCompanyReference(index, 'company_name', e.target.value)}
                        placeholder="Enter company name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Email ID *</Label>
                        <Input
                          type="email"
                          value={ref.email}
                          onChange={(e) => updateCompanyReference(index, 'email', e.target.value)}
                          placeholder="contact@company.com"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Phone/Landline *</Label>
                        <Input
                          value={ref.phone}
                          onChange={(e) => updateCompanyReference(index, 'phone', e.target.value)}
                          placeholder="Phone or landline number"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    {errors[`reference_${index}`] && (
                      <p className="text-red-500 text-xs">{errors[`reference_${index}`]}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Social Media Handles Section */}
          <Card className="bg-indigo-50 border-indigo-200 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="w-5 h-5" />
                Social Media Handles - Background Verification
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Please provide your social media handles. 
              
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SOCIAL_MEDIA_HANDLES.map((platform) => (
                  <div key={platform.key} className="space-y-2">
                    <Label htmlFor={platform.key} className="text-sm font-medium">
                      {platform.label}:
                    </Label>
                    <Input
                      id={platform.key}
                      type="text"
                      placeholder={`Enter your ${platform.label} handle/profile`}
                      value={socialMediaHandles[platform.key] || ""}
                      onChange={(e) => handleSocialMediaChange(platform.key, e.target.value)}
                      className="bg-white"
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo Section */}
          {renderDocumentSection(
            PHOTO_DOCUMENTS,
            "Passport Size Photo",
            <Camera className="w-5 h-5" />,
            "bg-pink-50 border-pink-200"
          )}

          {/* Instructions Card */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Important Instructions:
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>All files must be in PDF, JPG, PNG, DOC, or DOCX format</li>
                    <li>Maximum file size: 10MB per file</li>
                    <li>Documents marked with * are mandatory</li>
                    <li>For salary documents: Upload either all 3 salary slips OR Form 16</li>
                    <li>Social media handles are required for background verification</li>
                    <li>Ensure all documents are clear and readable</li>
                    <li>Use the "Sample" buttons to download template formats where available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                Object.values(uploadingStates).some((state) => state)
              }
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Documents...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit All Documents & Complete Onboarding
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadForm;
