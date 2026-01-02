import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

/**
 * Upload files to Firebase Storage
 * @param files - Array of files to upload
 * @param path - Storage path (e.g., 'activities/attachments')
 * @returns Array of uploaded file metadata
 */
export async function uploadFiles(
  files: File[],
  path: string = "activities/attachments"
): Promise<{
  success: boolean;
  files: UploadedFile[];
  error: string | null;
}> {
  try {
    const uploadPromises = files.map(async (file) => {
      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomString}-${file.name}`;
      const fileRef = ref(storage, `${path}/${fileName}`);

      // Upload file
      await uploadBytes(fileRef, file);

      // Get download URL
      const url = await getDownloadURL(fileRef);

      return {
        name: file.name,
        url,
        size: file.size,
        type: file.type,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return {
      success: true,
      files: uploadedFiles,
      error: null,
    };
  } catch (error: any) {
    console.error("File upload error:", error);
    return {
      success: false,
      files: [],
      error: error.message || "Failed to upload files",
    };
  }
}
