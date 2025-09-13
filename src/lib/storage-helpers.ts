
'use client';

import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a data URI (e.g., from a generated image) to Firebase Cloud Storage.
 * @param dataUri The base64 data URI of the file to upload.
 * @param path The path in Cloud Storage where the file should be saved (e.g., 'generated-images/my-image.png').
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export async function uploadDataUriToStorage(dataUri: string, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    
    // 'data_url' is the string format Firebase expects for data URIs
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading data URI to storage:", error);
    // Depending on your error handling strategy, you might want to re-throw the error
    // or return a specific error message.
    throw new Error('Failed to upload image to storage.');
  }
}
