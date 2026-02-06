import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../configs/firebase";
import coinFly from "../../assets/pixels/coinfly.png";
import bird from "../../assets/pixels/bird.png";
import coin from "../../assets/pixels/coin.png";
import { useDarkMode } from "../../context/DarkModeContext";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoRefresh } from "react-icons/io5";
import { useUser } from "../../context/UserContext";

const leaderboardTypes = [
  { icon: coinFly, label: "Monthly Top Spenders", field: "giftSpent" },
  { icon: bird, label: "Flappy Leaderboard", field: "flappyScore" },
  { icon: coin, label: "Richest Players", field: "balance" },
];

const Leaderboards = () => {
  const [leaders, setLeaders] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [spenderTab, setSpenderTab] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [recalcLoading, setRecalcLoading] = useState(false);
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const {user} = useUser()

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const birds = [coinFly, bird, coin];

  /* ---------- Countdown to Monday 1 PM IST ---------- */
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const monday = new Date(now);
      const daysToMonday = (1 + 7 - now.getDay()) % 7 || 7;
      monday.setDate(now.getDate() + daysToMonday);
      monday.setHours(13, 0, 0, 0);

      const diff = monday.getTime() - now.getTime();
      if (diff <= 0) return setCountdown("Resetting...");

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${d}d ${h}h ${m}m ${s}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ---------- UPDATE CURRENT USER'S LEADERBOARD STATS ---------- */
  const updateCurrentUserLeaderboard = async () => {
    if (!currentUser || recalcLoading) return;
    setRecalcLoading(true);

    console.log("Updating leaderboard stats for current user...");

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");

      const userData = userSnap.data();

      // === 1. Calculate giftSpent for CURRENT MONTH (IST) ===
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(now.getTime() + istOffset);
      const year = nowIST.getFullYear();
      const month = nowIST.getMonth();

      const startOfMonthIST = new Date(year, month, 1, 0, 0, 0);
      const endOfMonthIST = new Date(year, month + 1, 1, 0, 0, 0);
      const startUTC = new Date(startOfMonthIST.getTime() - istOffset);
      const endUTC = new Date(endOfMonthIST.getTime() - istOffset);

      const ordersRef = collection(userRef, "orders");
      const q = query(ordersRef, where("status", "==", "completed"));
      const ordersSnap = await getDocs(q);

      let giftSpent = 0;
      const toNum = (val) => {
        if (val == null) return 0;
        const str = String(val).trim().replace(/[₹$,\s]/g, "");
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
      };

      for (const orderDoc of ordersSnap.docs) {
        const orderId = orderDoc.id;
        if (/^(TEST|PAY)/i.test(orderId)) continue;

        const data = orderDoc.data();
        const createdAt = data.createdAt;
        if (!createdAt?.toDate) continue;

        const orderDateUTC = createdAt.toDate();
        if (orderDateUTC >= startUTC && orderDateUTC < endUTC) {
          const cost = toNum(data.cost ?? data.amount ?? data.price ?? 0);
          giftSpent += cost;
        }
      }

      giftSpent = Math.round(giftSpent * 100) / 100;

      // === 2. Use existing flappyScore & balance (or default to 0) ===
      const flappyScore = userData.flappyScore ?? 0;
      const balance = userData.balance ?? 0;

      // === 3. Update only leaderboard fields ===
      await updateDoc(userRef, {
        giftSpent,
        flappyScore,
        balance,
        leaderboardUpdatedAt: serverTimestamp(),
      });

      console.log(`Updated: giftSpent=₹${giftSpent}, flappyScore=${flappyScore}, balance=₹${balance}`);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setRecalcLoading(false);
    }
  };

  /* ---------- Auto-update on mount ---------- */
  useEffect(() => {
    if (currentUser) {
      updateCurrentUserLeaderboard();
    }
  }, [currentUser]);

  // put this above the useEffect
const mapLeadersFromSnap = (snap) => {
  const filtered = snap.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((u) => u.role !== "admin"); // ⬅️ remove admins

  return filtered.map((u, i) => ({
    ...u,
    rank: i + 1,
  }));
};


  /* ---------- Real-time Leaderboard Query ---------- */
useEffect(() => {
  if (!currentUser) return;

  let q = null;

  if (activeIndex === 0) {
    const roleFilter =
      spenderTab === 0
        ? where("role", "not-in", ["reseller"]) // still ok
        : where("role", "in", ["reseller"]);

    q = query(
      collection(db, "users"),
      roleFilter,
      where("giftSpent", ">", 0),
      orderBy("giftSpent", "desc"),
      limit(10)
    );
  } else if (activeIndex === 1) {
    q = query(
      collection(db, "users"),
      where("flappyScore", ">", 10),
      orderBy("flappyScore", "desc"),
      limit(10)
    );
  } else if (activeIndex === 2) {
    q = query(
      collection(db, "users"),
      where("balance", ">", 0),
      orderBy("balance", "desc"),
      limit(10)
    );
  }

  if (!q) {
    setLeaders([]);
    return;
  }

  const loadInitial = async () => {
    try {
      const snap = await getDocs(q);
      setLeaders(mapLeadersFromSnap(snap)); // ⬅️ use helper
    } catch (e) {
      console.error(e);
    }
  };

  loadInitial();

  const unsub = onSnapshot(
    q,
    (snap) => {
      setLeaders(mapLeadersFromSnap(snap)); // ⬅️ use helper
    },
    (err) => console.error(err)
  );

  return () => unsub();
}, [activeIndex, spenderTab, currentUser]);

  const fmt = (n) => (n ?? 0).toLocaleString();

  const getValue = (user) => {
    if (activeIndex === 0) return `₹${fmt(user.giftSpent)}`;
    if (activeIndex === 1) return fmt(user.flappyScore);
    if (activeIndex === 2) return `₹${fmt(user.balance)}`;
    return "";
  };

  return (
    <>
      <div
        className={`relative min-h-screen pb-0 flex flex-col items-center justify-start p-4 ${
          isDarkMode
            ? "bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900"
            : "bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50"
        }`}
      >
        <div
          className={`w-full relative max-w-md p-3 rounded-2xl shadow-2xl backdrop-blur-md border ${
            isDarkMode
              ? "bg-gray-800/80 border-gray-700"
              : "bg-white/90 border-gray-200"
          }`}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="absolute bg-black rounded-full top-1 left-3 z-50 p-1"
          >
            <IoArrowBack size={22} className="text-white" />
          </button>

          {/* Countdown (only for Flappy) */}
          {activeIndex === 1 ? (
            <div className="text-center mb-3 mt-10">
              <p className="text-xs font-bold text-yellow-500 animate-pulse">
                Resets in {countdown}
              </p>
            </div>
          ) : 
           <div className="text-center mb-3 mt-10">
              
            </div>
          }

          {/* Title + Recalculate Button */}
          <div className="flex items-center justify-between mb-4 mt-4">
            <h2 className="text-2xl font-bold">
              {leaderboardTypes[activeIndex].label}
            </h2>

         
          </div>

          {/* Top Spender Tabs */}
          {activeIndex === 0 && (
            <div className="flex mb-4 rounded-xl overflow-hidden shadow-md">
              {["Top Spenders", "Top Partnerships"].map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setSpenderTab(i)}
                  className={`flex-1 py-2 text-sm font-semibold transition-all ${
                    spenderTab === i
                      ? "bg-indigo-600 text-white"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-indigo-500">
            {leaders.length > 0 ? (
              <>
                {/* #1 Special Card */}
                <div
                  className={`rounded-xl p-4 py-2 flex items-center gap-4 shadow-lg border-2 border-yellow-500 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-yellow-800 to-amber-700"
                      : "bg-gradient-to-r from-yellow-100 to-amber-100"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={leaders[0]?.photoURL || "/avatar.jpg"}
                      alt={leaders[0]?.username}
                      className="w-16 h-16 rounded-full object-cover border-4 border-yellow-400 shadow-md"
                    />
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      #1
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{leaders[0].username}</p>
                    <p className="text-sm opacity-90">{getValue(leaders[0])}</p>
                  </div>
                </div>

                {/* Rest */}
                {leaders.slice(1).map((u) => (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-3 py-2 rounded-lg shadow-sm border ${
                      isDarkMode
                        ? "bg-gray-700/50 border-gray-600"
                        : "bg-white/80 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-indigo-600 w-8">
                        #{u.rank}
                      </span>
                      <img
                        src={u.photoURL || "/avatar.jpg"}
                        alt={u.username}
                        className="w-10 h-10 rounded-full border-2 border-gray-300"
                      />
                      <div>
                        <p className="font-medium">{u.username}</p>
                        {u.bio && (
                          <p className="text-xs opacity-70 capitalize">{u.bio}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-indigo-600">{getValue(u)}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center py-10 text-gray-500">
                No players yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="mt-1 fixed bottom-1 shadow-md left-1 right-1 flex justify-center gap-8 px-3 py-1 rounded-xl bg-white">
        {birds.map((src, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveIndex(i);
              if (i !== 0) setSpenderTab(0);
            }}
            className="relative p-2 rounded-full transition-all duration-200"
          >
            <img
              src={src}
              alt={leaderboardTypes[i].label}
              className={`w-10 h-10 object-contain drop-shadow-lg transition-transform ${
                activeIndex === i ? "scale-125" : "scale-100 opacity-70"
              }`}
            />
            {activeIndex === i && (
              <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping" />
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default Leaderboards;