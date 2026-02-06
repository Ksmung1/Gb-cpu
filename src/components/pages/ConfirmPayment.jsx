import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFromDatabase } from "../../utils/getFromFirebase";
import { useUser } from "../../context/UserContext";
import { useAlert } from "../../context/AlertContext";
import axios from "axios";
import { db } from "../../configs/firebase";
import { doc, increment, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useDarkMode } from "../../context/DarkModeContext";
import { handleCreateOrder } from "../../utils/busan";
import vipBadge from "../../assets/images/vip-badge.png";

const ConfirmPayment = () => {
  const { order_id: orderId } = useParams();
  const { user } = useUser();
  const uid = user?.uid;
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [orderData, setOrderData] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Loading order status...");
  const [loading, setLoading] = useState(false);

  const hasCheckedRef = useRef(false);

  const completeOrder = async (orderRef, userRef, extraFields = {}) => {
    await updateDoc(userRef, { status: "completed", fulfilled: true, fulfilledAt: new Date(), ...extraFields });
    await updateDoc(orderRef, { status: "completed", fulfilled: true, fulfilledAt: new Date(), ...extraFields });
    console.log("✅ Order marked completed in Firestore");
  };

  const refundUser = async (currentOrderData, amount = 0) => {
    if (!uid || !currentOrderData) return;
    console.log("↩️ Refunding user with amount:", amount);

    const userRef = doc(db, "users", uid, "orders", orderId);
    const orderRef = doc(db, "orders", orderId);
    const userDb = doc(db, "users", uid);

    await updateDoc(userRef, { status: "failed", refunded: true, refundedAt: new Date() });
    await updateDoc(orderRef, { status: "failed", refunded: true, refundedAt: new Date() });
    await updateDoc(userDb, { balance: increment(0) });

    const balanceHistoryRef = collection(db, "users", uid, "balance-history");
    console.log("💵 Refund recorded in balance-history");
  };

  const checkLiveStatus = async (currentOrderData) => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!currentOrderData) return;
    setLoading(true);

    const paymentUrl = import.meta.env.VITE_PAYMENT_URL;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const userRef = doc(db, "users", uid, "orders", orderId);
    const orderRef = doc(db, "orders", orderId);
    const userDb = doc(db, "users", uid);

    try {
      const res = await axios.post(`${paymentUrl}/payment/check-order-status`, { order_id: orderId });
      const data = res.data.raw.result;
      const utr = data?.utr;

      // Always save UTR
      await updateDoc(userRef, { utr });
      await updateDoc(orderRef, { utr });

      if (data.txnStatus !== "SUCCESS") {
        setStatusMsg(`Order status: ${data.status || "pending"}`);
        console.log("⚠️ Payment not successful yet");
        return;
      }

      setOrderData((prev) => ({ ...prev, status: "completed", utr }));
      setStatusMsg("✅ Payment Successful");
      showAlert("Payment completed!");

      // Wallet top-ups
      if (orderId.startsWith("PAY") && !currentOrderData?.fulfilled) {
        await updateDoc(userDb, {
          balance: increment(parseFloat(data?.amount)),
          payCount: increment(1),
          lastTopupAt: new Date(),
        });

        await completeOrder(orderRef, userRef, { utr });
        return;
      }

      // VIP upgrade
      if (orderId.startsWith("VIP") && currentOrderData?.product === "VIP upgrade" && currentOrderData.status !== "completed") {
        const userRef = doc(db, "users", uid);

        const vipExpiry = new Date();
        vipExpiry.setDate(vipExpiry.getDate() + 30);

        await updateDoc(userRef, { role: "vip", vipExpiry });

        const vipOrderRef = doc(db, "orders", orderId);
        await updateDoc(vipOrderRef, { status: "completed", fulfilledAt: new Date() });
        await updateDoc(userRef, { status: "completed", fulfilledAt: new Date() });

        setOrderData((prev) => ({ ...prev, status: "completed", vipExpiry }));

        showAlert("🎉 VIP payment successful! Your VIP plan is active for 30 days.");
        return;
      }

      // Game recharges
      if (
        (orderId.startsWith("MCGG") && currentOrderData.product?.includes("Magic Chess")) ||
        orderId.startsWith("MLBB") ||
        orderId.startsWith("MGYOK") ||
        orderId.startsWith("GENSHIN")
      ) {
        try {
          if (currentOrderData?.api === "busan") {
            const resApi = await handleCreateOrder();
            console.log("Busan API response:", resApi);
            return;
          }

          // ✅ GENSHIN
          if (orderId.startsWith("GENSHIN")) {
            const resApi = await axios.post(`${backendUrl}/yokcash/genshin-order`, {
              service_id: currentOrderData.productId,
              target: `${currentOrderData.userId}|${currentOrderData.zoneId}`,
              idtrx: orderId,
            });

            if (resApi.data.status) {
              console.log(`✅ Genshin order ${orderId} completed successfully`);
              await completeOrder(orderRef, userRef, {
                yokOrderId: resApi?.data?.data.id || "UNKNOWN_ID",
                utr,
              });
            } else {
              console.error(`❌ Genshin order ${orderId} failed. Response:`, resApi.data.msg);
              showAlert(resApi?.data?.msg || "Genshin order failed");
              await refundUser(currentOrderData, parseFloat(currentOrderData?.cost || 0));
            }
          } else {
         return
          }

          await updateDoc(userRef, { utr });
          await updateDoc(orderRef, { utr });
        } catch (err) {
          console.error("❌ Recharge order error:", err);
          await refundUser(currentOrderData, parseFloat(currentOrderData?.cost || 0));
        }
      }
    } catch (err) {
      console.error("❌ Live check error:", err);
      if (!orderId.startsWith("PAY")) {
        await refundUser(currentOrderData, parseFloat(currentOrderData?.cost || 0));
      } else {
        setStatusMsg("⚠️ Unable to verify top-up status. Please contact support.");
      }
    } finally {
      setLoading(false);
      console.log("🔹 Live status check finished");
    }
  };

  useEffect(() => {
    if (!uid || !orderId) return;

    setLoading(true);

    let path = `/users/${uid}/orders/${orderId}`;
    if (orderId.startsWith("CHARMS")) path = `/users/${uid}/charms-orders/${orderId}`;
    if (orderId.startsWith("SKIN")) path = `/users/${uid}/skin-orders/${orderId}`;
    if (orderId.startsWith("VIP")) path = `/users/${uid}/orders/${orderId}`;

    const unsubscribe = getFromDatabase(path, async (data) => {
      setOrderData(data);

      if (!data) {
        setStatusMsg("❌ Order not found.");
        showAlert("Order not found.");
        setLoading(false);
        return;
      }

      setStatusMsg(`Order status: ${data.status || "Unknown"}`);

      if (!data.status || data.status === "pending") {
        await checkLiveStatus(data);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [uid, orderId]);

  if (loading) {
    return <p className="text-center py-10 text-gray-500">Checking your payment details, almost there...</p>;
  }

  if (!orderData) {
    return <p className="h-[80vh] py-6 flex lg:px-40 md:px-20 px-4">{statusMsg}</p>;
  }

  return (
    <div className={`flex flex-col px-4 h-[100vh] lg:px-40 md:px-20 py-6 ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`}>
      <h1 className="text-xl font-bold mb-4">Payment Status</h1>
      <p>{statusMsg}</p>

      <div className={`border-2 flex flex-col justify-center px-10 w-full sm:w-[50%] p-4 rounded-lg shadow-lg my-10 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-500 bg-white"}`}>
        <h2 className={`text-2xl font-bold ${orderData.status === "completed" ? "text-green-500" : "text-red-500"}`}>
          {orderData.status === "completed" ? "✅ Payment Successful" : `⚠️ Payment ${orderData.status}`}
        </h2>
        <p><strong>Order Id:</strong> {orderData.orderId || orderId}</p>
        {orderData.product && <p><strong>Product:</strong> {orderData.product}</p>}
        {orderData.item && <p><strong>Details:</strong> {orderData.item}</p>}
        {orderData.userId && <p><strong>User Id:</strong> {orderData.userId}</p>}
        {orderData.zoneId && <p><strong>Zone Id:</strong> {orderData.zoneId}</p>}
        {orderData.cost && <p><strong>Price:</strong> ₹{orderData.cost}</p>}
        {orderData.amount && <p><strong>Amount:</strong> ₹{orderData.amount}</p>}
        {orderData.yokOrderId && <p><strong>Status: </strong> Success</p>}
        <p><strong>UTR:</strong> {orderData.utr || "Not Available"}</p>

        {orderData.status === "pending" && (
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={() => (window.location.href = orderData.payment_url)}>
            Haven't Paid? Click here
          </button>
        )}

        {orderData.status === "completed" && orderData.product === "VIP upgrade" && (
          <div className={`mt-6 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center
            ${isDarkMode ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800"}`}>
            <img src={vipBadge} alt="VIP Badge" className="w-24 h-24 mb-4" />
            <h2 className="text-2xl font-bold mb-2">🎉 VIP Activated!</h2>
            <p className="text-center mb-2">You are now a VIP member.</p>
            {orderData.vipExpiry && (
              <p className="text-center font-semibold">
                Expires on: {new Date(orderData.vipExpiry.seconds ? orderData.vipExpiry.seconds * 1000 : orderData.vipExpiry).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {orderData.status === "completed" && (
          <button
            onClick={() =>
              navigate(orderId.startsWith("VIP") ? "/subscription" : "/orders")
            }
            className={`mt-4 px-4 py-2 rounded-xl font-bold hover:bg-green-400 ${isDarkMode ? "bg-green-600 text-gray-200" : "bg-green-300 text-gray-700"}`}
          >
            View Orders
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfirmPayment;
