// src/utils/apiUtils.js
import axios from "axios";

export const fetchUsername = async (userID, serverID) => {
  if (!userID || !serverID) {
    return { success: false, error: "Please enter User ID and Server ID." };
  }

  try {
    const res = await axios.get(`https://nailmick-backend.onrender.com/api/ml/get-username/${userID}/${serverID}`);
    if (res.data.error) {
      return { success: false, error: "User not found." };
    } else {
      return {
        success: true,
        data: {
          username: res.data.username,
          region: res.data.region
        }
      };
    }
  } catch (err) {
    console.error("Username fetch failed:", err);
    return { success: false, error: "Network or server error." };
  }
};
