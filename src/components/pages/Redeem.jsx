import React, { useEffect, useState } from "react";
import { db } from "../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useUser } from "../../context/UserContext";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useDarkMode } from "../../context/DarkModeContext";
import OrderDetailsModal from "../modal/OrderDetailsModal";

const getStatusIcon = (status) => {
  const s = status?.toLowerCase();
  if (s === "completed") return <span className="text-green-600">✅</span>;
  if (s === "pending") return <span className="text-yellow-500">🕒</span>;
  if (s === "fail") return <span className="text-red-500">❌</span>;
  if (s === "processing") return <span className="text-blue-500">⚙️</span>;
  if (s === "refunded") return <span className="text-blue-500">💸</span>;
  return <span className="text-gray-500">❔</span>;
};

const Redeem = () => {
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [mlOrders, setMlOrders] = useState([]);
  const [skinOrders, setSkinOrders] = useState([]);
  const [charmsOrders, setCharmsOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("ml");

  // Helper to sort by createdAt descending
  const sortByCreatedAtDesc = (a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  };


useEffect(() => {
  if (!user?.uid) return;

  const accRef = collection(db, `users/${user.uid}/accounts-ml`);
  const skinRef = collection(db, `users/${user.uid}/skin-orders`);
  const charmsRef = collection(db, `users/${user.uid}/charms-orders`);

  const unsub1 = onSnapshot(accRef, (snap) => {
    const data = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortByCreatedAtDesc);
    setMlOrders(data);
  });

const unsub2 = onSnapshot(skinRef, (snap) => {
  const data = snap.docs
    .map((doc) => {
      const order = { id: doc.id, ...doc.data() };
      return order;
    })
    .sort(sortByCreatedAtDesc);
  setSkinOrders(data);
});


  const unsub3 = onSnapshot(charmsRef, (snap) => {
    const data = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortByCreatedAtDesc);
    setCharmsOrders(data);
  });

  return () => {
    unsub1();
    unsub2();
    unsub3();
  };
}, [user]);

  // Render function shared style with grid for all tabs
  const renderOrdersGrid = (orders, labelField, extraFields = []) => (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <p className="text-sm text-gray-400">No orders found.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            onClick={() => {
              setSelectedOrder(order);
              setShowModal(true);
            }}
            className={`grid grid-cols-3 items-center gap-2 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
              isDarkMode ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <div className="flex flex-col truncate">
              <span className={`font-semibold truncate ${
                isDarkMode ? "text-green-400" : "text-green-800"
              }`}>
                {order[labelField] || order.label || "N/A"}
              </span>
              <span className={`text-xs font-mono truncate ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                {order.date || ""} {order.time || ""}
              </span>
            </div>

            {activeTab === "skin"  ? (
  <div className={`text-xs italic ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
    Delivery: {order.deliveryDate}
  </div>
) : (
   <div className={`text-xs italic ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
{order.id}
  </div>
)}


            <div className="flex items-center justify-between">
              <div>{getStatusIcon(order.status)}</div>
<div>
  <FaMinus
    className={`${
      order.status === "completed"
        ? "text-green-500"
        : order.status === "pending"
        ? "text-yellow-500"
        : order.status === "fail"
        ? "text-red-500"
        : order.status === "processing"
        ? "text-blue-500"
        : order.status === 'refunded'
        ? "text-orange-500"
        : "text-gray-500"
    }`}
    size={12}
  />
</div>
           <div
  className={`font-bold text-right ${
    order.status === "completed"
      ? isDarkMode
        ? "text-green-400"
        : "text-green-700"
      : order.status === "pending"
      ? isDarkMode
        ? "text-yellow-400"
        : "text-yellow-600"
      : order.status === "fail"
      ? isDarkMode
        ? "text-red-400"
        : "text-red-700"
      : order.status === "processing"
      ? isDarkMode
        ? "text-blue-400"
        : "text-blue-700"
      : isDarkMode
      ? "text-gray-400"
      : "text-gray-700"
  }`}
>
  ₹{order.price || order.cost || order.amount || 0}
</div>


            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={`px-4 pt-10 mb-5 md:px-20 lg:px-40 ${
      isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
    }`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-green-400" : ""}`}>
        🧾 Your Orders
      </h2>

      {/* Tab Buttons */}
      <div className="flex gap-3 mb-4">
        {["ml", "skin", "charms"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1 text-sm rounded-full border ${
              activeTab === tab
                ? isDarkMode
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-green-100 text-green-800 border-green-400"
                : isDarkMode
                ? "border-gray-700 text-gray-400"
                : "border-gray-300 text-gray-600"
            }`}
          >
            {tab === "ml" ? "ML Orders" : tab === "skin" ? "Skin Gifts" : "Charisma"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 p-1">
        {activeTab === "ml" && renderOrdersGrid(mlOrders, "description")}
        {activeTab === "skin" && renderOrdersGrid(skinOrders, "description")}
        {activeTab === "charms" && renderOrdersGrid(charmsOrders, "item")}
      </div>

      {showModal && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Redeem;
