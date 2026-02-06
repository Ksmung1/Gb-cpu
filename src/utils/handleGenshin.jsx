// src/utils/handleGenshinOrder.jsx
import axios from "axios";

/**
 * Handle creating a Genshin Impact order
 * @param {Object} order - order info
 * @param {string} order.service_id - YokCash service_id (e.g., GENSHIN86)
 * @param {string} order.uid - Genshin UID
 * @param {string} order.server - Genshin server (e.g., os_asia, os_usa)
 * @param {string} order.invoiceId - Unique invoice ID
 * @returns {Promise<Object>} - API response
 */
const handleGenshinOrder = async ({ service_id, uid, server, invoiceId }) => {
  try {
    // ✅ Build target in UID|Server format
    const target = `${uid}|${server}`;

    // Send request to your backend
    const res = await axios.post("/yokcash/genshin-order", {
      service_id,
      target,
      idtrx: invoiceId,
    });

    return res.data;
  } catch (err) {
    console.error("Frontend Order Error:", err.response?.data || err.message);
    throw err;
  }
};

export default handleGenshinOrder;
