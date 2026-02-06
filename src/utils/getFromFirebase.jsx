import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../configs/firebase";

/**
 * Listen to Firestore document changes at the given path
 * @param {string} path - Firestore document path, e.g. `users/userid/orders/orderid`
 * @param {(data: any) => void} callback - Function called with document data on change
 * @returns {() => void} - Unsubscribe function to stop listening
 */
export function getFromDatabase(path, callback) {
  try {
    const segments = path.split("/").filter(Boolean);

    if (segments.length % 2 !== 0) {
      throw new Error("Invalid Firestore path: must point to a document (collection/document)");
    }

    const docRef = doc(db, ...segments);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        } else {
          console.log(`No Firestore document found at path: ${path}`);
          callback(null);
        }
      },
      (error) => {
        console.error("Error listening to Firestore document:", error);
        callback(null);
      }
    );

    return unsubscribe; // Call unsubscribe() to stop listening
  } catch (error) {
    console.error("Error setting up Firestore listener:", error);
    return () => {};
  }
}
