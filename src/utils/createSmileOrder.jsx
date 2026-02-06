import axios from "axios";

export const createSmileOrder = async ({ userid, zoneid, productid, gameName }) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL;
  console.log(userid, zoneid, productid, gameName)
  try {
    const res = await axios.post(`${baseURL}/smile/${gameName}/create-order`, {
      userid,
      zoneid,
      productid,
    });

    if (res.data.status === 200) {
      return res.data.order_id;
    } else {
      throw new Error(res.data.message);
    }
  } catch (error) {
    console.error("Create Order Failed:", error.response?.data || error.message);
    throw error; // Let calling component handle it
  }
};
