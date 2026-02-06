import { useDarkMode } from "../../context/DarkModeContext";

const OrderDetailsModal = ({ order, onClose }) => {
  const { isDarkMode } = useDarkMode();
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dim background */}
      <div
        className={`absolute inset-0 backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={`relative z-10 w-full max-w-md rounded-xl p-6 shadow-lg ${
          isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
        }`}
      >
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-green-400" : "text-black"}`}>
          📋 Order Details
        </h2>

        <div className="space-y-2 text-sm">
          <p><strong>ID:</strong> {order.id}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`capitalize font-medium ${
                order.status === "pending"
                  ? "text-yellow-500"
                  : order.status === "fail"
                  ? "text-red-500"
                  : order.status === "processing"
                  ? "text-blue-400"
                  : "text-green-500"
              }`}
            >
              {order.status || "No status"}
            </span>
          </p>
          <p><strong>Item:</strong> {order.item || order.label || "N/A"}</p>
          <p><strong>Price:</strong> ₹{order.price || order.cost || "N/A"}</p>
          <p><strong>Date:</strong> {order.date || "-"} {order.time || "-"}</p>
          <p><strong>User ID:</strong> {order.userId || "N/A"}</p>
          <p><strong>Zone ID:</strong> {order.zoneId || "N/A"}</p>
          <p><strong>IGN:</strong> {order.mlUsername || "N/A"}</p>
        </div>

        <button
          onClick={onClose}
          className={`mt-6 px-4 py-2 rounded w-full text-sm font-semibold transition ${
            isDarkMode
              ? "bg-green-700 hover:bg-green-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
