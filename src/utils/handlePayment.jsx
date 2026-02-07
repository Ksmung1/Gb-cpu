import axios from "axios";
import saveToDatabase from "./saveToDatabase";

/**
 * Initiates an ExGateway payment
 */
export const handlePayment = async (
  mobile,
  amount,
  remark1, // user.uid
  remark2, // product label
  showAlert,
  orderId,
  orderData = {}
) => {
  const baseURL = import.meta.env.VITE_PAYMENT_URL;
  const parsedAmount = parseFloat(amount);
  

  try {
    const res = await axios.post(`${baseURL}/customer/start-order`, {
      customer_mobile: mobile,
      amount: parsedAmount,
      order_id: orderId,
      remark1,
      remark2,
    });
    console.log(parsedAmount)

    if (res.data.success && res.data.paytmUrl) {
      const paymentUrl = res.data.paytmUrl;

      const update = {
        ...orderData,
        status: "pending",
        payment_url: paymentUrl,
      };
        const append = {
        ...orderData,
        payment_url: paymentUrl,
      };


      // ✅ Dynamically choose DB path
      const product = orderData?.product;
      if (product === "MLBB Recharge" || product==="Magic Chess Recharge" || product==='Honkai Rehcarge') {
        await saveToDatabase(`/orders/${orderId}`, update);
        await saveToDatabase(`/users/${remark1}/orders/${orderId}`, update);
      } else if (product === "Charisma Order") {
        await saveToDatabase(`/charms-orders/${orderId}`, append);
        await saveToDatabase(`/users/${remark1}/charms-orders/${orderId}`, append);
      } else if (product === "Skin Order") {
        await saveToDatabase(`/skin-orders/${orderId}`, update);
        await saveToDatabase(`/users/${remark1}/skin-orders/${orderId}`, update);
      }else if (product === "VIP upgrade") {
        await saveToDatabase(`/orders/${orderId}`, append);
        await saveToDatabase(`/users/${remark1}/orders/${orderId}`, append);
      } else if (product && product.toLowerCase().includes("topup")) {
  await saveToDatabase(`/orders/${orderId}`, append);
  await saveToDatabase(`/users/${remark1}/orders/${orderId}`, append);
}else if (product && product.toLowerCase().includes("genshin")) {
  await saveToDatabase(`/orders/${orderId}`, append);
  await saveToDatabase(`/users/${remark1}/orders/${orderId}`, append);
}
 else {
        return
      }

window.open(paymentUrl, "_blank");
      return true;
    } else {
      console.log("❌ Payment initiation failed with response:", res.data);
      showAlert("❌ Failed to start payment");
      return false;
    }
  } catch (error) {
    console.error("❌ Error initiating ExGateway payment:", error);
    if (error?.response?.data) {
      console.error("📡 Server responded with error:", error.response.data);
    } else {
      console.error("📡 Network or unknown error occurred.");
    }
    showAlert("An error occurred during payment. Try again.");
    return false;
  }
};
