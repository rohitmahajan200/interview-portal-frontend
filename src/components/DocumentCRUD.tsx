// Updated DocumentCRUD.tsx
import { useAppSelector } from '@/hooks/useAuth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setUser } from '@/features/Candidate/auth/authSlice';
import { Input } from '@/components/ui/input';
import toast from "react-hot-toast";
import api from '@/lib/api';
import { useDispatch } from 'react-redux';

// 🆕 ADDED: Error type for better error handling
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function DocumentCRUD() {
  // 🆕 FIXED: Remove type casting to avoid conflicts
  const user = useAppSelector((state) => state.auth.user);
  const documents = user?.documents || [];
  
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [documentType, setDocumentType] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // Better error handling and type safety
  const refreshUser = async (): Promise<void> => {
    try {
      const res = await api.get("/candidates/me");
      if (res.data?.user) {
        dispatch(setUser(res.data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      toast.error('Failed to refresh user data');
    }
  };

  // File validation helper
  const validateFile = (file: File, maxSizeMB: number = 20): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  // Document upload
  const handleUpload = async (): Promise<void> => {
    if (!selectedFile || !documentType.trim()) {
       toast.error('Type and file required');
       return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
       toast.error(validationError);
       return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documenttype', documentType);

      const response = await api.post('/candidates/documents', formData);

      if (response.data?.success) {
        toast.success('Document uploaded successfully!', { duration: 2000 });
        setDocumentType('');
        setSelectedFile(null);
        setFileInputKey(prev => prev + 1);
        await refreshUser();
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (err: unknown) {
      console.error("Doc upload fail=>", err);
      const error = err as ApiError;
      const errorMessage = error?.response?.data?.message || error?.message || 'Upload failed';
      toast.error(errorMessage, { duration: 2000 });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (id: string): Promise<void> => {
    if (!editingType.trim()) {
       toast.error('Document type cannot be empty');
       return;
    }

    try {
      const response = await api.put(`/candidates/documents/${id}`, { 
        documenttype: editingType
      });

      if (response.data?.success) {
        toast.success('Updated', { duration: 1000 });
        setEditingId(null);
        setEditingType('');
        await refreshUser();
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error?.response?.data?.message || error?.message || 'Update failed';
      toast.error(errorMessage, { duration: 1000 });
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await api.delete(`/candidates/documents/${id}`);
      
      if (response.data?.success !== false) {
        toast.success('Deleted', { duration: 1000 });
        await refreshUser();
      } else {
        throw new Error(response.data?.message || 'Delete failed');
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error?.response?.data?.message || error?.message || 'Delete failed';
      toast.error(errorMessage, { duration: 1000 });
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown size';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // 🆕 FIXED: Helper to safely check if document has isVerified property
  const getDocumentStatus = (doc: any): string => {
    // Check if isVerified property exists and is boolean
    if (typeof doc.isVerified === 'boolean') {
      return doc.isVerified ? '✅ Verified' : '⏳ Pending';
    }
    // Fallback for documents without isVerified property
    return '⏳ Pending';
  };

  return (
    <div className="max-w-md md:max-w-2xl p-2 md:p-4 space-y-2 text-foreground bg-background m-10">
      <div className="grid gap-4">
        {/* Document Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <Input
              placeholder="Document Type (e.g., resume, certificate)"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={uploading}
            />
            <Input
              key={fileInputKey}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
            {selectedFile && (
              <div className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || !documentType.trim() || uploading}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>My Documents ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No documents uploaded yet
              </div>
            ) : (
              documents.map((doc: any) => (
                <Card key={doc._id} className="border border-gray-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="text-sm space-y-1">
                      <div><strong>Type:</strong> {doc.documenttype}</div>
                      {doc.filename && <div><strong>File:</strong> {doc.filename}</div>}
                      {doc.mimetype && <div><strong>Format:</strong> {doc.mimetype}</div>}
                      {doc.size && <div><strong>Size:</strong> {formatFileSize(doc.size)}</div>}
                      <div><strong>Status:</strong> {getDocumentStatus(doc)}</div>
                      <a 
                        href={doc.documenturl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 underline hover:text-blue-700 inline-block"
                      >
                        View Document
                      </a>
                    </div>
                    
                    {editingId === doc._id ? (
                      <div className="flex gap-2 items-center flex-wrap">
                        <Input
                          value={editingType}
                          onChange={(e) => setEditingType(e.target.value)}
                          placeholder="Enter document type"
                          className="flex-1 min-w-[200px]"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleUpdate(doc._id)}
                            disabled={!editingType.trim()}
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setEditingId(null);
                              setEditingType('');
                            }}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold">{doc.documenttype}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(doc._id);
                              setEditingType(doc.documenttype);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
