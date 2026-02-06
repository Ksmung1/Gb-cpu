import { doc, setDoc } from "firebase/firestore";
import { db } from "../configs/firebase";

const saveToDatabase = async (path, data) => {
  try {
    if (!path || path.trim() === "") {
      throw new Error("Invalid path: path cannot be empty");
    }

    // Remove empty strings from split (avoid empty segments)
    const segments = path.split("/").filter(segment => segment.length > 0);

    if (segments.length === 0) {
      throw new Error("Invalid path: path segments missing");
    }

    // doc() requires an odd number of path segments (collection/doc/collection/doc ...)
    if (segments.length % 2 !== 0) {
      throw new Error("Invalid path: must be a document path (collection/document)");
    }

    const ref = doc(db, ...segments);
    await setDoc(ref, data, { merge: true });
  } catch (err) {
    console.error("Error saving to database:", err.message);
    throw err;
  }
};

export default saveToDatabase;
