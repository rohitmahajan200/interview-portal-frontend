import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  ChevronDown, 
  FileText, 
  Check, 
  Copy, 
  Eye 
} from 'lucide-react';

interface Document {
  _id: string;
  document_type: string;
  document_url: string;
  isVerified: boolean;
  uploaded_at?: string;
}

interface CandidateDocumentsCardProps {
  documents: Document[];
  hired_docs?: Document[];
  documentChecklist: Record<string, boolean>;
  savingChecklist: boolean;
  copiedDocId: string | null;
  onDocumentChecklistChange: (checklist: Record<string, boolean>) => void;
  onMarkVerified: () => void;
  onIndividualDocVerification: (doc: Document) => void;
  onCopyToClipboard: (url: string, docId: string, e: React.MouseEvent) => void;
  formatDate: (dateString: string) => string;
  defaultCollapsed?: boolean;
}

const CandidateDocumentsCard: React.FC<CandidateDocumentsCardProps> = ({
  documents,
  hired_docs = [],
  documentChecklist,
  savingChecklist,
  copiedDocId,
  onDocumentChecklistChange,
  onMarkVerified,
  onIndividualDocVerification,
  onCopyToClipboard,
  formatDate,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Combine all documents
  const allDocuments = [...documents, ...hired_docs];
  const verifiedCount = allDocuments.filter((doc) => doc.isVerified).length;
  const totalCount = allDocuments.length;

  // Handle select all documents
  const handleSelectAll = (checked: boolean) => {
    const allDocIds = allDocuments.map((doc) => doc._id);
    
    if (checked) {
      const newChecklist = { selectAll: true };
      allDocIds.forEach((id) => (newChecklist[id] = true));
      onDocumentChecklistChange(newChecklist);
    } else {
      onDocumentChecklistChange({ selectAll: false });
    }
  };

  // Handle individual document selection
  const handleDocumentSelection = (docId: string, checked: boolean) => {
    const newState: Record<string, boolean> = {
      ...documentChecklist,
      [docId]: checked,
      selectAll: false,
    };
    onDocumentChecklistChange(newState);
  };

  // Don't render if no documents
  if (totalCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Documents
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {verifiedCount} / {totalCount} Verified
            </Badge>
          </div>
          
          {/* Collapse Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="text-sm font-medium">
              {isCollapsed ? 'Show Documents' : 'Hide Documents'}
            </span>
            <div className={`transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </div>
      </CardHeader>
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <CardContent>
          {/* Bulk Actions */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={documentChecklist.selectAll || false}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm font-medium">
                Select All Documents
              </Label>
            </div>

            <Button
              onClick={onMarkVerified}
              disabled={
                savingChecklist ||
                Object.keys(documentChecklist).filter(
                  (key) => key !== "selectAll" && documentChecklist[key]
                ).length === 0
              }
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {savingChecklist ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Status...
                </>
              ) : (
                <>🔄 Toggle Selected Status</>
              )}
            </Button>
          </div>

          {/* Documents Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allDocuments.map((doc) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.document_url);
              const isPDF = /\.pdf$/i.test(doc.document_url);
              const pdfThumbUrl = isPDF
                ? doc.document_url
                    .replace("/upload/", "/upload/pg_1/")
                    .replace(/\.pdf$/i, ".jpg")
                : null;

              // Check if this is a hired document
              const isHiredDoc = hired_docs.some(
                (hiredDoc) => hiredDoc._id === doc._id
              );

              return (
                <div
                  key={doc._id}
                  className={`group relative border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${
                    doc.isVerified
                      ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  } ${
                    documentChecklist[doc._id] 
                      ? "ring-2 ring-blue-500 ring-offset-2" 
                      : ""
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3 z-20">
                    {doc.document_type !=="resume" && (
                    <Checkbox
                      checked={documentChecklist[doc._id] || false}
                      onCheckedChange={(checked) => 
                        handleDocumentSelection(doc._id, checked as boolean)
                      }
                      className="bg-white/90 shadow-sm"
                    />
            )}
                  </div>

                  {/* Document Type & Verification Status Badges */}
                  <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
                    { doc.document_type !== "resume" &&(
                    <Badge
                      className={`text-xs shadow-sm ${
                        doc.isVerified
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {doc.isVerified ? "✓ Verified" : "⏳ Pending"}
                    </Badge>)
            }
                  </div>

                  {/* Document Preview */}
                  <div 
                    className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => window.open(doc.document_url, "_blank")}
                  >
                    {isImage ? (
                      <img
                        src={doc.document_url}
                        alt={doc.document_type}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : isPDF ? (
                      <img
                        src={pdfThumbUrl!}
                        alt={`${doc.document_type} preview`}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/300x200?text=PDF+Preview+Not+Available";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <FileText className="w-12 h-12 mb-2" />
                        <span className="text-xs text-center px-2 font-medium">
                          {doc.document_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Document Info & Actions */}
                  <div className="p-4 space-y-3">
                    {/* Document Title */}
                    <div>
                      <h4 className="text-sm font-semibold capitalize truncate mb-1">
                        {doc.document_type}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.uploaded_at
                          ? `Uploaded: ${formatDate(doc.uploaded_at)}`
                          : "Click to view"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {(
                    <div className="flex flex-col gap-2">
                      {/* Primary Action - Verify/Unverify */}
                      {doc.document_type !=="resume" &&
                      <Button
                        size="sm"
                        variant={doc.isVerified ? "destructive" : "default"}
                        onClick={() => onIndividualDocVerification(doc)}
                        disabled={savingChecklist}
                        className={`w-full ${
                          doc.isVerified
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {savingChecklist ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            {doc.isVerified ? "❌ Unverify" : "✅ Verify"}
                          </>
                        )}
                      </Button>}

                      {/* Secondary Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => onCopyToClipboard(doc.document_url, doc._id, e)}
                          title="Copy document link"
                          className="flex-1"
                        >
                          {copiedDocId === doc._id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.document_url, "_blank")}
                          title="View document"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>)
            }

                    {/* Document Details */}
                    { doc.document_type !=="resume" && (
                    <div className="pt-2 border-t text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={doc.isVerified ? "text-green-600" : "text-yellow-600"}>
                          {doc.isVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <div className="truncate">
                        <span>Type: </span>
                        <span className="font-medium">{doc.document_type}</span>
                      </div>
                    </div>)}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {totalCount === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No documents found</p>
              <p className="text-gray-400 text-sm">
                Documents will appear here once uploaded by the candidate.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CandidateDocumentsCard;
