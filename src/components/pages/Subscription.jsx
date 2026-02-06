// src/components/Subscription.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useModal } from "../../context/ModalContext";
import { useAlert } from "../../context/AlertContext";
import { useDarkMode } from "../../context/DarkModeContext";
import AddPhoneNumber from "../modal/AddPhoneNumber";
import axios from "axios";
import { Check } from "lucide-react";

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [vipExpiry, setVipExpiry] = useState(null);
  const [countdown, setCountdown] = useState("");
  const { openModal } = useModal();
  const { showAlert } = useAlert();
  const { isDarkMode } = useDarkMode();
  const [showPhone, setShowPhone] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "₹0 / month",
      perks: ["Access to basic features", "Standard support"],
      role: "customer",
    },
    {
      name: "VIP",
      price: "₹99 / month",
      perks: [
        "Discounts on purchases",
        "Set custom profile picture",
        "Priority support",
        "Exclusive content access",
      ],
      role: "vip",
      cost: 99,
    },
    {
      name: "PRIME VIP",
      price: "₹300 / month",
      perks: [
        "All VIP perks",
        "10% higher discounts",
        "Custom badge on profile",
        "Early access to new features",
        "Dedicated 24/7 support",
        "Exclusive PRIME events",
      ],
      role: "prime",
      cost: 300,
      highlight: true,
    },
  ];

  /* --------------------------------------------------------------
     Load expiry
  -------------------------------------------------------------- */
  useEffect(() => {
    if ((user?.role === "vip" || user?.role === "prime") && user?.vipExpiry) {
      const expiryDate =
        typeof user.vipExpiry.toDate === "function"
          ? user.vipExpiry.toDate()
          : new Date(user.vipExpiry);
      setVipExpiry(expiryDate);
    } else {
      setVipExpiry(null);
    }
  }, [user]);

  /* --------------------------------------------------------------
     Real‑time countdown
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!vipExpiry) {
      setCountdown("");
      return;
    }

    const interval = setInterval(() => {
      const total = vipExpiry.getTime() - Date.now();
      if (total <= 0) {
        setCountdown("Expired");
        clearInterval(interval);
        return;
      }
      const days = Math.floor(total / (1000 * 60 * 60 * 24));
      const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((total / 1000 / 60) % 60);
      const seconds = Math.floor((total / 1000) % 60);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s left`);
    }, 1000);

    return () => clearInterval(interval);
  }, [vipExpiry]);

  /* --------------------------------------------------------------
     Random 5‑char suffix for orderId
  -------------------------------------------------------------- */
  const randomSuffix = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  /* --------------------------------------------------------------
     Subscribe to plan – discount logic fixed
  -------------------------------------------------------------- */
  const subscribeToPlan = async (plan) => {
    if (!user) return;

    const currentRole = user?.role;
    const targetRole = plan.role;

    // 1. Already on the same plan
    if (currentRole === targetRole) {
      showAlert(`You are already on the ${plan.name} plan.`);
      return;
    }

    // 2. Prevent downgrade
    if (
      (currentRole === "prime" && targetRole !== "prime") ||
      (currentRole === "vip" && targetRole === "customer")
    ) {
      showAlert("You cannot downgrade. Contact support if needed.");
      return;
    }

    // 3. PRIME VIP → VIP (not allowed)
    if (currentRole === "prime" && targetRole === "vip") {
      showAlert("You are already on a higher plan.");
      return;
    }

    setLoading(true);

    // 4. Phone number check
    const mobile = user.phone?.slice(-10);
    if (!mobile) {
      setShowPhone(true);
      setLoading(false);
      return;
    }

    // 5. Calculate amount to pay
    let amountToPay = plan.cost; // default = full price
    let discountNote = "";

    if (currentRole === "vip" && targetRole === "prime") {
      amountToPay = plan.cost - 100; // 300 – 99 = 201
      discountNote = "(₹300 – ₹99 already paid = ₹201)";
    }

    // 6. Build orderId (PREFIX‑UID‑RANDOM5)
    const prefix = plan.name.replace(" ", "_").toUpperCase(); // VIP or PRIME_VIP
    const orderId = `${prefix}-${user.uid}-${randomSuffix()}`;

    // 7. Confirmation modal
    openModal({
      title: `Upgrade to ${plan.name}`,
      content: (
        <div className="text-center">
          <p className="mb-2">
            Upgrade to <strong>{plan.name}</strong> for
          </p>
          <p className="text-2xl font-bold text-green-600">
            ₹{amountToPay}
          </p>
          {discountNote && (
            <p className="text-xs text-gray-500 mt-1">{discountNote}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">per month</p>
        </div>
      ),
      type: "confirm",
      confirmText: "Pay Now",
      onConfirm: async () => {
        try {
          const orderData = {
            id: orderId,
            userId: user.uid,
            uid: user.uid,
            zoneId: user.uid,
            productId: `${plan.name} Subscription`,
            mlUsername: user.username,
            cost: amountToPay,               // discounted amount
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            selectedItem: orderId,
            ksmApi: import.meta.env.VITE_APP_KSM_API,
            planRole: targetRole,
          };

          const { data } = await axios.post(
            `${import.meta.env.VITE_PAYMENT_URL}/payment/start-order`,
            orderData
          );

          if (data.success && data.orderId) {
            // Navigate to internal payment page instead of external redirect
            navigate(`/payment/${data.orderId}`);
          } else {
            showAlert(`Payment failed: ${data.message || "Try again."}`);
          }
        } catch (err) {
          console.error("Payment error:", err);
          showAlert("Network error. Please check your connection.");
        } finally {
          setLoading(false);
        }
      },
      onCancel: setLoading(false)
    });
  };

  /* --------------------------------------------------------------
     Determine active plan
  -------------------------------------------------------------- */
  const activePlan =
    user?.role === "prime"
      ? "PRIME VIP"
      : user?.role === "vip"
      ? "VIP"
      : "Free";

  return (
    <div
      className={`min-h-screen py-12 px-4 font-sans transition-colors ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-4">
          Choose Your Plan
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Unlock exclusive features and priority support
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isActive = activePlan === plan.name;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between border rounded-xl p-6 transition-all shadow-lg hover:shadow-xl ${
                  plan.highlight
                    ? "ring-2 ring-purple-500 ring-offset-2"
                    : ""
                } ${
                  isActive
                    ? isDarkMode
                      ? "border-purple-500 bg-purple-900/40"
                      : "border-purple-600 bg-purple-50"
                    : isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-300 bg-white"
                }`}
              >
                {/* Most Popular Badge */}
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div>
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      isActive ? "text-purple-400" : ""
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-3xl font-extrabold mb-4 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                  </p>

                  <ul
                    className={`space-y-2 text-sm mb-6 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {plan.perks.map((perk, i) => (
                      <li
                        key={i}
                        className={`flex items-center gap-2 ${
                          perk.includes("All VIP")
                            ? "font-semibold text-purple-400"
                            : ""
                        }`}
                      >
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                {isActive ? (
                  <div
                    className={`text-center font-bold text-sm mt-4 p-3 rounded-lg ${
                      isDarkMode
                        ? "bg-purple-800 text-purple-300"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {plan.name.includes("VIP") && vipExpiry ? (
                      <span>{countdown}</span>
                    ) : (
                      "Active Plan"
                    )}
                  </div>
                ) : (
                  <button
                    disabled={loading}
                    onClick={() => subscribeToPlan(plan)}
                    className={`w-full mt-4 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed ${
                      loading
                        ? "bg-gray-500"
                        : plan.highlight
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? "Processing..." : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Phone Modal */}
        {showPhone && <AddPhoneNumber onClose={() => setShowPhone(false)} />}
      </div>
    </div>
  );
};

export default Subscription;