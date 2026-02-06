import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";
import { useAlert } from "../../context/AlertContext";
import { useDarkMode } from "../../context/DarkModeContext";
import paytmImage from "../../assets/images/paytm.png";
import axios from "axios";
import OrderDetailModal from "../modal/OrderDetailModal";

const PaymentPage = () => {
  const { orderId } = useParams();
  const { user } = useUser();
  const { showAlert } = useAlert();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);

  const handledFinalStateRef = useRef(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  // 🔑 derived UI state (NO setState)
  const isVerifying = useMemo(
    () => orderData?.status === "processing",
    [orderData?.status]
  );

  const stopAll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  };

  // ── FINAL STATE HANDLER ─────────────────────────
  const handleFinal = (status) => {
    if (handledFinalStateRef.current) return;
    handledFinalStateRef.current = true;

    if (status === "completed") {
      setShowSuccessModal(true);
      setTimeout(() => {
        stopAll();
        const prev = location.state?.from;
        navigate(prev && prev !== `/payment/${orderId}` ? prev : "/orders", {
          replace: true,
        });
      }, 2500);
    }

    if (status === "failed") {
      showAlert("Payment failed. Please try again.");
      setTimeout(() => {
        stopAll();
        navigate("/orders", { replace: true });
      }, 2000);
    }
  };

  // ── FIRESTORE SNAPSHOT (MAIN DRIVER) ────────────
  useEffect(() => {
    if (!orderId || !user?.uid) {
      showAlert("Invalid order");
      navigate("/orders");
      return;
    }

    const orderRef = doc(db, "orders", orderId);

    const unsub = onSnapshot(orderRef, (snap) => {
      if (!snap.exists()) {
        showAlert("Order not found");
        navigate("/orders");
        return;
      }

      const data = snap.data();
      setOrderData((prev) => (prev?.status === data.status ? prev : data));
      setLoading(false);

      if (["completed", "failed"].includes(data.status)) {
        handleFinal(data.status);
      }

      // Timer only while pending
      if (data.status === "pending" && data.createdAt && !timerRef.current) {
        const created =
          data.createdAt.toMillis?.() ?? data.createdAt.seconds * 1000;

        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - created) / 1000);
          const remaining = Math.max(0, 600 - elapsed);
          setTimeRemaining(remaining);
        }, 1000);
      }
    });

    return () => {
      unsub();
      stopAll();
    };
  }, [orderId, user?.uid]);

  // ── BACKUP POLLING (ONLY WHEN PROCESSING) ───────
  useEffect(() => {
    if (orderData?.status !== "processing") return;

    pollRef.current = setInterval(async () => {
      try {
        await axios.post(`${import.meta.env.VITE_PAYMENT_URL}/check-order`, {
          orderId,
        });
      } catch {}
    }, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderData?.status]);

  // ── RENDER ──────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!orderData) return null;

  const { qr_code, paytm_intent, cost, item, status } = orderData;

  return (
    <div className="min-h-screen p-6">
      {status === "pending" && (
        <>
          {/* TIMER */}
          <p className="text-center text-lg font-semibold mb-3">
            Time left: {Math.floor(timeRemaining / 60)}:
            {String(timeRemaining % 60).padStart(2, "0")}
          </p>
          {/* QR + PAY BUTTON */}
          {qr_code && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl shadow-md">
                <img src={qr_code} className="w-56 h-56 object-contain" />
              </div>

              {paytm_intent && (
                <a
                  href={paytm_intent}
                  className="mt-4 border px-3 border-gray-300 rounded-md shadow-md"
                >
                  <img
                    src={paytmImage}
                    className="w-14 hover:scale-110 transition-transform"
                  />
                </a>
              )}
            </div>
          )}

          {/* ORDER META (THIS IS WHAT WAS MISSING) */}
          <div className="mx-auto mb-5 w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 p-4 text-sm shadow-sm">
            <div className="flex justify-between py-1">
              <span className="opacity-70">Order ID</span>
              <span className="font-mono text-xs">{orderId}</span>
            </div>

            {item && (
              <div className="flex justify-between py-1">
                <span className="opacity-70">Item</span>
                <span className="font-medium">{item}</span>
              </div>
            )}

            {cost && (
              <div className="flex justify-between py-1">
                <span className="opacity-70">Amount</span>
                <span className="font-semibold text-blue-600">₹{cost}</span>
              </div>
            )}

            <div className="flex justify-between py-1">
              <span className="opacity-70">Status</span>
              <span className="text-yellow-500 font-semibold">Pending</span>
            </div>
          </div>
        </>
      )}

      {showSuccessModal && (
        <OrderDetailModal
          orderData={{ ...orderData, id: orderId, item }}
          onClose={() => navigate("/orders", { replace: true })}
        />
      )}
      {isVerifying && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div
            className={`rounded-2xl px-10 py-8 shadow-2xl ${
              isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex flex-col items-center">
              {/* Smooth spinner */}
              <div className="relative w-16 h-16 mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              </div>

              <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
              <p className="text-sm opacity-70 text-center max-w-xs">
                Payment detected. Please wait while we confirm your transaction.
              </p>

              <div className="mt-4 text-xs opacity-50 font-mono">
                Order: {orderId}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
