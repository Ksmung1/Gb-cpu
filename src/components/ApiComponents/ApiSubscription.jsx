import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAlert } from "../../context/AlertContext";
import { useModal } from "../../context/ModalContext";
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  TrendingUp,
  Shield,
} from "lucide-react";
import axios from "axios";

const ApiSubscription = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { isDarkMode } = useDarkMode();
  const { showAlert } = useAlert();
  const { openModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    if (user) {
      setCurrentPlan(user.apiSubscriptionPlan || null);
    }
  }, [user]);

  // Fetch subscription plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const response = await axios.get(
          `${import.meta.env.VITE_PAYMENT_URL}/api/subscription-plans`
        );

        if (response.data.success && response.data.plans) {
          // Map plans with icons and colors
          const iconMap = {
            basic: Zap,
            premium: Crown,
            default: Zap,
          };

          const colorMap = {
            basic: "from-blue-500 to-blue-600",
            premium: "from-purple-500 to-purple-600",
            default: "from-gray-500 to-gray-600",
          };

          const mappedPlans = response.data.plans.map((plan) => {
            const planIdLower =
              plan.id?.toLowerCase() || plan.name?.toLowerCase() || "";
            return {
              ...plan,
              icon:
                iconMap[planIdLower] ||
                iconMap[plan.name?.toLowerCase()] ||
                iconMap.default,
              color:
                colorMap[planIdLower] ||
                colorMap[plan.name?.toLowerCase()] ||
                colorMap.default,
            };
          });

          setPlans(mappedPlans);
        } else {
          showAlert("Failed to load subscription plans");
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        showAlert("Failed to load subscription plans. Please try again later.");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [showAlert]);

  function getLocalISOString() {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, "0");
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeString = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    const dateString = `${pad(now.getDate())}-${pad(
      now.getMonth() + 1
    )}-${now.getFullYear()}`;
    return `${dateString}T${timeString}`;
  }

  const fullDateTime = getLocalISOString();
  const [datePart, timePart] = fullDateTime.split("T");


  const handleSubscribe = async (plan) => {
    if (!user) {
      showAlert("Please log in to subscribe");
      return;
    }

    // Check if user has API role
    if (user.role !== "api" && user.role !== "admin") {
      showAlert("You need API access to subscribe. Contact admin.");
      return;
    }

    const currentLimit = user?.apiCallsLimit || 0;
    const newLimit = currentLimit + plan.calls;

    openModal({
      title: "Purchase API Calls",
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to purchase{" "}
            <strong>{plan.calls.toLocaleString()} API calls</strong>.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold mb-2">Purchase Details:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>API Calls: {plan.calls.toLocaleString()}</li>
              <li>Price: ₹{plan.price.toLocaleString()}</li>
              <li>Current Limit: {currentLimit.toLocaleString()}</li>
              <li>New Limit: {newLimit.toLocaleString()}</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            After payment confirmation, your API call limit will be increased.
            Calls are request-based, not time-based.
          </p>
        </div>
      ),
      type: "confirm",
      onConfirm: async () => {
        setLoading(true);
        try {
          // Create order for subscription payment
          const orderId = `SUB-${plan.id.toUpperCase()}-${
            user.uid
          }-${Date.now()}`;

          // Check if user has phone number
          if (!user.phone) {
            showAlert("Please add a phone number to your account first");
            setLoading(false);
            return;
          }

          const orderData = {
            id: orderId,
            userId: user.uid,
            uid: user.uid,
            zoneId: user.uid,
            product: `API Subscription - ${plan.name}`,
            productId: plan.id || plan.name,
            username: user.username,
            gameUsername: user.username,
            cost: Number(plan.price), // Ensure it's a number from database
            date: datePart,
            time: timePart,
            selectedItem: {
              label: `${plan.name} Plan - ${plan.calls} calls`,
              api: "api-subscription",
            },
            phone: String(user.phone).replace(/\D/g, "").slice(-10),
            email: user.email || "",
            ksmApi: import.meta.env.VITE_APP_KSM_API,
            subscriptionPlan: plan.id || plan.name,
            subscriptionCalls: Number(plan.calls), // Ensure it's a number from database
          };

          // Use non-matrixsols payment for all subscription purchases
          const url = `${import.meta.env.VITE_PAYMENT_URL}/payment/start-order`;

          const { data } = await axios.post(url, orderData);

          if (data.success && data.orderId) {
            // Navigate to internal payment page instead of external redirect
            navigate(`/payment/${data.orderId}`);
          } else {
            showAlert(`Payment failed: ${data.message || "Try again"}`);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error subscribing:", error);
          showAlert("Failed to start payment. Please try again.");
          setLoading(false);
        }
      },
    });
  };

  const cardClass = isDarkMode
    ? "bg-gray-800 border border-gray-700"
    : "bg-white border border-gray-200";
  const textClass = isDarkMode ? "text-white" : "text-gray-900";
  const subtextClass = isDarkMode ? "text-gray-400" : "text-gray-600";

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 to-indigo-50"
      } py-12 px-4`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className={`p-3 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg`}
            >
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-4xl font-bold ${textClass}`}>
              API Subscriptions
            </h1>
          </div>
          <p className={`text-lg ${subtextClass} max-w-2xl mx-auto`}>
            Choose a plan that fits your API usage needs
          </p>
        </div>

        {/* Usage Info */}
        {(user?.apiCallsLimit || user?.apiCallsUsed) && (
          <div className={`${cardClass} p-6 rounded-xl shadow-lg mb-8`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${subtextClass} mb-1`}>
                  Total API Calls
                </p>
                <p className={`text-2xl font-bold ${textClass}`}>
                  {user?.apiCallsLimit
                    ? user.apiCallsLimit.toLocaleString()
                    : "0"}
                </p>
                <p className={`text-xs ${subtextClass} mt-1`}>
                  {user?.apiSubscriptionPurchases?.length
                    ? `${user.apiSubscriptionPurchases.length} purchase(s)`
                    : "Free tier"}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${subtextClass} mb-1`}>Usage</p>
                <p className={`text-2xl font-bold ${textClass}`}>
                  {user?.apiCallsUsed || 0} / {user?.apiCallsLimit || 0}
                </p>
                <p className={`text-xs ${subtextClass} mt-1`}>
                  {user?.apiCallsLimit
                    ? `${(
                        (user?.apiCallsLimit || 0) - (user?.apiCallsUsed || 0)
                      ).toLocaleString()} remaining`
                    : "No limit set"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div
                className={`w-full h-2 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(
                      ((user?.apiCallsUsed || 0) / (user?.apiCallsLimit || 1)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {loadingPlans ? (
          <div className="text-center py-12">
            <p className={subtextClass}>Loading subscription plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className={subtextClass}>
              No subscription plans available. Please contact admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const planId = plan.id || plan.name;
              const isCurrentPlan = currentPlan === planId;
              const isUpgrade = currentPlan === "basic" && planId === "premium";

              return (
                <div
                  key={plan.id}
                  className={`${cardClass} rounded-xl shadow-lg overflow-hidden relative ${
                    plan.popular ? "ring-2 ring-purple-500" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                      Popular
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`p-4 rounded-lg bg-gradient-to-br ${plan.color} shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-bold ${textClass}`}>
                          {plan.name}
                        </h3>
                        <p className={subtextClass}>Plan</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <p className={`text-4xl font-bold ${textClass}`}>
                        ₹{plan.price.toLocaleString()}
                      </p>
                      <p className={subtextClass}>one-time purchase</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              plan.color.includes("blue")
                                ? "text-blue-500"
                                : "text-purple-500"
                            }`}
                          />
                          <span className={subtextClass}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        loading
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg transform hover:scale-105`
                      }`}
                    >
                      {loading ? "Processing..." : "Purchase"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className={`${cardClass} p-6 rounded-xl shadow-lg mt-8`}>
          <h3 className={`text-xl font-semibold mb-4 ${textClass}`}>
            Subscription Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <TrendingUp className={`w-6 h-6 ${subtextClass} flex-shrink-0`} />
              <div>
                <p className={`font-semibold ${textClass}`}>Usage Tracking</p>
                <p className={`text-sm ${subtextClass}`}>
                  Your API calls are tracked in real-time. Purchases add to your
                  limit permanently.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className={`w-6 h-6 ${subtextClass} flex-shrink-0`} />
              <div>
                <p className={`font-semibold ${textClass}`}>Secure Payments</p>
                <p className={`text-sm ${subtextClass}`}>
                  All payments are processed securely
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className={`w-6 h-6 ${subtextClass} flex-shrink-0`} />
              <div>
                <p className={`font-semibold ${textClass}`}>
                  Instant Activation
                </p>
                <p className={`text-sm ${subtextClass}`}>
                  Your API calls are added to your limit immediately after
                  payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSubscription;
