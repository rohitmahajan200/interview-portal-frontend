import api from "./api";

export interface FileUploadResult {
  url: string;
  filename: string;
  filepath: string;
  publicId?: string;
  folder: string;
  mimetype?: string;
  size?: number;
}

export interface FileUploadOptions {
  folder?: 'profiles' | 'documents' | 'audio' | 'snapshots' | 'general';
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

// File type mappings for proper folder organization
const FILE_TYPE_MAPPINGS = {
  profiles: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/mp4'],
  snapshots: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// 🔐 ENHANCED: Size limits as per requirements
const SIZE_LIMITS = {
  profiles: 1 * 1024 * 1024,   // 1MB for photos
  documents: 1 * 1024 * 1024,  // 1MB for PDFs  
  audio: 5 * 1024 * 1024,      // 5MB for audio files
  snapshots: 1 * 1024 * 1024,  // 1MB for snapshots
  general: 1 * 1024 * 1024     // 1MB default
};

// Auto-detect folder based on file type
const detectFolderFromFile = (file: File): string => {
  for (const [folder, types] of Object.entries(FILE_TYPE_MAPPINGS)) {
    if (types.includes(file.type)) {
      return folder;
    }
  }
  return 'general';
};

// Validate file type against allowed types
const validateFileType = (file: File, folder: string): void => {
  const allowedTypes = FILE_TYPE_MAPPINGS[folder as keyof typeof FILE_TYPE_MAPPINGS];
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type for ${folder}. Allowed: ${allowedTypes.join(', ')}`);
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Main upload function
export const uploadFileToBackend = async (
  file: File,
  options: FileUploadOptions & { captchaToken?: string; requireCaptcha?: boolean } = {}
): Promise<FileUploadResult> => {
  
  // Auto-detect folder if not provided
  const folder = options.folder || detectFolderFromFile(file);
  const maxSize = options.maxSize || SIZE_LIMITS[folder as keyof typeof SIZE_LIMITS] || SIZE_LIMITS.general;

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size is ${formatFileSize(maxSize)}`);
  }
  
  // Validate file type against folder
  validateFileType(file, folder);
  
  // CAPTCHA validation - only if required
  if (options.requireCaptcha && !options.captchaToken) {
    throw new Error('CAPTCHA verification required for this upload');
  }
  
  const formData = new FormData();
  formData.append("file", file); // Always use 'file' as field name for backend
  formData.append("folder", folder);
  formData.append("type", folder);
  
  // Only append CAPTCHA token if provided
  if (options.captchaToken) {
    formData.append("captcha_token", options.captchaToken);
  }
  
  try {
    const response = await api.post("/candidates/upload", formData, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    if (response.data?.success) {
      const result: FileUploadResult = {
        url: response.data.data.url,
        filename: response.data.data.filename,
        filepath: response.data.data.filepath,
        folder: response.data.data.folder,
        mimetype: response.data.data.mimetype,
        size: response.data.data.size,
        publicId: response.data.data.filename, // Use filename as publicId for compatibility
      };
      return result;
    } else {
      throw new Error(response.data?.message || "Upload failed");
    }
  } catch (error: any) {   
    if (error?.response?.status === 400) {
      // Handle CAPTCHA-specific errors
      const errorMessage = error?.response?.data?.message;
      if (errorMessage?.includes('CAPTCHA')) {
        throw new Error(errorMessage);
      }
    } else if (error?.response?.status === 413) {
      throw new Error("File too large. Maximum size is 1 MB.");
    } else if (error?.response?.status === 415) {
      throw new Error("Unsupported file type. Please check allowed formats.");
    } else if (error?.response?.status === 403) {
      throw new Error("Access denied. Please verify your identity.");
    } else if (error?.code === 'ECONNABORTED') {
      throw new Error("Upload timeout. Please try again with a smaller file.");
    } else {
      throw new Error(error?.response?.data?.message || error.message || "Upload failed");
    }
  }
};

export const uploadFileToBackendForRegister = async (
  file: File,
  options: FileUploadOptions & { captchaToken?: string; requireCaptcha?: boolean } = {}
): Promise<FileUploadResult> => {
  
  // Auto-detect folder if not provided
  const folder = options.folder || detectFolderFromFile(file);
  const maxSize = options.maxSize || SIZE_LIMITS[folder as keyof typeof SIZE_LIMITS] || SIZE_LIMITS.general;

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size is ${formatFileSize(maxSize)}`);
  }
  
  // Validate file type against folder
  validateFileType(file, folder);
  
  // CAPTCHA validation - only if required
  if (options.requireCaptcha && !options.captchaToken) {
    throw new Error('CAPTCHA verification required for this upload');
  }
  
  const formData = new FormData();
  formData.append("file", file); // Always use 'file' as field name for backend
  formData.append("folder", folder);
  formData.append("type", folder);
  
  // Only append CAPTCHA token if provided
  if (options.captchaToken) {
    formData.append("captcha_token", options.captchaToken);
  }
  
  try {
    const response = await api.post("/candidates/upload/register", formData, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    if (response.data?.success) {
      const result: FileUploadResult = {
        url: response.data.data.url,
        filename: response.data.data.filename,
        filepath: response.data.data.filepath,
        folder: response.data.data.folder,
        mimetype: response.data.data.mimetype,
        size: response.data.data.size,
        publicId: response.data.data.filename, // Use filename as publicId for compatibility
      };
      return result;
    } else {
      throw new Error(response.data?.message || "Upload failed");
    }
  } catch (error: any) {   
    if (error?.response?.status === 400) {
      // Handle CAPTCHA-specific errors
      const errorMessage = error?.response?.data?.message;
      if (errorMessage?.includes('CAPTCHA')) {
        throw new Error(errorMessage);
      }
    } else if (error?.response?.status === 413) {
      throw new Error("File too large. Please select a smaller file.");
    } else if (error?.response?.status === 415) {
      throw new Error("Unsupported file type. Please check allowed formats.");
    } else if (error?.response?.status === 403) {
      throw new Error("Access denied. Please verify your identity.");
    } else if (error?.code === 'ECONNABORTED') {
      throw new Error("Upload timeout. Please try again with a smaller file.");
    } else {
      throw new Error(error?.response?.data?.message || error.message || "Upload failed");
    }
  }
};

// Specialized upload functions for different file types
export const uploadProfilePhoto = async (file: File): Promise<FileUploadResult> => {
  return uploadFileToBackend(file, { 
    folder: 'profiles',
    maxSize: 1 * 1024 * 1024, // 1MB for images
    allowedTypes: FILE_TYPE_MAPPINGS.profiles
  });
};

export const uploadDocument = async (file: File): Promise<FileUploadResult> => {
  return uploadFileToBackend(file, { 
    folder: 'documents',
    maxSize: 1 * 1024 * 1024, // 1MB for documents
    allowedTypes: FILE_TYPE_MAPPINGS.documents
  });
};

export const uploadAudio = async (file: File): Promise<FileUploadResult> => {
  return uploadFileToBackend(file, { 
    folder: 'audio',
    maxSize: 5 * 1024 * 1024, // 5MB for audio
    allowedTypes: FILE_TYPE_MAPPINGS.audio
  });
};

export const uploadSnapshot = async (file: File): Promise<FileUploadResult> => {
  return uploadFileToBackend(file, { 
    folder: 'snapshots',
    maxSize: 1 * 1024 * 1024, // 1MB for snapshots
    allowedTypes: FILE_TYPE_MAPPINGS.snapshots
  });
};

export default uploadFileToBackend;
