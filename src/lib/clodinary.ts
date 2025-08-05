interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}
export const uploadToCloudinary = async (
  file: File,
  folder?: string //audio
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_upload");

  if (folder) {
    formData.append("folder", folder);
  }

  const cloudName = import.meta.env.VITE_CLOUD_NAME;
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Upload failed");
  return {
    url: json.secure_url,
    publicId: json.public_id,
  };
};
