// Upload a file to Cloudinary and return the secure URL
export const uploadToCloudinary = async (
  file: File,
): Promise<string> => {
  // Prepare form data for Cloudinary
  const formData = new FormData();
  formData.append("file", file);                        // Append the file
  formData.append("upload_preset", "unsigned_upload"); // Use unsigned preset (must be set in Cloudinary)

  // Get Cloudinary cloud name from Vite environment variables
  const cloudName = import.meta.env.VITE_CLOUD_NAME;

  // Make POST request to Cloudinary's upload endpoint
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: formData,
  });

  // Parse JSON response
  const json = await res.json();

  // Handle upload errors
  if (!res.ok) {
    throw new Error(json.error?.message || "Cloudinary upload failed");
  }

  // Return uploaded file's secure URL
  return json.secure_url as string;
};
