import React, { useState } from "react";
import { FaRegCopy, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useDarkMode } from "../../../context/DarkModeContext";

const OrdersCard = ({
  order,
  type,
  editing,
  onEditChange,
  onSave,
  onCopy,
  onMarkPaid,
  onMarkFail,
  onMarkStatus,
  onMarkRefund,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isPending = order.status === "pending";
  const {isDarkMode} = useDarkMode()
return (
  <div
    className={`border rounded p-3 mb-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${
      isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-900"
    }`}
    onClick={() => setExpanded((prev) => !prev)}
  >
    <div className="flex justify-between items-center">
      <div>
        <p><strong>Item:</strong> {order.item || ''}</p>
        <p><strong>Status:</strong> {order.status || "N/A"}</p>
      </div>
      <div className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {expanded ? <FaChevronUp /> : <FaChevronDown />}
      </div>
    </div>

    {expanded && (
      <div className={`mt-2 space-y-2 ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
        {order.item && <p><strong>OrderId:</strong> {order.id || order.uid}</p>}
        {order.description && <p><strong>Description:</strong> {order.description}</p>}
        <p><strong>Price:</strong> ₹{order.price || order.cost || "N/A"}</p>

        {(order.username || order.user) && (
          <p><strong>User:</strong> {order.username || order.user}</p>
        )}

        {order.phone && <p><strong>Phone:</strong> {order.phone}</p>}
        {order.email && <p><strong>Email:</strong> {order.email}</p>}
        {order.mlUsername && <p><strong>IGN:</strong> {order.mlUsername}</p>}
        {order.contactValue && <p><strong>Contact:</strong> {order.contactValue}</p>}
        {order.deliveryDate && <p><strong>Delivery Date:</strong> {order.deliveryDate}</p>}

        {(order.userId || order.zoneId) && (
          <p className="flex items-center gap-2">
            <strong>ID:</strong> {order.userId || "N/A"} ({order.zoneId || "N/A"})
            <FaRegCopy
              className={`cursor-pointer text-blue-500 hover:text-blue-700 ${
                isDarkMode ? "dark:text-blue-400 dark:hover:text-blue-600" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onCopy(`${order.userId} (${order.zoneId})`);
              }}
              aria-label="Copy ID"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCopy(`${order.userId} (${order.zoneId})`);
                }
              }}
            />
          </p>
        )}

        {isPending && type === "ml-accounts" && (
          <>
            <input
              type="text"
              placeholder="Email / Username"
              className={`w-full border rounded px-3 py-1 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : ""
              }`}
              value={editing?.email || ""}
              onChange={(e) => onEditChange("email", e.target.value)}
            />
            <input
              type="text"
              placeholder="Password"
              className={`w-full border rounded px-3 py-1 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : ""
              }`}
              value={editing?.password || ""}
              onChange={(e) => onEditChange("password", e.target.value)}
            />
            <input
              type="text"
              placeholder="Login Instructions (optional)"
              className={`w-full border rounded px-3 py-1 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : ""
              }`}
              value={editing?.loginInfo || ""}
              onChange={(e) => onEditChange("loginInfo", e.target.value)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className="mt-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-1 rounded"
              disabled={!editing?.email?.trim() || !editing?.password?.trim()}
            >
              ✅ Mark as Delivered
            </button>
          </>
        )}

        {isPending && type === "charms" && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkPaid();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
            >
              Paid
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkFail();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Failed
            </button>
             <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRefund();
              }}
              className="bg-blue-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
             Refund
            </button>
          </div>
        )}

        {isPending && type === "skins" && (
          <div className="flex gap-2">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onMarkStatus("processing");
              }}
            >
              ✅
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onMarkStatus("fail");
              }}
            >
              ❌
            </button>
                <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onMarkStatus("refunded");
              }}
            >
              💸 
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

};

export default OrdersCard;
