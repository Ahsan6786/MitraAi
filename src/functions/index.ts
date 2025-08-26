
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered when a new comment is created.
 * Increments the commentCount on the parent post document.
 */
export const incrementCommentCount = onDocumentCreated("posts/{postId}/comments/{commentId}", async (event) => {
    const postId = event.params.postId;
    const postRef = db.collection("posts").doc(postId);

    try {
        await postRef.update({
            commentCount: admin.firestore.FieldValue.increment(1)
        });
        console.log(`Successfully incremented comment count for post: ${postId}`);
    } catch (error) {
        console.error(`Error incrementing comment count for post ${postId}:`, error);
    }
});

/**
 * Triggered when a comment is deleted.
 * Decrements the commentCount on the parent post document.
 */
export const decrementCommentCount = onDocumentDeleted("posts/{postId}/comments/{commentId}", async (event) => {
    const postId = event.params.postId;
    const postRef = db.collection("posts").doc(postId);

    try {
        await postRef.update({
            commentCount: admin.firestore.FieldValue.increment(-1)
        });
        console.log(`Successfully decremented comment count for post: ${postId}`);
    } catch (error) {
        console.error(`Error decrementing comment count for post ${postId}:`, error);
    }
});
