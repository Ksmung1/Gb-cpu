import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";

export const fetchGlobalOrders = async () => {
  try {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const snapshot = await getDocs(q);

    const list = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))

    return list;
  } catch (error) {
    console.error("Error fetching global orders:", error);
    return [];
  }
};