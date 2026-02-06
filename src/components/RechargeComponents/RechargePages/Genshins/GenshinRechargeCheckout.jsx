import { useState, useEffect } from "react";
import { useUser } from "../../../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../../context/ModalContext";
import { useAlert } from "../../../../context/AlertContext";
import { getYokcashBalance } from "../../../../utils/getYokcashBalance";
import saveToDatabase from "../../../../utils/saveToDatabase";
import { useUserID } from "../../../../context/UserIDContext";
import coin from "../../../../assets/images/coin.png";
import { db } from "../../../../configs/firebase";
import { serverTimestamp, addDoc, collection } from "firebase/firestore";
import upi from "../../../../assets/images/upi.png";
import { useDarkMode } from "../../../../context/DarkModeContext";
import OrderDetailModal from "../../../modal/OrderDetailModal";
import { handlePayment } from "../../../../utils/handlePayment";
import axios from "axios";
import AddPhoneNumber from "../../../modal/AddPhoneNumber";
import GenshinInfo from "./GenshinInfo";


const GenshinRechargeCheckout = ({ selectedItem, setSelectedItem, usernameExists, setUsernameExists }) => {
  const { user } = useUser();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [yokcashBalance, setYokcashBalance] = useState(null);
  const { isDarkMode } = useDarkMode();
  const { showAlert } = useAlert();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const [isSelectedPayment, setIsSelectedPayment] = useState("coin");
  const [isDisabled, setIsDisabled] = useState(false);

  const mobile = user?.phone?.slice(-10) || "7005549898";
  const balance = user?.balance || 0;
  const parsedBalance = parseFloat(balance);

  // 🔹 Always re-read UID + server from localStorage
  const getPrevData = () => {
    try {
      return JSON.parse(localStorage.getItem("genshin_prev_data")) || {};
    } catch {
      return {};
    }
  };

  // 🔹 Generate unique Order ID
  function generateRandomOrderId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let orderId = "GENSHIN-";
    for (let i = 0; i < length; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
  }
  const [newOrderId, setNewOrderId] = useState(generateRandomOrderId());

  // 🔹 Date/Time helpers
  function getLocalISOString() {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, "0");
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeString = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    const dateString = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    return `${dateString}T${timeString}`;
  }
  const [datePart, timePart] = getLocalISOString().split("T");

  const resetForm = () => {
    setSelectedItem(null);
    setIsSelectedPayment("coin");
    setNewOrderId(generateRandomOrderId());
    setOrderDetails(null);
  };

  const getParsedAmount = () => {
    if (!selectedItem) return 0;
    if (user?.role === "reseller") return selectedItem.resellerRupees;
    if (user?.role === "admin") return 1;
    if (user?.role === "vip") return Math.round(selectedItem.rupees * 0.97);
    return selectedItem.rupees;
  };
  const parsedAmount = getParsedAmount();

  useEffect(() => {
    const fetchBalance = async () => {
      const res = await getYokcashBalance();
      setYokcashBalance(res);
    };
    fetchBalance();
  }, []);

  const handleCreateOrder = () => {
    setIsDisabled(true);

    // 🔹 Re-read latest UID + server before creating order
    const { uid: uid, zone: zone } = getPrevData();
    try {
      if (!user?.phone) {
        setShowPhoneModal(true);
        return;
      }
      if (!selectedItem) {
        showAlert("Please select a package.");
        return;
      }
      if (!uid || !zone) {
        showAlert("❌ Please enter UID and select zone before checkout.");
        return;
      }
          // 🔹 Block checkout if UID not confirmed
      if (usernameExists !== true) {
        showAlert("❌ Please confirm your UID before checkout.");
        return;
      }
      if (!user) {
        showAlert("Log in to purchase.");
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDisabled(false);
    }

    openModal({
      title: "Confirmation",
      content: <p>Confirm Purchase for <strong>{selectedItem.label}</strong>?</p>,
      type: "confirm",
      onConfirm: async () => {
        try {
          if (!yokcashBalance) return;
          const parsedYokcashBalance = parseFloat(yokcashBalance);
          const parsedPrice = parseFloat(selectedItem.price);

          if (parsedYokcashBalance < parsedPrice) {
            showAlert("Please come back later.");
            return;
          }

          if (isSelectedPayment === "upi") {
            // 🔹 UPI Flow
            const orderData = {
              id: newOrderId,
              user: user.uid,
              userId: uid,      // ✅ use latest from localStorage
              zoneId: zone,
              productId: selectedItem.id,
              cost: parsedAmount,
              date: datePart,
              time: timePart,
              item: selectedItem.label,
              payment: "upi",
              username: user.username,
              userUid: user.uid,
              status: "pending",
              product: "Genshin Recharge",
              timestamp: serverTimestamp(),
            };

            showAlert("Redirecting please wait...");
            handlePayment(
              mobile,
              parsedAmount,
              user.uid,
              "Genshin Recharge",
              showAlert,
              newOrderId,
              orderData
            );

            saveToDatabase(`/users/${user.uid}/orders/${newOrderId}`, orderData);
            saveToDatabase(`/orders/${newOrderId}`, orderData);
            return;
          } else if (isSelectedPayment === "coin") {
            // 🔹 Coin Flow
            if (parsedBalance < parsedAmount) {
              showAlert("Insufficient Gamebar Coin balance. Please topup to proceed.");
              return;
            }

            try {
              const url = import.meta.env.VITE_BACKEND_URL;
              const res = await axios.post(`${url}/yokcash/genshin-order`, {
                service_id: selectedItem.id,
                target: `${uid}|${zone}`, // ✅ fixed
                idtrx: newOrderId,
              });

              if (res.data.status) {
                const orderData = {
                  id: newOrderId,
                  user: user.uid,
                  userId: uid,
                  zoneId: zone,
                  productId: selectedItem.id,
                  cost: parsedAmount,
                  date: datePart,
                  time: timePart,
                  item: selectedItem.label,
                  payment: isSelectedPayment,
                  username: user.username,
                  userUid: user.uid,
                  yokOrderId: res.data.data.id,
                  status: "completed",
                  product: "Genshin Recharge",
                  createdAt: serverTimestamp(),
                  fulfilled: true,
                  fulfilledAt: new Date(),
                  api: selectedItem?.api || "yokcash",
                };

                const newBalance = parsedBalance - parsedAmount;
                await saveToDatabase(`/users/${user.uid}`, { balance: newBalance });
                await saveToDatabase(`/users/${user.uid}/orders/${newOrderId}`, orderData);
                await saveToDatabase(`/orders/${newOrderId}`, orderData);
                await addDoc(collection(db, "users", user.uid, "balance-history"), {
                  type: "deduction",
                  amount: parsedAmount,
                  reason: `Recharge for ${selectedItem.label} (${selectedItem.id})`,
                  timestamp: serverTimestamp(),
                  by: "user",
                  balanceAfter: newBalance,
                });

                setOrderDetails(orderData);
                setShowOrderModal(true);
              } else {
                showAlert(res.data.msg || "Order failed. Please try again later.");
                return;
              }
            } catch (error) {
              showAlert("An error occurred, Please try again later");
              console.error(error.response);
            }
          }
        } catch (error) {
          showAlert("Failed to Create Order!");
          console.error("Purchase failed:", error);
        } finally {
          setUsernameExists(false)
          setIsDisabled(false);
        }
      },
      onCancel: () => {
        console.log("Order cancelled");
      },
    });
  };

  return (
    <>
      {showPhoneModal && <AddPhoneNumber onClose={() => setShowPhoneModal(false)} />}
      {/* Payment methods */}
      <div className="w-full flex flex-col gap-6 p-0">
        <div
          className={`w-full border rounded-sm shadow-lg p-4 ${
            isDarkMode ? "border-gray-700 bg-gray-800/70 text-gray-200" : "border-gray-200 bg-white/70 text-gray-800"
          } backdrop-blur-sm`}
        >
          <h1 className="text-xl font-semibold mb-3">Choose Payment Method</h1>
          <div className="flex flex-col gap-4">
            {["upi", "coin"].map((method) => (
              <button
                key={method}
                onClick={() => setIsSelectedPayment(method)}
                className={`relative flex-1 py-3 px-3 rounded-md transition duration-300 font-medium shadow-md text-left flex flex-col ${
                  isSelectedPayment === method
                    ? `bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg border border-yellow-600 text-gray-900`
                    : `${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
                          : "bg-white border-gray-300 hover:bg-gray-100 text-gray-800"
                      } border`
                }`}
              >
                {isSelectedPayment === method && (
                  <div className="absolute top-1 right-1 bg-green-400 rounded-full p-[2px] shadow">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {method === "coin" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <img className="w-10 h-10" src={coin} alt="" />
                      <div>
                        <p className="text-lg font-semibold">Gamebar Coin</p>
                        <p className="text-sm font-[400]">
                          Balance: <strong className="text-green-500">{user?.balance || 0}</strong>
                        </p>
                      </div>
                    </div>
                    {selectedItem && (
                      <p className={`text-lg font-semibold ${isSelectedPayment === "coin" ? "text-white" : isDarkMode ? "text-gray-300" : "text-black"}`}>
                        ₹{parsedAmount}
                      </p>
                    )}
                  </div>
                )}
                {method === "upi" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <img className="h-10" src={upi} alt="" />
                    </div>
                    {selectedItem && (
                      <p className={`text-lg font-semibold ${isSelectedPayment === "upi" ? "text-white" : isDarkMode ? "text-gray-300" : "text-black"}`}>
                        ₹{Math.round(parsedAmount)}
                      </p>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Checkout Summary */}
        <div
          className={`w-full border rounded-md shadow-md p-4 space-y-4 ${
            isDarkMode ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-white text-gray-800"
          }`}
        >
          <button
            disabled={isDisabled || selectedItem?.outOfStock}
            onClick={user ? handleCreateOrder : () => navigate("/login")}
            className={`w-full py-3 text-center rounded-lg font-semibold transition-all duration-300 ${
              isDisabled || selectedItem?.outOfStock
                ? "bg-gray-400 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 hover:from-sky-600 hover:via-indigo-600 hover:to-violet-700 text-white"
            }`}
          >
            {user && selectedItem?.outOfStock ? "Out of Stock" : user ? "Buy Now" : "Log in first"}
          </button>
        </div>

        {showOrderModal && orderDetails && (
          <OrderDetailModal
            orderData={orderDetails}
            onClose={() => {
              setShowOrderModal(false);
              resetForm();
            }}
          />
        )}
      </div>
            <GenshinInfo/>

    </>
  );
};

export default GenshinRechargeCheckout;
