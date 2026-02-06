import React, { useState, useMemo, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const { user } = useUser();
  const uid = user?.uid;
  const { isDarkMode } = useDarkMode();
  const [orders, setOrders] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Debounce filter input for better performance
  useEffect(() => {
    const delay = setTimeout(() => setFilter(input.trim().toLowerCase()), 300);
    return () => clearTimeout(delay);
  }, [input]);

  // Helper: robust date parsing with fallbacks
  const safeParseTimestamp = (dateStr, timeStr, fallback = Date.now()) => {
    try {
      // normalize inputs
      const d = (dateStr || "").trim();
      const t = (timeStr || "").trim();

      // 1) If timestamp field present as number / string, try that (handled by caller if provided)
      // 2) Try DD-MM-YYYY or D-M-YYYY -> convert to MM/DD/YYYY for Date()
      if (d.includes("-")) {
        const parts = d.split("-").map((p) => Number(p));
        if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
          const [day, month, year] = parts;
          // guard invalid month/day/year
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
            const us = `${month}/${day}/${year} ${t || "12:00:00 AM"}`; // MM/DD/YYYY time
            const parsed = new Date(us).getTime();
            if (!Number.isNaN(parsed)) return parsed;
          }
        }
      }

      // 3) If date is in ISO or other parseable form, try Date(date + ' ' + time)
      if (d) {
        const tryIso = new Date(t ? `${d} ${t}` : d).getTime();
        if (!Number.isNaN(tryIso)) return tryIso;
      }

      // 4) Try Date(time) alone (rare)
      if (t) {
        const tryTime = new Date(t).getTime();
        if (!Number.isNaN(tryTime)) return tryTime;
      }

      // fallback
      return fallback;
    } catch (e) {
      return fallback;
    }
  };

  useEffect(() => {
    if (!uid) return;

    const cacheKey = `orders_${uid}`;
    const cacheExpiry = 7 * 12 * 60 * 60 * 1000; // 7 * 12 hours

    // Load cached orders if valid
    const loadCachedOrders = () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        const parsed = JSON.parse(cached);
        if (!parsed || !parsed.timestamp || !Array.isArray(parsed.orders)) return null;
        if (Date.now() - parsed.timestamp < cacheExpiry) return parsed.orders;
        return null;
      } catch {
        return null;
      }
    };

    const cachedOrders = loadCachedOrders();
    if (cachedOrders) setOrders(cachedOrders);

    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "orders"),
      (snapshot) => {
        try {
          const orderList = snapshot.docs
            .map((doc) => {
              const data = doc.data() || {};

              // Prefer an explicit numeric timestamp if provided
              let dateTimestamp = null;
              if (data.timestamp && !Number.isNaN(Number(data.timestamp))) {
                dateTimestamp = Number(data.timestamp);
              } else {
                // safe parse using date and time strings, fallback to 0 so sorting is stable
                dateTimestamp = safeParseTimestamp(data.date, data.time, 0);
              }

              // Normalize and provide defaults for fields that can be null
              return {
                docId: data.gameId || doc.id || "no-doc-id",
                uid: data.uid || data.userId || doc.id || "no-uid",
                item: data.item || "Unknown item",
                date: data.date || "00-00-0000",
                time: data.time || "00:00:00 AM",
                status: (data.status || "unknown").toString().toLowerCase(),
                cost: Number(data.cost ?? data.amount ?? 0) || 0,
                payment: data.payment || "unknown",
                userId: data.userId || "0",
                zoneId: data.zoneId || "0",
                username: data.username || "anonymous",
                mlUsername: data.mlUsername || data.mcUsername || data.gameUsername || "—",
                utr: data.utr || null,
                isTopup: data.isTopup ?? null,
                orderId: data.orderId || "",
                dateTimestamp,
                // keep all original raw data for debugging if needed
                __raw: data,
              };
            })
            .filter(Boolean)
            // keep your existing filter to remove explicit topups
            .filter((order) => order.isTopup !== false);

          // sort here (descending)
          orderList.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));

          setOrders(orderList);

          try {
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), orders: orderList }));
          } catch (e) {
            // ignore storage errors
            // console.warn("Failed caching orders", e);
          }
        } catch (err) {
          console.error("Error mapping snapshot:", err);
        }
      },
      (error) => {
        console.error("Error fetching orders:", error?.message || error);
      }
    );

    return () => {
      try {
        unsubscribe && unsubscribe();
      } catch {}
    };
  }, [uid]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => order.isTopup !== true) // filter out top-ups
      .filter((order) => {
        const search = filter;
        if (search) {
          const fields = [
            order.status,
            order.item,
            order.date,
            order.orderId,
            order.userId,
            order.zoneId,
            order.price,
            order.username,
            order.docId,
            order.uid,
          ];

          const matchesSearch = fields.some(
            (field) => field && field.toString().toLowerCase().includes(search)
          );

          if (!matchesSearch) return false;
        }

        if (statusFilter === "all") return true;
        return (order.status || "").toLowerCase() === statusFilter;
      })
      .sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));
  }, [filter, orders, statusFilter]);

  const getStatusIcon = (status) => {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "completed":
        return <FaCheckCircle size={24} className="text-green-500" />;
      case "pending":
        return <FaHourglassHalf size={24} className="text-yellow-500" />;
      case "failed":
        return <FaTimesCircle size={24} className="text-red-500" />;
      default:
        return <FaTimesCircle size={24} className="text-gray-400" />;
    }
  };

  const getPriceColor = (status) => {
    const s = (status || "").toString().toLowerCase();
    switch (s) {
      case "completed":
        return isDarkMode ? "text-green-400" : "text-green-700";
      case "pending":
        return isDarkMode ? "text-yellow-400" : "text-yellow-700";
      case "failed":
        return isDarkMode ? "text-red-400" : "text-red-700";
      default:
        return isDarkMode ? "text-gray-400" : "text-gray-700";
    }
  };

  const Row = ({ index, style }) => {
    const order = filteredOrders[index];
    if (!order) return null;

    return (
      <div
        style={style}
        className="cursor-pointer"
        onClick={() => {
          setSelectedOrder(order);
          setShowModal(true);
        }}
      >
        <div
          className={`grid grid-cols-3 items-center gap-1 px-4 py-2 mb-3 rounded-sm shadow-md transition duration-300
            ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}
          `}
          style={{
            backgroundImage: isDarkMode
              ? "linear-gradient(to right, rgba(255, 255, 255, 0.03), transparent)"
              : "linear-gradient(to right, rgb(254, 254, 254), transparent)",
          }}
        >
          <div className="flex flex-col">
            <span
              className={`font-semibold text-sm truncate ${
                order.status === "completed"
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-800"
                  : order.status === "pending"
                  ? isDarkMode
                    ? "text-yellow-400"
                    : "text-yellow-700"
                  : order.status === "failed"
                  ? isDarkMode
                    ? "text-red-400"
                    : "text-red-700"
                  : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-700"
              }`}
            >
              {order.item}
            </span>
            <span className={`text-[10px] truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {order.date || "00-00-0000"}, {order.time || "00:00:00 AM"}
            </span>
          </div>

          <div className={`text-xs font-mono truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {order.uid || order.docId || "0"}
          </div>

          <div className="flex flex-row items-center justify-between">
            <div className={`flex justify-center ${isDarkMode ? "text-green-300" : ""}`}>
              {getStatusIcon(order.status)}
            </div>
            <div className="flex justify-center"></div>
            <div className={`font-bold text-right ${getPriceColor(order.status)}`}>
              ₹{order.cost ?? 0}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setShowModal(false);
  };

  const isBrowser = typeof window !== "undefined";

  return (
    <div
      className={`px-4 mt-10 md:px-20 lg:px-40 flex flex-col min-h-[60vh] ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      <h2 className="text-xl font-bold mb-4 text-center">Your Orders</h2>

      <div className="mb-4 flex justify-center gap-2 flex-wrap">
        {["all", "pending", "completed", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full border text-sm ${
              statusFilter === status
                ? "bg-green-600 text-white"
                : isDarkMode
                ? "bg-gray-700 text-gray-300 border-gray-600"
                : "bg-white text-gray-600 border-gray-400"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="mb-6 flex justify-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by ID, item, status, or date"
          className={`p-1.5 rounded-md w-full max-w-md border ${
            isDarkMode ? "border-gray-600 bg-gray-800 text-gray-200" : "border-gray-400 bg-white text-gray-900"
          }`}
        />
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 h-[50vh]">No orders found.</p>
      ) : (
        <>
          <p className={isDarkMode ? "text-gray-300" : ""}>Click to view order details</p>
          {isBrowser ? (
            <List height={400} itemCount={filteredOrders.length} itemSize={70} width={"100%"}>
              {Row}
            </List>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((o, i) => (
                <div key={o.docId ?? i} onClick={() => { setSelectedOrder(o); setShowModal(true); }} className="cursor-pointer">
                  <div className={`px-4 py-2 mb-2 rounded border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{o.item}</div>
                        <div className="text-xs text-gray-500">{o.date} {o.time}</div>
                      </div>
                      <div className={`font-bold ${getPriceColor(o.status)}`}>₹{o.cost ?? 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && selectedOrder && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm ${isDarkMode ? " bg-opacity-60" : " bg-opacity-40"}`}
          onClick={closeModal}
        >
          <div
            className={`rounded-xl p-6 shadow-lg max-w-md w-full relative ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`absolute top-2 right-2 cursor-pointer ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-black"}`}
              onClick={closeModal}
              aria-label="Close order details"
            >
              ✖
            </button>

            <h3 className="text-lg font-bold mb-4">Order Details</h3>

            <div className="space-y-2 text-sm">
              <p><strong>Order ID:</strong> {selectedOrder.docId || "No order id"}</p>
              <p><strong>Item:</strong> {selectedOrder.item || "—"}</p>
              <p><strong>Status:</strong> {selectedOrder.status || "—"}</p>
              <p><strong>Date:</strong> {selectedOrder.date || "00-00-0000"}, {selectedOrder.time || "00:00:00 AM"}</p>
              <p><strong>Cost:</strong> ₹{selectedOrder.cost ?? 0}</p>
              <p><strong>Payment Option:</strong> {selectedOrder.payment || "—"}</p>
              <p><strong>User ID:</strong> {selectedOrder.userId || "0"}</p>
              <p><strong>Server ID:</strong> {selectedOrder.zoneId || "0"}</p>
              <p><strong>Username:</strong> {selectedOrder.username || "anonymous"}</p>
              <p><strong>IGN:</strong> {selectedOrder.mlUsername || selectedOrder.mcUsername || selectedOrder.gameUsername || "—"}</p>

              {selectedOrder.payment === "upi" && selectedOrder.utr ? (
                <p className="text-green-400 break-words">{selectedOrder.utr}</p>
              ) : (
                <p className="font-bold text-red-400">No UTR</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
