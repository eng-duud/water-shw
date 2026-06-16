/**
 * Cloudinary Unsigned Upload Utility
 * Uploads a file directly from the browser to Cloudinary.
 */

export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary credentials are not configured in environment variables."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to upload image.");
    }

    const data = await response.json();
    return data.secure_url; // Returns the secure Cloudinary HTTPS URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}
