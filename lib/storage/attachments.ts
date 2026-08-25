import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger/client";

/**
 * Upload an attachment to Firebase Storage
 * @param file The file to upload
 * @param userId The ID of the user uploading the file
 * @returns The download URL of the uploaded file
 */
export async function uploadAttachment(file: File, userId: string): Promise<string> {
  try {
    // specific path for attachments: attachments/{userId}/{uuid}-{filename}
    const fileId = uuidv4();
    const storagePath = `attachments/${userId}/${fileId}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    logger.error("Error uploading attachment", { module: "storage", action: "upload-attachment", error });
    throw new Error(`Failed to upload attachment: ${error.message}`);
  }
}
