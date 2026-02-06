import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, doc, getDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { Loader2, Clock, Download } from "lucide-react";
import { format } from "date-fns";

const History = () => {
  const { user } = useUser();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.uid !== userId && user.role !== "admin") {
      navigate("/");
      return;
    }

    // Fetch user balance
    const fetchBalance = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setBalance(userDoc.data().balance ?? 0);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error("Failed to fetch user balance:", error);
        setBalance(0);
      }
    };

    fetchBalance();

    // Fetch balance history
    const q = query(
      collection(db, `users/${userId}/balance-history`),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching balance history:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user, userId, navigate]);

    const downloadCSV = () => {
    if (history.length === 0) return;

    const header = ["ID", "Type", "Amount","By","Reason","New Balance", "Timestamp"];
    const rows = history.map((entry) => [
      entry.id,
      entry.type,
      entry.amount,
      entry.by,
      entry.reason,
      entry?.balanceAfter,
      entry.timestamp?.toDate ? format(entry.timestamp.toDate(), "dd MMM yyyy HH:mm:ss") : "Unknown",
    ]);

    const csvContent =
      [header, ...rows]
        .map((e) => e.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `transaction_history_${userId}.csv`;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 py-10 min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-600">
        Transaction History
      </h1>
      <p className="text-center mb-8 text-lg">
        Current Balance: <span className={`${balance >= 0 ? "text-green-500" : "text-red-500"} font-semibold`}>₹{balance ?? 0}</span>
      </p>
         <div className="flex justify-center mb-6">
        <button
          onClick={downloadCSV}
          className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-colors duration-200 ${
            isDarkMode
              ? "bg-blue-700 hover:bg-blue-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          disabled={history.length === 0}
          title={history.length === 0 ? "No data to download" : "Download history as CSV"}
        >
          <Download className="w-5 h-5" />
          Download History as CSV
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No transactions found.</p>
      ) : (
        <ul className="space-y-4">
          {history.map((entry) => (
            <li
              key={entry.id}
              className={`border rounded-lg px-3 p-[2px] shadow-sm hover:shadow-md transition-all ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {entry.type === "credit" && <span className="text-green-500">+ ₹{entry.amount}</span>}
                    {entry.type === "topup" && <span className="text-green-500">+ ₹{entry.amount}</span>}
                    {entry.type === "refund" && <span className="text-blue-500">+ ₹{entry.amount}</span>}
                    {entry.type === "deduction" && <span className="text-red-500">- ₹{entry.amount}</span>}
                  </p>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {entry.note || (entry.type ? entry.type.charAt(0).toUpperCase() + entry.type.slice(1) : "Unknown")}
                  </p>
                </div>

              <div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">
                    {entry.timestamp?.toDate
                      ? format(entry.timestamp.toDate(), "dd MMM yyyy, hh:mm a")
                      : "Unknown"}
                  </span>
                  
                </div>
           <div className="text-xs mt-1"><strong>NB: </strong>{entry?.balanceAfter || 'N/A'}</div>

                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
