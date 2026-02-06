import React, { useState } from "react";
import { FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useDarkMode } from "../../context/DarkModeContext";
import OrderDetailsModal from "./OrderDetails"

const OrderCard = ({ order }) => {
  const status = order.status?.toLowerCase();
  const { isDarkMode } = useDarkMode();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className={`p-3 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition ${
          isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="grid grid-cols-4 items-center text-xs font-medium ">
          <div>{order.username || order.user}</div>
          <div className={`truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {order.gameId || order.id || "N/A"}
          </div>
          <div>{order.date || "N/A"}, {order.time || ""}</div>
          <div className="flex flex-col items-end gap-1">
            <span className={order.isTopup ? "text-green-500" : "text-green-500"}>
              ₹{order.amount || order.cost || "N/A"}
            </span>
            {status === "pending" && <FaClock className="text-yellow-400" />}
            {status === "completed" && <FaCheckCircle className="text-green-500" />}
            {status === "failed" && <FaTimesCircle className="text-red-500" />}
          </div>
        </div>
      </div>

      {showModal && (
        <OrderDetailsModal order={order} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default OrderCard;
