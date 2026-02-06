import axios from "axios";

async function getGenshinUsername(userid, zoneid, productid) {
  const url = import.meta.env.VITE_BACKEND_URL;
  console.log("🔍 getGenshinUsername - Calling backend URL:", url, { userid, zoneid, productid });
  const product = 'genshinimpact'
  try {
    const response = await axios.post(`${url}/get-username`, {
      userid,
      zoneid,
      product,
      productid,
    }, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("✅ getGenshinUsername response:", JSON.stringify(response.data, null, 2));

    if (response.data.username) {
      return response.data.username;
    } else {
      console.warn("❌ No username found in response:", response.data);
      throw new Error(response.data.message || "Username not found");
    }
  } catch (error) {
    console.error("❌ Error fetching Genshin username:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

export default getGenshinUsername;