import { collection, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";

export const getProfileDoodles = async () =>
{
          const doodleRef = collection(db, "doodle-profiles");
          const snapshot = await getDocs(doodleRef);

          // Extract just the 'img' field from each document
          const urls = snapshot.docs
                    .map(doc => doc.data()?.img)
                    .filter(url => !!url); // Filter out undefined or null values

          return urls;
};
