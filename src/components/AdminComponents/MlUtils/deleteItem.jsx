// src/utils/deleteItem.js
import { deleteDoc, doc } from "firebase/firestore";

/**
 * Delete a document from a Firestore collection by ID.
 *
 * @param {Object} params
 * @param {string} params.collectionName - The name of the Firestore collection.
 * @param {string} params.id - The document ID to delete.
 * @param {object} params.db - The Firebase Firestore instance.
 * @returns {Promise<boolean>} - Returns true if deleted, false if cancelled or error.
 */
export const deleteItem = async ({ collectionName, id, db }) => {
  const confirm = window.confirm("Delete this item?");
  if (!confirm) return false;

  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error("Error deleting item:", error);
    return false;
  }
};
