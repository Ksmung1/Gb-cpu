import React, { useEffect, useState } from "react";
import { fetchUsers } from "../../utils/fetchUsers";
import { fetchGlobalOrders } from "../../utils/fetchGlobalOrders";
import { useDarkMode } from "../../context/DarkModeContext";
import axios from "axios";
import { fetchGlobalCount } from "../../utils/fetchGlobalsCount";

const timePeriods = ["day", "month", "all"];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    mlbbOrders: 0,
    genshinOrders: 0,
    mcggOrders: 0,
    mlaccOrders: 0,
    charmsOrders: 0,
    upiTransactions: 0,
    totalEarnings: 0,
  });
  const { isDarkMode } = useDarkMode();

  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const [smile, setSmile] = useState(null);

  // Parse "dd-mm-yyyy" to Date
  const parseCustomDate = (str) => {
    if (!str) return null;
    const [day, month, year] = str.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const users = await fetchUsers();
        const orders = await fetchGlobalOrders();
        const now = new Date();

        const filteredOrders = orders.filter((order) => {
          const rawDate = order.timestamp || order.date;
          const orderDate =
            rawDate instanceof Date ? rawDate : parseCustomDate(rawDate);

          if (!orderDate || isNaN(orderDate.getTime())) return false;

          if (selectedPeriod === "day") {
            return (
              orderDate.getDate() === now.getDate() &&
              orderDate.getMonth() === now.getMonth() &&
              orderDate.getFullYear() === now.getFullYear()
            );
          } else if (selectedPeriod === "month") {
            return (
              orderDate.getMonth() === now.getMonth() &&
              orderDate.getFullYear() === now.getFullYear()
            );
          }
          return true; // for "all"
        });

        const totalOrders = await fetchGlobalCount();

        const mlbbOrders = totalOrders.filter(
          (order) =>
            (order.id || order.gameId).toUpperCase().startsWith("MLBB") ||
            (order.id).toUpperCase().startsWith("MGYOK")
        );
        const mcggOrders = totalOrders.filter((order) =>
          (order.id || order.gameId).toUpperCase().startsWith("MCGG")
        );
        const mlaccOrders = totalOrders.filter((order) =>
          (order.id || order.gameId).toUpperCase().startsWith("MLACC")
        );
        const charmsOrders = filteredOrders.filter((order) =>
          (order.id || order.gameId).toUpperCase().startsWith("CHARMS")
        );
        const genshinOrders = totalOrders.filter((order) =>
          (order.id || order.gameId).toUpperCase().startsWith("GENSHIN")
        );

        const upiOrders = totalOrders.filter(
          (order)=> (order.id).toUpperCase().startsWith("PAY")
        );
        const completedTotalOrders = totalOrders.filter(
          (order) => order.status === "completed"
        );
        console.log(completedTotalOrders)

        const totalEarnings = completedTotalOrders.reduce((sum, order) => {
          const amount = parseFloat(order.amount || 0);
          const cost = parseFloat(order.cost || 0);

          if ((order.type || "").toLowerCase() === "topup") {
            return sum + amount;
          } else {
            return sum + cost;
          }
        }, 0);

        setStats({
          totalUsers: users.length,
          totalOrders: totalOrders.length,
          mlbbOrders: mlbbOrders.length,
          genshinOrders: genshinOrders.length,
          mcggOrders: mcggOrders.length,
          mlaccOrders: mlaccOrders.length,
          charmsOrders: charmsOrders.length,
          upiTransactions: upiOrders.length,
          totalEarnings,
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    }

    loadStats();
  }, [selectedPeriod]);

  // Fetch balances separately (no blocking)
  useEffect(() => {


    (async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_PAYMENT_URL}/smile/get-smile-balance`); // your backend endpoint
        setSmile(res.data.smile_points);
      } catch (err) {
        console.error("Smile balance fetch failed:", err);
      }
    })();
  }, []);

  const handleClick = async()=> {

    return
  }

  return (
    <div
      className={`p-6 max-w-6xl mx-auto ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}
    >
      <h1 onClick={handleClick} className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

      {/* Period Buttons */}
      <div className="mb-6 flex justify-center gap-3">
        {timePeriods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
              selectedPeriod === period
                ? "bg-blue-600 text-white shadow"
                : isDarkMode
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {period.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
  
        <StatCard
          title="Smile Balance"
          value={smile !== null ? smile : "Loading..."}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="MLBB Orders"
          value={stats.mlbbOrders}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="GENSHIN Orders"
          value={stats.genshinOrders}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="MCGG Orders"
          value={stats.mcggOrders}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="MLACC Orders"
          value={stats.mlaccOrders}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="CHARMS Orders"
          value={stats.charmsOrders}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="UPI Transactions"
          value={stats.upiTransactions}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="Total UPI Earnings"
          value={`₹${stats.totalEarnings.toFixed(2)}`}
          isDarkMode={isDarkMode}
        />

        {/* Extra balances */}
  
      </div>
    </div>
  );
};

const StatCard = ({ title, value, isDarkMode }) => (
  <div
    className={`rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition ${
      isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
    }`}
  >
    <h2
      className={`text-md font-medium ${
        isDarkMode ? "text-gray-400" : "text-gray-500"
      }`}
    >
      {title}
    </h2>
    <p className="text-2xl font-bold mt-2 text-blue-500">{value}</p>
  </div>
);

export default AdminDashboard;
