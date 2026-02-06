import axios from "axios";

const API_URL = import.meta.env.VITE_PAYMENT_URL;

export const handleFetchBalance = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/nailmick/balance`);
    if (data.success || data.statusCode === 200) {
      return data.data.balance;
    }
    throw new Error(data.error || "Failed to fetch balance");
  } catch (err) {
    console.error("Balance fetch error:", err.response?.data || err.message);
    throw err;
  }
};

export const handleCreateOrder = async (playerId, zoneId, productId, currency = "USD") => {
  try {
    console.log(playerId, zoneId, productId, currency)
    const { data } = await axios.post(`${API_URL}/nailmick/order`, {
      playerId,
      zoneId,
      productId,
      currency,
    });
    if (data.success || data.statusCode === 200) {
      return data.data;
    }
    throw new Error(data.error || "Order creation failed");
  } catch (err) {
    console.error("Order creation error:", err.response?.data || err.message);
    throw err;
  }
};
