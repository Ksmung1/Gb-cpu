// ResellerCheckout.jsx
import { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { useAlert } from "../../context/AlertContext";
import { getYokcashBalance } from "../../utils/getYokcashBalance";
import coin from "../../assets/images/coin.png";
import upi from "../../assets/images/upi.png";
import { useDarkMode } from "../../context/DarkModeContext";
import OrderDetailModal from "../modal/OrderDetailModal";
import AddPhoneNumber from "../modal/AddPhoneNumber";
import axios from "axios";
import { useBharatToggle } from "../../utils/useBharatToggle";
import BharatTutorial from "./RechargeUtils/BharatTutorial";

// Only product name + order prefix needed
const GAME_CONFIG = {
  "blood-strike": { productName: "bloodstrike", orderPrefix: "BS" },
  "pubg-global": { productName: "pubgglobal", orderPrefix: "PUBG" },
  "honkai-starrail": { productName: "honkai", orderPrefix: "HSR" },
  "genshin-impact": { productName: "genshinimpact", orderPrefix: "GI" },
  "super-sus": { productName: "supersus", orderPrefix: "SS" },
  "wuthering-waves": { productName: "wutheringwaves", orderPrefix: "WW" },
  // Add more games → just this line!
};

const ResellerCheckout = ({
  selectedItem,
  setSelectedItem,
  userId,
  setUserId,
  zoneId = "",
  setZoneId = () => {},
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showAlert } = useAlert();
  const { isDarkMode } = useDarkMode();
  const { showTutorial, hideForever } = useBharatToggle();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [yokcashBalance, setYokcashBalance] = useState("0");
  const [isSelectedPayment, setIsSelectedPayment] = useState("coin");
  const [isDisabled, setIsDisabled] = useState(false);
  const hasShownTutorial = useRef(false);

  // Get current game from URL
  const gameKey =
    location.pathname.split("/")[1]?.toLowerCase() || "blood-strike";
  const config = GAME_CONFIG[gameKey] || {
    productName: "bloodstrike",
    orderPrefix: "BS",
  };

  // Generate order ID: BS-AB12XY34, PUBG-K9M2P8Q1, etc.
  const generateOrderId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    for (let i = 0; i < 8; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${config.orderPrefix}-${suffix}`;
  };

  const [newOrderId] = useState(generateOrderId());

  // Date & Time
  const now = new Date();
  const datePart = now
    .toLocaleDateString("en-GB")
    .split("/")
    .reverse()
    .join("-");
  const timePart = now.toLocaleTimeString("en-US", { hour12: true });

  // Fetch balance
  useEffect(() => {
    getYokcashBalance()
      .then((res) => setYokcashBalance(res || "0"))
      .catch(() => setYokcashBalance("0"));
  }, []);

  // Safety: Reset disabled state on unmount
  useEffect(() => {
    return () => {
      setIsDisabled(false);
    };
  }, []);

  // Final amount
  const getFinalAmount = () => {
    if (!selectedItem) return 0;
    if (user?.role === "reseller" || user?.role === "prime")
      return selectedItem.resellerRupees || selectedItem.rupees;
    if (user?.role === "vip") return Math.round(selectedItem.rupees * 0.97);
    if (user?.role === "admin") return 1;

    return selectedItem.rupees;
  };

  const finalAmount = getFinalAmount();

  // Reset
  const resetForm = () => {
    setSelectedItem(null);
    setUserId("");
    setZoneId("");
    setUsername("");
    setUsernameExists?.(false);
    setOrderDetails(null);
  };

  // UPI
  const handleUpi = async () => {
    try {
      showAlert("Redirecting to payment...");
      // const url = user.role === "reseller" || user.role === "admin" ?  `${import.meta.env.VITE_PAYMENT_URL}/payment/start-order` : `${import.meta.env.VITE_PAYMENT_URL}/matrixsols/start-payment`
      const url = `${import.meta.env.VITE_PAYMENT_URL}/customer/start-order`;

      const axiosInstance = axios.create({ timeout: 5000 });
      const { data } = await axiosInstance.post(url, {
        id: newOrderId,
        userId,
        uid: user.uid,
        zoneId,
        productId: selectedItem.id,
        username: user?.username,
        gameUsername: username,
        cost: finalAmount,
        product: config.productName,
        selectedItem,
        price: selectedItem.price || null,
        date: datePart,
        time: timePart,
        ksmApi: import.meta.env.VITE_APP_KSM_API,
        api: selectedItem.api,
      });

      if (data.success && data.orderId) {
        if (user?.role === "reseller" || user?.role === "admin") {
          window.location.href = data.payment_url;
        } else {
          navigate(`/payment/${data.orderId}`);
        }
        
      } else {
        showAlert(data.message || "Payment failed");
        throw new Error(data.message || "Payment initiation failed");
      }
    } catch (err) {
      console.error("UPI Payment Error:", err);

      let errorMessage = "Failed to start payment. Try again.";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMessage =
          "Payment request timed out. Please check your connection and try again.";
      } else if (err.response) {
        errorMessage = `Payment failed: ${
          err.response.data?.message ||
          err.response.statusText ||
          "Server error"
        }`;
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      }

      showAlert(errorMessage);
      throw err; // Re-throw to let caller handle isDisabled reset
    }
  };

  // Buy Button
  const handleCreateOrder = () => {
    if (!user?.phone) return setShowPhoneModal(true);
    if (!selectedItem) return showAlert("Please select a package");
    if (!username) return showAlert("Please enter your in-game username");

    if (
      isSelectedPayment === "upi" &&
      showTutorial &&
      !hasShownTutorial.current
    ) {
      if (user.role !== "reseller") {
        // User doesn't need tutorial, proceed directly
        proceedToConfirm();
        return;
      }

      hasShownTutorial.current = true;
      openModal({
        title: "How to Pay with UPI",
        content: (
          <BharatTutorial
            onContinue={() => proceedToConfirm()}
            onDontShowAgain={() => {
              hideForever();
              proceedToConfirm();
            }}
          />
        ),
        showClose: false,
        showConfirm: false,
        showCancel: false,
        backdropClose: false,
      });
      return;
    }

    try {
      proceedToConfirm();
    } catch (err) {
      console.error("Error opening confirmation modal:", err);
      showAlert("Failed to open confirmation. Please try again.");
    }
  };

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
          Amount: <strong>₹{finalAmount}</strong>
        </p>
      ),
      type: "confirm",
      onConfirm: async () => {
        let timeoutId = null;
        let statusTimeoutId = null;

        try {
          setIsDisabled(true);

          if (isSelectedPayment === "upi") {
            try {
              await handleUpi();
              setIsDisabled(false);
            } catch (err) {
              setIsDisabled(false);
              // Error already handled in handleUpi
            }
            return;
          }

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

          // Status update timeout
          statusTimeoutId = setTimeout(
            () => showAlert("Still processing, please wait..."),
            30000
          );

          // Overall operation timeout (60 seconds max)
          const operationTimeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(
                new Error(
                  "Operation timeout: Request took too long. Please try again."
                )
              );
            }, 60000);
          });

          const axiosInstance = axios.create({ timeout: 45000 });

          const retry = async (fn, retries = 3) => {
            for (let i = 0; i < retries; i++) {
              try {
                return await fn();
              } catch (err) {
                if (i === retries - 1) throw err;
                await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
              }
            }
          };

          // Check if price is missing for Smile products and log warning
          if (
            selectedItem.api === "smile" &&
            !selectedItem.price &&
            selectedItem.price !== 0
          ) {
            console.warn(
              `[ResellerCheckout] ⚠️ Missing price for Smile product: ${selectedItem.id} (${selectedItem.label})`
            );
          }

          const payload = {
            userId,
            zoneId,
            productId: selectedItem.id,
            ksmApi: import.meta.env.VITE_APP_KSM_API,
            uid: user.uid,
            cost: finalAmount,
            date: datePart,
            time: timePart,
            item: selectedItem.label,
            payment: "coin",
            username: user.username,
            gameUsername: username,
            idtrx: newOrderId,
            product: config.productName,
            productName: config.ProductName,
            api: selectedItem.api,
            price: selectedItem.price ?? "NOT_AVAILABLE",
          };

          const endpoint =
            selectedItem.api === "smile"
              ? `${import.meta.env.VITE_PAYMENT_URL}/smile/create-order`
              : `${import.meta.env.VITE_PAYMENT_URL}/yokcash/create-order`;

          // Wrap the order creation in a Promise.race with timeout
          const orderPromise = retry(() =>
            axiosInstance.post(endpoint, {
              ...payload,
              api: selectedItem.api || "yokcash",
            })
          );

          // Race between order creation and timeout
          const { data } = await Promise.race([orderPromise, operationTimeout]);

          const isSuccess =
            data?.status === 200 &&
            data?.order_id &&
            !["N/A", "Order Failed"].includes(data.order_id);

          if (isSuccess) {
            setOrderDetails({ ...data.orderData, id: newOrderId });
            setShowOrderModal(true);
          } else {
            throw new Error(data?.message || "Order failed");
          }
        } catch (err) {
          console.error("Order failed:", err);

          let errorMessage = `Order Failed for ${newOrderId}`;

          if (err.message?.includes("timeout") || err.code === "ECONNABORTED") {
            errorMessage = `Request timed out. Please check your connection and try again. Order ID: ${newOrderId}`;
          } else if (err.response) {
            // Server responded with error status
            const status = err.response.status;
            const serverMsg =
              err.response.data?.message || err.response.statusText;
            errorMessage = `Server error (${status}): ${
              serverMsg || "Please try again"
            } | ID: ${newOrderId}`;
          } else if (err.request) {
            // Request made but no response
            errorMessage = `No response from server. Please check your connection. Order ID: ${newOrderId}`;
          } else if (err.message) {
            errorMessage = `${err.message} | ID: ${newOrderId}`;
          }

          showAlert(errorMessage);
        } finally {
          // Always clear timeouts and reset disabled state
          if (timeoutId) clearTimeout(timeoutId);
          if (statusTimeoutId) clearTimeout(statusTimeoutId);
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
      {showOrderModal && (
        <OrderDetailModal
          orderData={orderDetails}
          onClose={() => {
            setShowOrderModal(false);
            resetForm();
          }}
        />
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
                className={`relative flex items-center justify-between py-3 px-4 rounded-md transition font-medium shadow-md border ${
                  isSelectedPayment === method
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-700"
                    : isDarkMode
                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                }`}
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
                    <span className="font-bold text-lg">₹{finalAmount}</span>
                  </>
                )}

                {method === "upi" && (
                  <>
                    <div className="flex items-center gap-3">
                      <img className="h-10" src={upi} alt="UPI" />
                      <span className="font-semibold">UPI / QR</span>
                    </div>
                    <span className="font-bold text-lg">
                      ₹{Math.round(finalAmount)}
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
            disabled={isDisabled || !selectedItem || selectedItem?.outOfStock}
            onClick={user ? handleCreateOrder : () => navigate("/login")}
            className={`relative w-full py-4 text-lg font-bold rounded-lg transition-all flex items-center justify-center gap-3 ${
              isDisabled || !selectedItem || selectedItem?.outOfStock
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg"
            }`}
          >
            {/* Normal states */}
            {selectedItem?.outOfStock ? (
              "Out of Stock"
            ) : user ? (
              isDisabled ? (
                <>
                  {/* Spinner */}
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </>
              ) : (
                "Buy Now"
              )
            ) : (
              "Login to Buy"
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ResellerCheckout;
