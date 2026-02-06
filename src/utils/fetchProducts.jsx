// utils/fetchProducts.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";

export const fetchProducts = async () => {
  const colRef = collection(db, "products");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
