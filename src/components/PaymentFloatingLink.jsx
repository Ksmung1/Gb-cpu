import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../configs/firebase";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";

const PaymentFloatingLink = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const [activeOrder, setActiveOrder] = useState(null);
  const [hasBlinked, setHasBlinked] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) {
      setActiveOrder(null);
      return;
    }

    // Don't show on payment page itself
    if (location.pathname.startsWith("/payment/")) {
      // Don't clear activeOrder here - just don't show it
      return;
    }

    // Query for pending orders for this user
    // Note: Using user field only, then filtering status in snapshot
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("user", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5) // Get recent orders and filter pending in code
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Find the most recent pending order (must be pending status)
        const pendingOrder = snapshot.docs.find((doc) => {
          const data = doc.data();
          return data.status === "pending";
        });

        if (pendingOrder) {
          const orderData = pendingOrder.data();

          // Check if order was created within last 10 minutes
          const createdAt = orderData.createdAt?.toMillis
            ? orderData.createdAt.toMillis()
            : orderData.createdAt;
          if (createdAt) {
            const now = Date.now();
            const elapsed = now - createdAt;
            const tenMinutes = 10 * 60 * 1000;

            if (elapsed < tenMinutes) {
              const newOrderId = pendingOrder.id;
              setActiveOrder((prevOrder) => {
                // Only reset blink if order actually changed
                if (!prevOrder || prevOrder.id !== newOrderId) {
                  setHasBlinked(false);
                }
                return {
                  id: newOrderId,
                  ...orderData,
                };
              });
            } else {
              // Order expired - clear it
              setActiveOrder((prevOrder) => {
                if (prevOrder?.id === pendingOrder.id) {
                  setHasBlinked(false);
                  return null;
                }
                return prevOrder; // Keep existing order if it's different
              });
            }
          } else {
            // If no createdAt, assume it's recent
            const newOrderId = pendingOrder.id;
            setActiveOrder((prevOrder) => {
              if (!prevOrder || prevOrder.id !== newOrderId) {
                setHasBlinked(false);
              }
              return {
                id: newOrderId,
                ...orderData,
              };
            });
          }
        } else {
          // No pending orders found - check if our active order has been completed
          setActiveOrder((prevOrder) => {
            if (prevOrder) {
              // Check if the previous order exists in snapshot but with different status
              const existingOrder = snapshot.docs.find(
                (doc) => doc.id === prevOrder.id
              );
              if (existingOrder) {
                const existingData = existingOrder.data();
                // If order exists but status is not pending (completed/failed), clear it immediately
                if (existingData.status !== "pending") {
                  setHasBlinked(false);
                  return null;
                }
                // Order exists and is still pending, keep it
                return prevOrder;
              } else {
                // Order doesn't exist in recent snapshot - might be completed or removed
                // Clear it immediately (order was likely completed)
                setHasBlinked(false);
                return null;
              }
            }
            return null;
          });
        }
      },
      (error) => {
        console.error("Error fetching active payment:", error);
        // Don't clear on error - keep existing order
      }
    );

    return () => unsubscribe();
  }, [user?.uid, location.pathname]);

  // Trigger one-time blink animation when button first appears
  useEffect(() => {
    if (activeOrder && !hasBlinked) {
      // Small delay to ensure button is rendered
      const timeout = setTimeout(() => {
        if (buttonRef.current) {
          // Add a one-time blink effect using opacity
          const button = buttonRef.current;
          button.style.animation = "blink-once 1s ease-in-out";

          // Clear animation after it completes
          setTimeout(() => {
            if (button) {
              button.style.animation = "";
            }
            setHasBlinked(true);
          }, 1000);
        }
      }, 100);

      return () => clearTimeout(timeout);
    } else if (!activeOrder) {
      // Reset hasBlinked when order disappears
      setHasBlinked(false);
    }
  }, [activeOrder, hasBlinked]);

  // Don't show on payment page itself
  if (location.pathname.startsWith("/payment/")) return null;

  // Don't show if no active order or if order status is not pending
  if (!activeOrder || activeOrder.status !== "pending") return null;

  return (
    <>
      <style>
        {`
          @keyframes blink-once {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
          }
        `}
      </style>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          ref={buttonRef}
          onClick={() => navigate(`/payment/${activeOrder.id}`)}
          className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110 active:scale-95 flex items-center justify-center ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          } text-white`}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

export default PaymentFloatingLink;
