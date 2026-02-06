import { collection, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";

export const fetchUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
