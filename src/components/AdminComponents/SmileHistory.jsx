import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useDarkMode } from "../../context/DarkModeContext";

const SmileHistory = ({ isDarkMode }) => {
  const [smileHistory, setSmileHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");

  useEffect(() => {
    const q = query(
      collection(db, "smileHistory"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const history = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSmileHistory(history);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching smile history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredHistory = smileHistory.filter((item) => {
    const matchSearch =
      item.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      item.userId?.toLowerCase().includes(search.toLowerCase()) ||
      item.productId?.toLowerCase().includes(search.toLowerCase()) ||
      item.product?.toLowerCase().includes(search.toLowerCase());

    const matchProduct =
      filterProduct === "all" || item.product === filterProduct;

    return matchSearch && matchProduct;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  const getUniqueProducts = () => {
    const products = [...new Set(smileHistory.map((item) => item.product))];
    return products.filter(Boolean);
  };

  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    let itemDate;
    if (timestamp.toDate) {
      itemDate = timestamp.toDate();
    } else if (timestamp.seconds) {
      itemDate = new Date(timestamp.seconds * 1000);
    } else {
      itemDate = new Date(timestamp);
    }
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() === getTodayDate().getTime();
  };

  const dailyBalanceUsed = smileHistory
    .filter((item) => isToday(item.createdAt))
    .reduce((sum, item) => sum + (item.balanceUsed || 0), 0);

  const totalBalanceUsed = filteredHistory.reduce(
    (sum, item) => sum + (item.balanceUsed || 0),
    0
  );

  const missingPriceCount = filteredHistory.filter(
    (item) =>
      item.price === "NOT_AVAILABLE" ||
      item.price === null ||
      item.price === undefined
  ).length;

  if (loading) {
    return (
      <div
        className={`text-center py-10 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-4">Loading Smile history...</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Smile Usage History</h2>

        {/* Summary Card */}
        <div
          className={`p-4 rounded-lg mb-4 ${
            isDarkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm opacity-70">Today's Usage</p>
              <p className="text-2xl font-bold text-orange-500">
                {dailyBalanceUsed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Total Records</p>
              <p className="text-2xl font-bold">{filteredHistory.length}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Total Balance Used</p>
              <p className="text-2xl font-bold text-red-500">
                {totalBalanceUsed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Missing Price</p>
              <p
                className={`text-2xl font-bold ${
                  missingPriceCount > 0 ? "text-yellow-500" : "text-green-500"
                }`}
              >
                {missingPriceCount}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Current Filter</p>
              <p className="text-lg font-semibold">
                {filterProduct === "all" ? "All Products" : filterProduct}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by Order ID, User ID, Product ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 border px-3 py-2 rounded ${
              isDarkMode
                ? "bg-gray-700 text-gray-100 border-gray-600"
                : "bg-white border-gray-300"
            }`}
          />
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode
                ? "bg-gray-700 text-gray-100 border-gray-600"
                : "bg-white border-gray-300"
            }`}
          >
            <option value="all">All Products</option>
            {getUniqueProducts().map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div
          className={`text-center py-10 rounded-lg ${
            isDarkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <p className="text-lg">No Smile history found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const hasMissingPrice =
              item.price === "NOT_AVAILABLE" ||
              item.price === null ||
              item.price === undefined;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border ${
                  hasMissingPrice
                    ? isDarkMode
                      ? "bg-yellow-900/20 border-yellow-600/50 hover:bg-yellow-900/30"
                      : "bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
                    : isDarkMode
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                } transition-colors`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm opacity-70 mb-1">Order ID</p>
                    <p className="font-mono text-sm font-semibold">
                      {item.orderId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70 mb-1">Product</p>
                    <p className="font-semibold">{item.product || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70 mb-1">Buyer</p>
                    <p className="font-mono text-sm">{item.buyer || "N/A"}</p>
                  </div>

                  <div>
                    <p className="text-sm opacity-70 mb-1">Date</p>
                    <p className="text-sm">{formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-600">
                  <div>
                    <p className="text-sm opacity-70 mb-1">Balance Before</p>
                    <p className="text-lg font-bold text-blue-400">
                      {item.balanceBefore?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70 mb-1">Balance After</p>
                    <p className="text-lg font-bold text-green-400">
                      {item.balanceAfter?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70 mb-1">Balance Used</p>
                    <p className="text-lg font-bold text-red-400">
                      {item.balanceUsed?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70 mb-1">Price (₹)</p>
                    {item.price === "NOT_AVAILABLE" ||
                    item.price === null ||
                    item.price === undefined ? (
                      <p className="text-lg font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded inline-block">
                        ⚠️ Not Available
                      </p>
                    ) : (
                      <p className="text-lg font-semibold">₹{item.price}</p>
                    )}
                  </div>
                </div>
                <div className="grid  grid-cols-4">
                  {item.productId && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm opacity-70 mb-1">Product ID</p>
                      <p className="font-mono text-sm">{item.productId}</p>
                    </div>
                  )}
                  {item.item && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm opacity-70 mb-1">Item</p>
                      <p className="font-mono text-sm">{item.item}</p>
                    </div>
                  )}
                  {item.buyerId && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm opacity-70 mb-1">Buyer ID</p>
                      <p className="font-mono text-sm">{item.buyerId}</p>
                    </div>
                  )}

                  {item.yokOrderId && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm opacity-70 mb-1">Smile Order ID</p>
                      <p className="font-mono text-sm">{item.yokOrderId}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmileHistory;
