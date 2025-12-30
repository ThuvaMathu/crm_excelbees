import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

// Upload user profile image
export async function uploadUserProfileImage(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Create a reference to the user's profile image
    const storageRef = ref(storage, `users/${userId}/profile/${file.name}`);

    // Upload the file
    await uploadBytes(storageRef, file);

    // Get the download URL
    const url = await getDownloadURL(storageRef);

    return { url, error: null };
  } catch (error: any) {
    return { url: null, error: error.message };
  }
}

// Upload user document
export async function uploadUserDocument(
  userId: string,
  file: File,
  documentType: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Create a reference to the user's document
    const timestamp = Date.now();
    const storageRef = ref(
      storage,
      `users/${userId}/documents/${documentType}/${timestamp}_${file.name}`
    );

    // Upload the file
    await uploadBytes(storageRef, file);

    // Get the download URL
    const url = await getDownloadURL(storageRef);

    return { url, error: null };
  } catch (error: any) {
    return { url: null, error: error.message };
  }
}

// Delete user document
export async function deleteUserDocument(
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
