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
import { Upload, CheckCircle2, X, Loader2, FileText } from "lucide-react";
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
}

interface UploadedDocument {
  document_type: string;
  document_url: string;
  public_id: string;
  file_name: string;
}

const REQUIRED_DOCUMENTS: DocumentType[] = [
  {
    key: "graduation_certificate",
    label: "Graduation Certificate",
    required: true,
    description: "Your degree/diploma certificate",
  },
  {
    key: "course_certificate",
    label: "Course Certificate",
    required: false,
    description: "Any additional course certificates (if applicable)",
  },
  {
    key: "experience_letter",
    label: "Experience Letter",
    required: false,
    description: "Previous employment experience letter (if applicable)",
  },
  {
    key: "appointment_letter",
    label: "Previous Appointment Letter",
    required: false,
    description: "Letter of appointment from previous employer (if applicable)",
  },
  {
    key: "relieving_letter",
    label: "Relieving Letter",
    required: false,
    description: "Relieving letter from previous employer (if applicable)",
  },
  {
    key: "salary_slip_1",
    label: "Salary Slip (Latest Month)",
    required: false,
    description: "Most recent salary slip (if applicable)",
  },
  {
    key: "salary_slip_2",
    label: "Salary Slip (Previous Month)",
    required: false,
    description: "Second most recent salary slip (if applicable)",
  },
  {
    key: "aadhar_card",
    label: "Aadhar Card",
    required: true,
    description: "Government issued Aadhar card",
  },
  {
    key: "bank_passbook",
    label: "Bank Passbook/Statement",
    required: true,
    description: "Bank account details or statement",
  },
  {
    key: "uan_passbook",
    label: "UAN Passbook",
    required: false,
    description: "Universal Account Number passbook (if available)",
  },
  {
    key: "passport_photo",
    label: "Passport Size Photo",
    required: true,
    description: "Recent passport size photograph",
  },
];

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

      // **FIX: Ensure all required fields are present and properly formatted**
      const uploadedDoc: UploadedDocument = {
        document_type: documentKey,
        document_url: result.url, // Make sure this is the correct field from uploadToCloudinary
        public_id: result.publicId, // Make sure this matches the field name from uploadToCloudinary
        file_name: file.name,
      };

      // **DEBUGGING: Log the document structure**
      console.log("Uploading document:", uploadedDoc);

      setUploadedDocuments((prev) => ({
        ...prev,
        [documentKey]: uploadedDoc,
      }));

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

    setUploadedDocuments((prev) => {
      const newDocs = { ...prev };
      delete newDocs[documentKey];
      return newDocs;
    });

    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[documentKey];
      return newProgress;
    });

    toast.success("File removed");
  };

  const validateFiles = (): boolean => {
    const newErrors: Record<string, string> = {};

    REQUIRED_DOCUMENTS.forEach((doc) => {
      if (doc.required && !uploadedDocuments[doc.key]) {
        newErrors[doc.key] = `${doc.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFiles()) {
      toast.error("Please upload all required documents");
      return;
    }

    if (Object.values(uploadingStates).some((state) => state)) {
      toast.error("Please wait for all uploads to complete");
      return;
    }

    setIsSubmitting(true);

    try {
      // **FIX: Prepare the documents array with proper validation**
      const documents = Object.values(uploadedDocuments).map(doc => ({
        document_type: doc.document_type,
        document_url: doc.document_url,
        public_id: doc.public_id,
        file_name: doc.file_name, // This field is optional but included
      }));

      // **DEBUGGING: Log the payload before sending**
      console.log("Sending documents payload:", { documents });

      // **FIX: Validate each document has required fields before sending**
      const invalidDocs = documents.filter(doc => 
        !doc.document_type || !doc.document_url || !doc.public_id
      );

      if (invalidDocs.length > 0) {
        console.error("Invalid documents found:", invalidDocs);
        toast.error("Some documents are missing required information. Please try re-uploading.");
        setIsSubmitting(false);
        return;
      }

      const response = await api.post(
        `/candidates/${candidateId}/hired_docs`,
          {documents},
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(
          "All documents submitted successfully! Welcome to the team! 🎉"
        );
        onSubmissionComplete();
      }
    } catch (error: any) {
      console.error("Error submitting documents:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error?.response?.data?.message ||
          "Failed to submit documents. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent
        className="p-4 w-screen sm:w-[95vw] max-w-none sm:max-w-[95vw] h-screen sm:h-[95vh] overflow-y-auto"
        onEscapeKeyDown={(e) => {
          const hasUploadsInProgress = Object.values(uploadingStates).some((state) => state);
          if (hasUploadsInProgress) {
            e.preventDefault();
            toast.error("Please wait for all uploads to complete before closing.");
          }
        }}
        onPointerDownOutside={(e) => {
          const hasUploadsInProgress = Object.values(uploadingStates).some((state) => state);
          if (hasUploadsInProgress) {
            e.preventDefault();
            toast.error("Please wait for all uploads to complete before closing.");
          }
        }}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <DialogTitle className="text-3xl font-bold text-green-600">
            Congratulations! Welcome to Our Team!
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-700">
            You have been successfully hired! To complete your onboarding
            process, please upload the following documents. All required
            documents must be submitted.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {REQUIRED_DOCUMENTS.map((doc) => (
              <Card
                key={doc.key}
                className={`border-2 ${
                  doc.required ? "border-red-200" : "border-gray-200"
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {doc.label}
                    {doc.required && <span className="text-red-500">*</span>}
                  </CardTitle>
                  {doc.description && (
                    <CardDescription className="text-sm text-gray-600">
                      {doc.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {!uploadedFiles[doc.key] ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
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
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">
                          PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                        </span>
                      </Label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {uploadingStates[doc.key] ? (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-700">
                              Uploading {uploadedFiles[doc.key]?.name}
                            </p>
                            <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${uploadProgress[doc.key] || 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : uploadedDocuments[doc.key] ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-700">
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
                            <X className="w-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                          <X className="w-5 h-5 text-red-600" />
                          <p className="text-sm text-red-700">
                            Upload failed. Please try again.
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(doc.key)}
                          >
                            <X className="w-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {errors[doc.key] && (
                    <p className="text-red-500 text-sm">{errors[doc.key]}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Important Instructions:
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>
                      All files must be in PDF, JPG, PNG, DOC, or DOCX format
                    </li>
                    <li>Maximum file size: 10MB per file</li>
                    <li>
                      Documents marked with * are mandatory and must be
                      uploaded
                    </li>
                    <li>Ensure all documents are clear and readable</li>
                    <li>
                      You can close this dialog, but remember to submit your documents later
                    </li>
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
