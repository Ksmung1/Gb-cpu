import React from "react";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAlert } from "../../context/AlertContext";
import { FaTimes } from "react-icons/fa";

const OrderDetailsModal = ({ order, onClose }) => {
  const { isDarkMode } = useDarkMode();
  const { showAlert } = useAlert();

  const formattedID = order.zoneId && order.userId
    ? `${order.userId} (${order.zoneId})`
    : "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2">
      <div className={`max-w-md w-full rounded-xl p-5 shadow-lg relative ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}>
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        <h2 className="text-lg font-bold mb-3">Order Details</h2>
        <div className="space-y-2 text-sm">
          <CopyField label="Order ID" value={order.gameId || order.id} />
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Amount:</strong> ₹{order.amount || order.cost}</p>
          <CopyField label="User" value={order.username || order.user} />
          <CopyField label="UserUid" value={order.user} />
          <p><strong>Type:</strong> {order.isTopup ? "Topup" : "ML Order"}</p>
          <p><strong>Date & Time:</strong> {order.date} {order.time}</p>
          <p><strong>Payment:</strong> {order.payment}</p>
          {order?.payment === 'upi' && (<p><strong>UTR: </strong>{order.utr || "No UTR"}</p>)}

          {!order.isTopup && (
            <>
              <CopyField label="UserID" value={formattedID} />
              <p><strong>Username:</strong> {order.mlUsername || order.gameUsername}</p>
              <p><strong>API Order ID:</strong> {order.orderId || order.yokOrderId || order.smileOrderId ||  "Order failed"}</p>
            </>
          )}


          <p><strong>Info:</strong> {order.item || "N/A"}</p>

      
{Array.isArray(order.message) && order.message.length > 1 && (
  <ol>
    {order.message.map((item, index) => (
      <li key={index}>
        {item.iteration}. ({item.productId}) {item.message}
      </li>
    ))}
  </ol>
)}
{order.error && (
  <ol>
    {(Array.isArray(order.error) ? order.error : [order.error]).map((item, index) => (
      <li key={index}>
        {item?.iteration ? `${item.iteration}. ` : ""}
        {item?.productId ? `(${item.productId}) ` : ""}
        {item?.data?.message || item?.message || item?.error}
      </li>
    ))}
  </ol>
)}


        </div>
      </div>
    </div>
  );
};

const CopyField = ({ label, value }) => {
  const { showAlert } = useAlert();

  return (
    <p
      className="hover:underline cursor-pointer"
      onClick={() => {
        navigator.clipboard.writeText(value);
        showAlert(`${label} copied!`);
      }}
    >
      <strong>{label}:</strong> {value || "N/A"}
    </p>
  );
};

export default OrderDetailsModal;
