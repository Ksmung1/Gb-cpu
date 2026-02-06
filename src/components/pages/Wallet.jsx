import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaPlus,
} from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/firebase";
import coin from "../../assets/images/coin.png";
import { GiCancel } from "react-icons/gi";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAlert } from "../../context/AlertContext";
import axios from "axios";
import BharatTutorial from "../RechargeComponents/RechargeUtils/BharatTutorial";
import { useBharatToggle } from "../../utils/useBharatToggle";
import qs from "qs";
// ------------ Reusable Modal ------------
const CustomModal = ({
  isOpen,
  title,
  content,
  onConfirm,
  onCancel,
  loading,
  hideButtons = false,
}) => {
  const { isDarkMode } = useDarkMode();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
      <div
        className={`rounded-2xl max-w-2xl w-full p-6 space-y-6 relative shadow-2xl transition-all duration-300 ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <h2 className="text-2xl font-bold text-center">{title}</h2>
        <div>{content}</div>

        {!hideButtons && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onCancel}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-black"
              }`}
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium text-white transition flex items-center justify-center gap-2 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              {loading ? (
                <>
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
                "Confirm"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------ Main Wallet Component ------------
const Wallet = () => {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [orderToCreate, setOrderToCreate] = useState(null);

  const { isDarkMode } = useDarkMode();
  const { showAlert } = useAlert();
  const { user } = useUser();
  const navigate = useNavigate();
  const uid = user?.uid;

  // Bharat Toggle Hook
  const { showTutorial, hideForever } = useBharatToggle();
  const hasShownTutorial = useRef(false);
  const [tutorialDone, setTutorialDone] = useState(false);

  const parsedAmount = useMemo(
    () => (amount ? parseFloat(amount) : 0),
    [amount]
  );

  // Local date + time formatter
  const getLocalDateAndTime = () => {
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

    return { date: dateString, time: timeString };
  };

  const { date: datePart, time: timePart } = useMemo(
    () => getLocalDateAndTime(),
    []
  );

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => setFilter(input), 300);
    return () => clearTimeout(delay);
  }, [input]);

  // Firestore subscription
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "orders"),
      (snapshot) => {
        const orderList = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const dateStr = data.date;
            const timeStr = data.time || "12:00:00 AM";
            let dateTimestamp = 0;

            if (dateStr && dateStr.includes("-")) {
              const [day, month, year] = dateStr.split("-");
              const fullDate = `${month}/${day}/${year} ${timeStr}`;
              dateTimestamp = new Date(fullDate).getTime();
            }

            return { docId: doc.id, ...data, dateTimestamp };
          })
          .filter((order) => order.isTopup === true);

        setTransactions(orderList);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  // ----------- Handlers -----------
  const handleAddMoney = (e) => {
    e.preventDefault();

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      showAlert("Please enter a valid amount");
      return;
    }
    if (parsedAmount >= 20000) {
      showAlert("Maximum top-up limit is ₹19,999");
      return;
    }

    const newOrder = {
      uid: user?.uid,
      username: user?.username || "",
      amount: parsedAmount,
      date: datePart,
      time: timePart,
    };

    // If Bharat tutorial is enabled and not yet shown
    if (showTutorial && !hasShownTutorial.current && !tutorialDone) {
      hasShownTutorial.current = true;
      setOrderToCreate(newOrder);
      setShowCustomModal(true); // Show tutorial modal
      return;
    }

    // Skip tutorial / already done -> show confirm modal
    setOrderToCreate(newOrder);
    setShowCustomModal(true);
  };

  const confirmTopUp = async () => {
    if (!orderToCreate) return;

    try {
      setLoadingPayment(true);
      setIsDisabled(true);

      // Call backend /topup-coin endpoint
      // Backend expects: { uid, amount, username, date, time }
      const endpoint = user?.role === "admin" ? "topup-coin"  : user?.role === "reseller" ? "topup-coin" : "customer-coin";
      const { data } = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/${endpoint}`,
      {
          uid: orderToCreate.uid,
          amount: parsedAmount,
          username: orderToCreate.username || user?.username || "",
          date: orderToCreate.date,
          time: orderToCreate.time,
        }
      );

      if (data?.success && data?.orderId) {
        if (user?.role === "reseller" || user?.role === "admin") {
          window.location.href = data.payment_url;
        } else {
          navigate(`/payment/${data.orderId}`);
        }
      } else {
        throw new Error(data?.message || "Failed to create payment order");
      }
    } catch (err) {
      console.error("Top-up error:", err);

      let errorMessage = "Top-up failed. Please try again.";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMessage =
          "Request timed out. Please check your connection and try again.";
      } else if (err.response) {
        errorMessage = `Top-up failed: ${
          err.response.data?.message ||
          err.response.statusText ||
          "Server error"
        }`;
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      showAlert(errorMessage);
      setLoadingPayment(false);
      setIsDisabled(false);
      setShowCustomModal(false);
      setOrderToCreate(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    const search = filter.toLowerCase();

    return transactions
      .filter((t) =>
        [t.status, t.item, t.date, t?.uid, t.user, t.utr].some((field) =>
          (field || "").toString().toLowerCase().includes(search)
        )
      )
      .sort((a, b) => b.dateTimestamp - a.dateTimestamp);
  }, [filter, transactions]);

  const getStatusIcon = (status) => {
    if (status === "completed")
      return <FaCheckCircle className="text-green-500" />;
    if (status === "pending")
      return <FaHourglassHalf className="text-yellow-500" />;
    return <FaTimesCircle className="text-red-500" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return isDarkMode ? "text-green-400" : "text-green-700";
      case "pending":
        return isDarkMode ? "text-yellow-400" : "text-yellow-700";
      case "failed":
        return isDarkMode ? "text-red-400" : "text-red-700";
      default:
        return isDarkMode ? "text-gray-400" : "text-gray-600";
    }
  };

  const Row = ({ index, style }) => {
    const order = filteredTransactions[index];
    return (
      <div style={style} className="px-2 py-1">
        <div
          className={`grid grid-cols-3 items-center rounded-lg p-3 shadow cursor-pointer transition hover:shadow-lg ${
            isDarkMode
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-white hover:bg-gray-50"
          }`}
          onClick={() => {
            setSelectedOrder(order);
            setShowModal(true);
          }}
        >
          <div>
            <div
              className={`text-sm font-semibold ${getStatusColor(
                order.status
              )}`}
            >
              {order.item || "Wallet Top-Up"}
            </div>
            <div
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {order.date} {order.time}
            </div>
          </div>

          <div
            className={`text-xs font-mono ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {order.id || order.docId || "-"}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {getStatusIcon(order.status)}
            <span className={`font-bold ${getStatusColor(order.status)}`}>
              ₹{order.amount}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ------------ JSX ------------
  return (
    <div
      className={`flex flex-col items-center px-2 pt-5 md:px-20 lg:px-40 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50"
      }`}
    >
      <h1 className="text-3xl font-bold mb-3">My Wallet</h1>

      {/* Balance card */}
      <div className="w-full max-w-md mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl p-4 shadow-xl flex flex-col md:flex-row justify-between items-center">
        <div>
          <p className="text-lg opacity-90">Wallet Balance</p>
          <div className="flex items-center gap-3 text-4xl font-bold mt-2">
            ₹{parseFloat(user?.balance || "0").toFixed(2)}
            <img src={coin} alt="coin" className="w-12 h-12" />
          </div>
        </div>
        <button
          onClick={() => setShowTopupModal(true)}
          className="mt-4 md:mt-0 bg-white text-purple-600 px-4 py-2 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center gap-2"
        >
          <FaPlus /> Add Balance
        </button>
      </div>

      {/* Top-Up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-2xl p-8 shadow-2xl max-w-sm w-full relative`}
          >
            <GiCancel
              size={28}
              className="absolute top-4 right-4 cursor-pointer hover:text-red-500 transition"
              onClick={() => setShowTopupModal(false)}
            />
            <h2 className="text-2xl font-bold mb-6 text-center">
              Top Up Wallet
            </h2>
            <form onSubmit={handleAddMoney}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="1"
                max="19999"
                placeholder="Enter amount (₹)"
                className={`w-full border-2 rounded-xl px-4 py-4 text-lg text-center font-semibold focus:outline-none focus:border-purple-500 transition ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-300"
                }`}
              />
              <button
                type="submit"
                disabled={isDisabled || !amount}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-white text-lg transition ${
                  !amount || isDisabled
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                }`}
              >
                Continue to Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bharat Tutorial + Confirm Modal */}
      <CustomModal
        isOpen={showCustomModal}
        title={
          showTutorial && hasShownTutorial.current && !tutorialDone
            ? "How to Pay with UPI (Bharat)"
            : "Confirm Top-Up"
        }
        content={
          showTutorial && hasShownTutorial.current && !tutorialDone ? (
            <BharatTutorial
              onContinue={() => {
                setTutorialDone(true);
                hasShownTutorial.current = false;
              }}
              onDontShowAgain={() => {
                hideForever();
                setTutorialDone(true);
                hasShownTutorial.current = false;
              }}
            />
          ) : (
            <div className="text-center max-w-md mx-auto py-4">
              <p className="text-2xl font-bold mb-4">
                Add ₹{parsedAmount || 0} to Wallet?
              </p>
              <p className="text-sm opacity-80">
                You will be shown a QR code to complete payment via UPI.
              </p>
            </div>
          )
        }
        onConfirm={confirmTopUp}
        onCancel={() => {
          setShowCustomModal(false);
          setOrderToCreate(null);
          hasShownTutorial.current = false;
          setTutorialDone(false);
        }}
        loading={loadingPayment}
        hideButtons={showTutorial && hasShownTutorial.current && !tutorialDone}
      />

      {/* Transaction History */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search transactions..."
          className={`w-full max-w-md mb-6 px-4 py-3 rounded-xl border-2 focus:outline-none transition ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              : "bg-white border-gray-300 placeholder-gray-400"
          }`}
        />

        {filteredTransactions.length > 0 ? (
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <List
              height={500}
              itemCount={filteredTransactions.length}
              itemSize={90}
              width="100%"
            >
              {Row}
            </List>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No top-up transactions yet.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <div
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-2xl p-8 shadow-2xl max-w-md w-full relative`}
          >
            <button
              className="absolute top-4 right-4 text-2xl font-bold hover:text-red-500"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-6 text-center">
              Top-Up Details
            </h3>
            <div className="space-y-3 text-lg">
              <p>
                <strong>Order ID:</strong>{" "}
                {selectedOrder.id || selectedOrder.docId || "-"}
              </p>
              <p>
                <strong>Amount:</strong> ₹{selectedOrder.amount}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </span>
              </p>
              <p>
                <strong>Date:</strong> {selectedOrder.date} {selectedOrder.time}
              </p>
              {selectedOrder.utr && (
                <p>
                  <strong>UTR:</strong> {selectedOrder.utr}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
