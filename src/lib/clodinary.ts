interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export const uploadToCloudinary = async (
  file: File,
  folder?: string
): Promise<CloudinaryUploadResult> => {
  // Clean folder name (remove leading slashes if any)
  const safeFolder = folder ? folder.replace(/^\/+/, "") : "";

  // Max file sizes based on folder
  const MAX_FILE_SIZES: Record<string, number> = {
    audio: 20 * 1024 * 1024,      // 20 MB
    documents: 2 * 1024 * 1024,   // 2 MB
    profiles: 2 * 1024 * 1024,    // 2 MB
  };

  // Allowed MIME types per folder
  const ALLOWED_TYPES: Record<string, string[]> = {
    audio: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/webm", "audio/ogg"],
    documents: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "image/jpeg",
      "image/png",
    ],
    profiles: ["image/jpeg", "image/png", "image/webp"],
  };

  const maxSize =
    safeFolder && MAX_FILE_SIZES[safeFolder]
      ? MAX_FILE_SIZES[safeFolder]
      : 2 * 1024 * 1024; // default 2 MB

  const allowedTypes =
    safeFolder && ALLOWED_TYPES[safeFolder]
      ? ALLOWED_TYPES[safeFolder]
      : [];

  // File size validation
  if (file.size > maxSize) {
    throw new Error(
      `File too large. Max size for ${safeFolder || "default"} is ${
        maxSize / 1024 / 1024
      } MB`
    );
  }

  // File type validation
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types for ${safeFolder || "default"} are: ${allowedTypes.join(
        ", "
      )}`
    );
  }

  // Prepare form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_upload");

  if (safeFolder) {
    formData.append("folder", safeFolder);
  }

  const cloudName = import.meta.env.VITE_CLOUD_NAME;
  if (!cloudName) {
    throw new Error(
      "Cloudinary cloud name is not configured (VITE_CLOUD_NAME missing)"
    );
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || "Upload failed");
  }

  return {
    url: json.secure_url,
    publicId: json.public_id,
  };
};
