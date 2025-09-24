import api from './api';

export interface FileUploadResult {
  success: boolean;
  data?: {
    id: string;
    url: string;
    filename: string;
    filepath: string;
    documenttype: string;
    isVerified: boolean;
  };
  message?: string;
}

export const uploadDocument = async (
  file: File, 
  documentType: string
): Promise<FileUploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documenttype', documentType);

    const response = await api.post('/candidates/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return {
      success: response.data.success,
      data: response.data.document ? {
        id: response.data.document.id || response.data.document._id,
        url: response.data.document.documenturl,
        filename: response.data.document.filename,
        filepath: response.data.document.filepath,
        documenttype: response.data.document.documenttype,
        isVerified: response.data.document.isVerified
      } : undefined,
      message: response.data.message
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Upload failed'
    };
  }
};

export const deleteDocument = async (documentId: string) => {
  return api.delete(`/candidates/documents/${documentId}`);
};
