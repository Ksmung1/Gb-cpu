import React from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";

const OrderDetailModal = ({ orderData, onClose, navigateTo='/orders' }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  if (!orderData) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
    >
      {/* Click outside to close (optional) */}
      <div
        className="absolute inset-0 bg-opacity-50"
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full max-w-md rounded-xl p-6 shadow-lg ${
          isDarkMode
            ? "bg-zinc-900 text-gray-200"
            : "bg-white text-gray-900"
        }`}
      >
        <h2
          className={`text-xl font-bold mb-4 ${
            isDarkMode ? "text-green-400" : "text-green-600"
          }`}
        >
          ✅ Payment Successful!
        </h2>

        <div className="space-y-2 text-sm">
          <p><strong>Order ID:</strong> {orderData?.id || orderData?.orderId}</p>
          <p><strong>Product:</strong> {orderData?.product || orderData?.item || "N/A"}</p>
          {orderData?.item && orderData?.item !== orderData?.product && (
            <p><strong>Item:</strong> {orderData?.item}</p>
          )}
          {orderData?.cost && (
            <p><strong>Amount:</strong> ₹{orderData?.cost}</p>
          )}
          {orderData?.utr && (
            <p><strong>UTR:</strong> {orderData?.utr}</p>
          )}
          {orderData?.userId && (
            <p><strong>User ID:</strong> {orderData?.userId}</p>
          )}
          {orderData?.zoneId && (
            <p><strong>Zone ID:</strong> {orderData?.zoneId}</p>
          )}
          {orderData?.username && (
            <p><strong>Username:</strong> {orderData?.username}</p>
          )}
          <p>
            <strong>Status:</strong>{" "}
            <span className="capitalize font-semibold text-green-600">
              {orderData?.status || "completed"}
            </span>
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => navigate(navigateTo)}
            className={`px-4 py-2 rounded text-sm font-semibold transition ${
              isDarkMode
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            View Status
          </button>

          <button
            onClick={onClose}
            className={`px-4 py-2 rounded text-sm font-semibold transition ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                : "bg-gray-300 hover:bg-gray-400 text-gray-900"
            }`}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
