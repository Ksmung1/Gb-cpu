import { collection, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";

export const fetchUserStats = async (users) => {
  const stats = {};

  for (const user of users) {
    try {
      const txRef = collection(db, `users/${user.uid}/orders`);
      const txSnap = await getDocs(txRef);

      if (txSnap.empty) {
        stats[user.id] = {
          totalOrders: 0,
          completedOrders: 0,
        };
        continue;
      }

      const orders = txSnap.docs.map(doc => doc.data());
      const completed = orders.filter(o => o.status?.toLowerCase() === "completed").length;

      stats[user.id] = {
        totalOrders: orders.length,
        completedOrders: completed,
      };
    } catch (err) {
      // If it's a missing collection or permission issue, safely fallback to 0
      console.warn(`No orders found for user ${user.uid} or permission denied. Defaulting to 0.`);
      stats[user.id] = {
        totalOrders: 0,
        completedOrders: 0,
      };
    }
  }

  return stats;
};
