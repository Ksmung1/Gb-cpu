import { useState, useEffect, useRef } from "react";
import { useUser } from "../../../../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from "../../../../context/ModalContext";
import { useAlert } from "../../../../context/AlertContext";
import { getYokcashBalance } from "../../../../utils/getYokcashBalance";
import coin from "../../../../assets/images/coin.png";
import upi from "../../../../assets/images/upi.png";
import { useDarkMode } from "../../../../context/DarkModeContext";
import OrderDetailModal from "../../../modal/OrderDetailModal";
import AddPhoneNumber from "../../../modal/AddPhoneNumber";
import axios from "axios";
import { useBharatToggle } from "../../../../utils/useBharatToggle";
import BharatTutorial from "./../../RechargeUtils/BharatTutorial";

const MagicChessCheckout = ({
  selectedItem,
  setSelectedItem,
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const { user } = useUser();
  const {
    showTutorial,
    isLoading: toggleLoading,
    hideForever,
  } = useBharatToggle();
  const [tutorialDone, setTutorialDone] = useState(false);
  const hasShownTutorial = useRef(false);

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

  useEffect(() => {
    const fetchBalance = async () => {
      const res = await getYokcashBalance();
      setYokcashBalance(res);
    };
    fetchBalance();
  }, []);

  const balance = user?.balance || 0;
  const parsedBalance = parseFloat(balance);

  const getParsedAmount = () => {
    if (!selectedItem) return 0;
    if (user?.role === "reseller" || user?.role === "prime")
      return selectedItem.resellerRupees;
    if (user?.role === "admin") return 1;
    if (user?.role === "vip") return Math.round(selectedItem.rupees * 0.97);
    return selectedItem.rupees;
  };

  const parsedAmount = getParsedAmount();

  function getLocalISOString() {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, "0");
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeString = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    const dateString = `${pad(now.getDate())}-${pad(
      now.getMonth() + 1
    )}-${now.getFullYear()}`;
    return `${dateString}T${timeString}`;
  }

  const fullDateTime = getLocalISOString();
  const [datePart, timePart] = fullDateTime.split("T");

  function generateRandomOrderId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let orderId = "MCGG-";
    for (let i = 0; i < length; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
  }

  const [newOrderId, setNewOrderId] = useState(generateRandomOrderId());

  useEffect(() => {
    setNewOrderId(generateRandomOrderId());
  }, [isSelectedPayment, username]);

  // === RESET ONLY WHEN MODAL CLOSES ===
  const resetForm = () => {
    setSelectedItem(null);
    setIsSelectedPayment("coin");
    setNewOrderId(generateRandomOrderId());
    setOrderDetails(null);
    setUserId("");
    setZoneId("");
    setUsername("");
    setUsernameExists(false);
  };

  // === UPI PAYMENT ===
  const handleUpi = async () => {
    if (!username) {
      showAlert("Please check username first");
      return;
    }

    const orderData = {
      id: newOrderId,
      userId,
      uid: user.uid,
      zoneId,
      product: "magicchessgogo",
      productId: selectedItem.id,
      price: selectedItem.price || null,
      username: user.username,
      gameUsername: username,
      cost: parsedAmount,
      date: datePart,
      time: timePart,
      selectedItem,
      api: selectedItem.api,
    };

    try {
      showAlert("Redirecting to payment...");
      const url = `${import.meta.env.VITE_PAYMENT_URL}/customer/start-order`;
      const { data } = await axios.post(url, {
        ...orderData,
        ksmApi: import.meta.env.VITE_APP_KSM_API,
      });

      if (data.success && data.orderId) {
        if (user?.role === "reseller" || user?.role === "admin") {
          window.location.href = data.payment_url;
        } else {
          navigate(`/payment/${data.orderId}`);
        }
      } else {
        showAlert(`Payment failed: ${data.message || "Try again"}`);
        // nothing
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to start payment. Try again.");
    }
  };

  // === MAIN ORDER BUTTON HANDLER ===
  const handleCreateOrder = async () => {
    setIsDisabled(true);

    try {
      if (!user?.phone) {
        setShowPhoneModal(true);
        setIsDisabled(false);
        return;
      }
      if (!selectedItem) {
        showAlert("Please select a package.");
        setIsDisabled(false);
        return;
      }
      if (!username) {
        showAlert("Please check your ML username.");
        setIsDisabled(false);
        return;
      }

      // Show Bharat UPI Tutorial (first time only)
      if (
        isSelectedPayment === "upi" &&
        showTutorial &&
        !hasShownTutorial.current
      ) {
        if (user.role !== "reseller") return;
        hasShownTutorial.current = true;
        openModal({
          title: "How to Pay with UPI",
          content: (
            <BharatTutorial
              onContinue={() => {
                hasShownTutorial.current = false;
                proceedToConfirm();
              }}
              onDontShowAgain={() => {
                hideForever();
                hasShownTutorial.current = false;
              }}
            />
          ),
          showClose: false,
          showConfirm: false,
          showCancel: false,
          backdropClose: false,
        });
        setIsDisabled(false);
        return;
      }

      // Normal flow
      proceedToConfirm();
    } catch (err) {
      console.error(err);
      setIsDisabled(false);
    }
  };

  // === CONFIRMATION MODAL + FINAL PAYMENT LOGIC ===
  const proceedToConfirm = () => {
    openModal({
      title: "Confirm Purchase",
      content: (
        <p className="text-lg">
          Buy <strong>{selectedItem.label}</strong> for{" "}
          <strong>
            {userId}
            {zoneId && ` (${zoneId})`}
          </strong>
          <br />
          Username: <strong>{username}</strong>
          <br />
          Amount: <strong>₹{parsedAmount}</strong>
        </p>
      ),
      type: "confirm",
      onConfirm: async () => {
        const parsedYokcash = parseFloat(yokcashBalance);
        const price = parseFloat(selectedItem.price);

        if (
          isSelectedPayment === "coin" &&
          parsedYokcash < price &&
          selectedItem.api === "yokcash"
        ) {
          showAlert("Not enough YokCash. Please wait for next refill.");
          setIsDisabled(false);
          return;
        }

        if (isSelectedPayment === "coin" && parsedBalance < parsedAmount) {
          showAlert("Insufficient Gamebar Coin balance.");
          setIsDisabled(false);
          return;
        }

        // UPI → redirect only
        if (isSelectedPayment === "upi") {
          handleUpi();
          setIsDisabled(false);
          return;
        }

        // === COIN PAYMENT (YokCash / Smile.One) ===
        showAlert(
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing your order...
          </div>
        );

        let timeout = setTimeout(
          () => showAlert("Still processing, please wait..."),
          30000
        );

        const axiosInstance = axios.create({ timeout: 30000 });

        const retry = async (fn, retries = 3) => {
          for (let i = 1; i <= retries; i++) {
            try {
              return await fn();
            } catch (err) {
              if (i === retries) throw err;
              await new Promise((r) => setTimeout(r, 1000 * i));
            }
          }
        };

        try {
          const url = import.meta.env.VITE_PAYMENT_URL;
          let success = false;
          let resultData = null;

          if (selectedItem?.api === "smile") {
            // Check if price is missing and log warning
            if (!selectedItem.price && selectedItem.price !== 0) {
              console.warn(
                `[MagicChessCheckout] ⚠️ Missing price for Smile product: ${selectedItem.id} (${selectedItem.label})`
              );
            }

            const payload = {
              userId,
              zoneId,
              productId: selectedItem.id,
              product: "magicchessgogo",
              ksmApi: import.meta.env.VITE_APP_KSM_API,
              uid: user.uid,
              cost: parsedAmount,
              date: datePart,
              time: timePart,
              item: selectedItem.label,
              payment: "coin",
              username: user.username,
              gameUsername: username,
              idtrx: newOrderId,
              api: selectedItem.api || "smile",
              price: selectedItem.price ?? "NOT_AVAILABLE",
            };

            const { data } = await retry(() =>
              axiosInstance.post(`${url}/smile/create-order`, payload)
            );

            if (
              data?.status === 200 &&
              data?.order_id &&
              data.order_id !== "Order Failed"
            ) {
              success = true;
              resultData = data.orderData;
            }
          } else {
            // === YOKCASH (Main API) ===
            const payload = {
              userId,
              zoneId,
              productId: selectedItem.id,
              ksmApi: import.meta.env.VITE_APP_KSM_API,
              uid: user.uid,
              cost: parsedAmount,
              date: datePart,
              time: timePart,
              item: selectedItem.label,
              payment: "coin",
              username: user.username,
              gameUsername: username,
              idtrx: newOrderId,
              product: "MCGG Recharge",
              api: "yokcash",
            };

            const { data } = await retry(() =>
              axiosInstance.post(`${url}/yokcash/create-order`, payload)
            );

            const isSuccess =
              data?.status === 200 &&
              data?.order_id &&
              data.order_id !== "Order Failed" &&
              data.orderData?.status === "completed";

            if (isSuccess && data.orderData) {
              success = true;
              resultData = data.orderData;
            } else {
              const msg = data?.message || "Order failed";
              showAlert(`Failed: ${msg} | ID: ${newOrderId}`);
            }
          }

          // === FINAL SUCCESS → SHOW MODAL ===
          if (success && resultData) {
            setOrderDetails(resultData);
            setShowOrderModal(true);
            setUsernameExists(false);
          }
          setIsDisabled(false);
        } catch (err) {
          console.error("Order error:", err);
          setIsDisabled(false);

          showAlert(`Order failed. Contact support → ID: ${newOrderId}`);
        } finally {
          clearTimeout(timeout);
          setIsDisabled(false);
        }
      },
      onCancel: () => setIsDisabled(false),
    });
  };

  return (
    <>
      {showPhoneModal && (
        <AddPhoneNumber onClose={() => setShowPhoneModal(false)} />
      )}

      <div className="w-full flex flex-col gap-6 p-0">
        {/* Payment Method */}
        <div
          className={`w-full border rounded-sm shadow-lg p-4 ${
            isDarkMode
              ? "border-gray-700 bg-gray-800/70 text-gray-200"
              : "border-gray-200 bg-white/70 text-gray-800"
          } backdrop-blur-sm`}
        >
          <h1 className="text-xl font-semibold mb-3">Choose Payment Method</h1>
          <div className="flex flex-col gap-4">
            {["upi", "coin"].map((method) => (
              <button
                key={method}
                onClick={() => setIsSelectedPayment(method)}
                className={`relative flex items-center justify-between py-3 px-4 rounded-md transition font-medium shadow-md ${
                  isSelectedPayment === method
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border border-yellow-700"
                    : isDarkMode
                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                } border`}
              >
                {isSelectedPayment === method && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {method === "coin" && (
                  <>
                    <div className="flex items-center gap-3">
                      <img className="w-10 h-10" src={coin} alt="Coin" />
                      <div>
                        <p className="font-semibold">Gamebar Coin</p>
                        <p className="text-sm">
                          Balance:{" "}
                          <strong className="text-green-400">
                            {user?.balance || 0}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-lg">₹{parsedAmount}</span>
                  </>
                )}

                {method === "upi" && (
                  <>
                    <div className="flex items-center gap-3">
                      <img className="h-10" src={upi} alt="UPI" />
                      <span className="font-semibold">UPI / QR</span>
                    </div>
                    <span className="font-bold text-lg">
                      ₹{Math.round(parsedAmount)}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Buy Button */}
        <div
          className={`w-full border rounded-md shadow-md p-4 ${
            isDarkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <button
            disabled={isDisabled || selectedItem?.outOfStock || toggleLoading}
            onClick={user ? handleCreateOrder : () => navigate("/login")}
            className={`relative w-full py-4 text-lg font-bold rounded-lg transition-all flex items-center justify-center gap-3 overflow-hidden ${
              isDisabled || selectedItem?.outOfStock || toggleLoading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg"
            }`}
          >
            {selectedItem?.outOfStock ? (
              "Out of Stock"
            ) : user ? (
              toggleLoading || isDisabled ? (
                <>
                  {/* Spinning Loader */}
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </>
              ) : (
                "Buy Now"
              )
            ) : (
              "Login to Buy"
            )}
          </button>
        </div>

        {/* SUCCESS MODAL */}
        {showOrderModal && (
          <OrderDetailModal
            orderData={orderDetails}
            onClose={() => {
              setShowOrderModal(false);
              resetForm(); // Safe to reset only after user closes modal
            }}
          />
        )}
      </div>
    </>
  );
};

export default MagicChessCheckout;
