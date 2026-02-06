import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";

export const fetchGlobalCount = async () => {
  try {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(q);

    // Filter out VIP and PRIME orders
    const validOrders = snapshot.docs.filter(doc => {
      const id = doc.id;
      return !id.startsWith("VIP") && !id.startsWith("PRIME");
    }) .map(doc => ({ id: doc.id, ...doc.data() }));;

    // Return ONLY the count
    return validOrders;

  } catch (error) {
    console.error("Error fetching global orders:", error);
    return 0; // Return 0 if error
  }
};
