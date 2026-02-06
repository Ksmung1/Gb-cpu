import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAlert } from "../../context/AlertContext";
import {
  Users,
  Key,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";
import axios from "axios";

const ApiAdminDashboard = () => {
  const { user, setUser } = useUser();
  const { isDarkMode } = useDarkMode();
  const { showAlert } = useAlert();
  const [apiUsers, setApiUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingKeys, setGeneratingKeys] = useState({});
  const [visibleKeys, setVisibleKeys] = useState({});
  const [copiedKeys, setCopiedKeys] = useState({});
  const [activeTab, setActiveTab] = useState("users"); // "users" or "plans"
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    calls: "",
    features: "",
    active: true,
    order: 0,
    popular: false,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    // Try querying with where clause first
    const tryQuery = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "api"));
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const users = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setApiUsers(users);
            setLoading(false);
          },
          async (error) => {
            // If permission denied, try fetching all users and filtering client-side
            if (error.code === "permission-denied") {
              console.warn(
                "Permission denied for role query, trying fallback..."
              );
              try {
                const allUsersRef = collection(db, "users");
                const allUsersUnsub = onSnapshot(
                  allUsersRef,
                  (snapshot) => {
                    const allUsers = snapshot.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    }));
                    // Filter for API role users client-side
                    const apiUsersOnly = allUsers.filter(
                      (u) => u.role === "api"
                    );
                    setApiUsers(apiUsersOnly);
                    setLoading(false);
                  },
                  (fallbackError) => {
                    console.error("Error in fallback fetch:", fallbackError);
                    showAlert(
                      "Failed to load API users. Please check Firestore permissions."
                    );
                    setLoading(false);
                  }
                );
                unsubscribe = allUsersUnsub;
              } catch (fallbackErr) {
                console.error("Fallback fetch failed:", fallbackErr);
                showAlert(
                  "Failed to load API users. Please check Firestore permissions."
                );
                setLoading(false);
              }
            } else {
              console.error("Error fetching API users:", error);
              showAlert("Failed to load API users");
              setLoading(false);
            }
          }
        );
      } catch (err) {
        console.error("Error setting up query:", err);
        showAlert("Failed to load API users");
        setLoading(false);
      }
    };

    tryQuery();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin, showAlert]);

  // Fetch subscription plans
  useEffect(() => {
    if (!isAdmin || activeTab !== "plans") return;

    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const response = await axios.get(
          `${import.meta.env.VITE_PAYMENT_URL}/api/subscription-plans`
        );
        if (response.data.success) {
          setSubscriptionPlans(response.data.plans || []);
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        showAlert("Failed to load subscription plans");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [isAdmin, activeTab, showAlert]);

  const generateApiKey = () => {
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      ""
    );
    return `GB-${hex}`;
  };

  const maskedKey = (key) => {
    if (!key || key.length < 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  const handleGenerateKey = async (userId) => {
    if (!isAdmin) return;

    setGeneratingKeys((prev) => ({ ...prev, [userId]: true }));

    try {
      const newKey = generateApiKey();
      const userRef = doc(db, "users", userId);

      await updateDoc(userRef, {
        apiKey: newKey,
        apiKeyGeneratedAt: new Date().toISOString(),
      });

      showAlert("API key generated successfully!");
    } catch (error) {
      console.error("Error generating API key:", error);
      showAlert("Failed to generate API key");
    } finally {
      setGeneratingKeys((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleCopyKey = async (key, userId) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeys((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => {
        setCopiedKeys((prev) => ({ ...prev, [userId]: false }));
      }, 2000);
    } catch (error) {
      showAlert("Failed to copy key");
    }
  };

  const toggleKeyVisibility = (userId) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const filteredUsers = apiUsers.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.uid?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.apiKey?.toLowerCase().includes(search)
    );
  });

  const handleSavePlan = async () => {
    try {
      if (!planForm.name || !planForm.price || !planForm.calls) {
        showAlert("Please fill in all required fields");
        return;
      }

      const featuresArray = planForm.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        ksmApi: import.meta.env.VITE_APP_KSM_API,
        planId: editingPlan?.id || null,
        name: planForm.name,
        price: Number(planForm.price),
        calls: Number(planForm.calls),
        features: featuresArray,
        active: planForm.active,
        order: Number(planForm.order) || 0,
        popular: planForm.popular,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/api/subscription-plans`,
        payload
      );

      if (response.data.success) {
        showAlert(
          editingPlan
            ? "Plan updated successfully"
            : "Plan created successfully"
        );
        setShowPlanModal(false);
        setEditingPlan(null);
        setPlanForm({
          name: "",
          price: "",
          calls: "",
          features: "",
          active: true,
          order: 0,
          popular: false,
        });
        // Refresh plans
        const refreshResponse = await axios.get(
          `${import.meta.env.VITE_PAYMENT_URL}/api/subscription-plans`
        );
        if (refreshResponse.data.success) {
          setSubscriptionPlans(refreshResponse.data.plans || []);
        }
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      showAlert("Failed to save plan");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || "",
      price: plan.price || "",
      calls: plan.calls || "",
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      active: plan.active !== undefined ? plan.active : true,
      order: plan.order || 0,
      popular: plan.popular || false,
    });
    setShowPlanModal(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      price: "",
      calls: "",
      features: "",
      active: true,
      order: 0,
      popular: false,
    });
    setShowPlanModal(true);
  };

  const handleViewUserOrders = async (apiUser) => {
    setSelectedUser(apiUser);
    setLoadingOrders(true);
    setShowOrdersModal(true);
    setUserOrders([]);

    try {
      // Fetch only from apiOrders collection filtered by userUid
      const apiOrdersRef = collection(db, "apiOrders");
      const q = query(
        apiOrdersRef,
        where("userUid", "==", apiUser.id),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserOrders(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      showAlert("Failed to load user orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      if (typeof timestamp === "number") {
        return new Date(timestamp).toLocaleString();
      }
      if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleString();
      }
      return "-";
    } catch (err) {
      return "-";
    }
  };

  if (!isAdmin) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div
          className={`text-center p-8 rounded-xl ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <h1
            className={`text-2xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Access Denied
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            This page is only accessible to administrators.
          </p>
        </div>
      </div>
    );
  }

  const cardClass = isDarkMode
    ? "bg-gray-800 border border-gray-700"
    : "bg-white border border-gray-200";
  const textClass = isDarkMode ? "text-white" : "text-gray-900";
  const subtextClass = isDarkMode ? "text-gray-400" : "text-gray-600";
  const inputClass = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      } py-8 px-4`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg`}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${textClass}`}>
                API Admin Dashboard
              </h1>
              <p className={subtextClass}>
                Manage API users and subscription plans
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === "users"
                ? "border-blue-500 text-blue-500"
                : `${subtextClass} border-transparent`
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            API Users
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === "plans"
                ? "border-blue-500 text-blue-500"
                : `${subtextClass} border-transparent`
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Subscription Plans
          </button>
        </div>

        {/* Subscription Plans Tab */}
        {activeTab === "plans" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textClass}`}>
                Subscription Plans
              </h2>
              <button
                onClick={handleNewPlan}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Plan
              </button>
            </div>

            {loadingPlans ? (
              <div className={`${cardClass} p-8 rounded-xl text-center`}>
                <p className={subtextClass}>Loading plans...</p>
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <div className={`${cardClass} p-8 rounded-xl text-center`}>
                <p className={subtextClass}>No subscription plans found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`${cardClass} p-6 rounded-xl shadow-md`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`text-xl font-bold ${textClass}`}>
                          {plan.name}
                        </h3>
                        {plan.popular && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded mt-1 inline-block">
                            Popular
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className={textClass}>
                        <span className="text-2xl font-bold">
                          ₹{Number(plan.price).toLocaleString()}
                        </span>
                      </p>
                      <p className={subtextClass}>
                        <strong>{Number(plan.calls).toLocaleString()}</strong>{" "}
                        API calls
                      </p>
                      {Array.isArray(plan.features) &&
                        plan.features.length > 0 && (
                          <ul className="list-disc list-inside text-sm space-y-1 mt-3">
                            {plan.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className={subtextClass}>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      <p
                        className={`text-xs mt-3 ${
                          plan.active ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {plan.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Plan Modal */}
            {showPlanModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div
                  className={`${cardClass} p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}
                >
                  <h3 className={`text-2xl font-bold mb-4 ${textClass}`}>
                    {editingPlan ? "Edit Plan" : "Add New Plan"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${textClass}`}
                      >
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        value={planForm.name}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, name: e.target.value })
                        }
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="e.g., Basic, Premium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-semibold mb-2 ${textClass}`}
                        >
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={planForm.price}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, price: e.target.value })
                          }
                          className={`w-full px-4 py-2 rounded-lg border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                          placeholder="3000"
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-semibold mb-2 ${textClass}`}
                        >
                          API Calls *
                        </label>
                        <input
                          type="number"
                          value={planForm.calls}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, calls: e.target.value })
                          }
                          className={`w-full px-4 py-2 rounded-lg border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-2 ${textClass}`}
                      >
                        Features (one per line)
                      </label>
                      <textarea
                        value={planForm.features}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, features: e.target.value })
                        }
                        rows={4}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-semibold mb-2 ${textClass}`}
                        >
                          Order
                        </label>
                        <input
                          type="number"
                          value={planForm.order}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, order: e.target.value })
                          }
                          className={`w-full px-4 py-2 rounded-lg border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={planForm.active}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              active: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className={textClass}>Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={planForm.popular}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              popular: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className={textClass}>Popular</span>
                      </label>
                    </div>
                    <div className="flex gap-4 justify-end mt-6">
                      <button
                        onClick={() => {
                          setShowPlanModal(false);
                          setEditingPlan(null);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePlan}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingPlan ? "Update Plan" : "Create Plan"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Users Tab */}
        {activeTab === "users" && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`${cardClass} p-6 rounded-xl shadow-md`}>
                <p className={`text-sm ${subtextClass} mb-1`}>
                  Total API Users
                </p>
                <p className={`text-3xl font-bold ${textClass}`}>
                  {apiUsers.length}
                </p>
              </div>
              <div className={`${cardClass} p-6 rounded-xl shadow-md`}>
                <p className={`text-sm ${subtextClass} mb-1`}>Active Keys</p>
                <p className={`text-3xl font-bold ${textClass}`}>
                  {apiUsers.filter((u) => u.apiKey).length}
                </p>
              </div>
              <div className={`${cardClass} p-6 rounded-xl shadow-md`}>
                <p className={`text-sm ${subtextClass} mb-1`}>Basic Plans</p>
                <p className={`text-3xl font-bold ${textClass}`}>
                  {
                    apiUsers.filter((u) => u.apiSubscriptionPlan === "basic")
                      .length
                  }
                </p>
              </div>
              <div className={`${cardClass} p-6 rounded-xl shadow-md`}>
                <p className={`text-sm ${subtextClass} mb-1`}>Premium Plans</p>
                <p className={`text-3xl font-bold ${textClass}`}>
                  {
                    apiUsers.filter((u) => u.apiSubscriptionPlan === "premium")
                      .length
                  }
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className={`${cardClass} p-4 rounded-xl shadow-md mb-6`}>
              <div className="flex items-center gap-3">
                <Search className={`w-5 h-5 ${subtextClass}`} />
                <input
                  type="text"
                  placeholder="Search by username, UID, email, or API key..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
              <div
                className={`${cardClass} p-8 rounded-xl shadow-md text-center`}
              >
                <RefreshCw
                  className={`w-8 h-8 ${subtextClass} animate-spin mx-auto mb-2`}
                />
                <p className={subtextClass}>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div
                className={`${cardClass} p-8 rounded-xl shadow-md text-center`}
              >
                <p className={subtextClass}>No API users found</p>
              </div>
            ) : (
              <div
                className={`${cardClass} rounded-xl shadow-md overflow-hidden`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead
                      className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}
                    >
                      <tr>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${textClass}`}
                        >
                          User
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${textClass}`}
                        >
                          Subscription
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${textClass}`}
                        >
                          API Usage
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${textClass}`}
                        >
                          API Key
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-semibold ${textClass}`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((apiUser) => (
                        <tr
                          key={apiUser.id}
                          className={`border-t ${
                            isDarkMode
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-50"
                          } cursor-pointer`}
                          onClick={() => handleViewUserOrders(apiUser)}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className={`font-semibold ${textClass}`}>
                                {apiUser.username || "N/A"}
                              </p>
                              <p className={`text-sm ${subtextClass}`}>
                                {apiUser.email || apiUser.uid}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                apiUser.apiSubscriptionPlan === "premium"
                                  ? "bg-purple-100 text-purple-800"
                                  : apiUser.apiSubscriptionPlan === "basic"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {apiUser.apiSubscriptionPlan?.toUpperCase() ||
                                "NONE"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className={`text-sm ${textClass}`}>
                                {apiUser.apiCallsUsed || 0} /{" "}
                                {apiUser.apiCallsLimit || 0}
                              </p>
                              <div
                                className={`w-32 h-2 rounded-full mt-1 ${
                                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                }`}
                              >
                                <div
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{
                                    width: `${Math.min(
                                      ((apiUser.apiCallsUsed || 0) /
                                        (apiUser.apiCallsLimit || 1)) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {apiUser.apiKey ? (
                              <div className="flex items-center gap-2">
                                <code
                                  className={`px-3 py-1 rounded font-mono text-sm ${
                                    isDarkMode
                                      ? "bg-gray-700 text-gray-300"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {visibleKeys[apiUser.id]
                                    ? apiUser.apiKey
                                    : maskedKey(apiUser.apiKey)}
                                </code>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleKeyVisibility(apiUser.id);
                                  }}
                                  className={`p-1.5 rounded hover:bg-gray-200 ${
                                    isDarkMode ? "hover:bg-gray-700" : ""
                                  }`}
                                  title={
                                    visibleKeys[apiUser.id]
                                      ? "Hide key"
                                      : "Show key"
                                  }
                                >
                                  {visibleKeys[apiUser.id] ? (
                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyKey(apiUser.apiKey, apiUser.id);
                                  }}
                                  className={`p-1.5 rounded hover:bg-gray-200 ${
                                    isDarkMode ? "hover:bg-gray-700" : ""
                                  }`}
                                  title="Copy key"
                                >
                                  {copiedKeys[apiUser.id] ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className={subtextClass}>No key</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateKey(apiUser.id);
                              }}
                              disabled={generatingKeys[apiUser.id]}
                              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                generatingKeys[apiUser.id]
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              {generatingKeys[apiUser.id] ? (
                                <span className="flex items-center gap-2">
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Generating...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <Key className="w-4 h-4" />
                                  {apiUser.apiKey ? "Regenerate" : "Generate"}
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Orders Modal */}
        {showOrdersModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`${cardClass} rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}
            >
              <div className="p-6 border-b border-gray-300 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-2xl font-bold ${textClass}`}>
                      API Orders - {selectedUser.username || selectedUser.uid}
                    </h3>
                    <p className={`text-sm ${subtextClass} mt-1`}>
                      {selectedUser.email || selectedUser.uid}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowOrdersModal(false);
                      setSelectedUser(null);
                      setUserOrders([]);
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    } ${textClass}`}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingOrders ? (
                  <div className="text-center py-12">
                    <RefreshCw
                      className={`w-8 h-8 ${subtextClass} animate-spin mx-auto mb-2`}
                    />
                    <p className={subtextClass}>Loading orders...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className={subtextClass}>
                      No orders found for this user
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead
                        className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}
                      >
                        <tr>
                          <th
                            className={`px-4 py-3 text-left text-sm font-semibold ${textClass}`}
                          >
                            Order ID
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-sm font-semibold ${textClass}`}
                          >
                            Product
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-sm font-semibold ${textClass}`}
                          >
                            Status
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-sm font-semibold ${textClass}`}
                          >
                            Cost
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-sm font-semibold ${textClass}`}
                          >
                            Date
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-sm font-semibold ${textClass}`}
                          >
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {userOrders.map((order) => (
                          <tr
                            key={order.id || order.orderId || order.gameId}
                            className={`border-t ${
                              isDarkMode
                                ? "border-gray-700 hover:bg-gray-700"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <code className={`text-xs ${subtextClass}`}>
                                {order.id ||
                                  order.orderId ||
                                  order.gameId ||
                                  "-"}
                              </code>
                            </td>
                            <td className={`px-4 py-3 ${textClass}`}>
                              {order.product ||
                                order.item ||
                                order.productId ||
                                "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {order.status?.toUpperCase() || "UNKNOWN"}
                              </span>
                            </td>
                            <td className={`px-4 py-3 ${textClass}`}>
                              ₹
                              {Number(
                                order.cost || order.amount || 0
                              ).toLocaleString()}
                            </td>
                            <td className={`px-4 py-3 ${subtextClass} text-sm`}>
                              {formatDate(
                                order.createdAt || order.timestamp || order.date
                              )}
                            </td>
                            <td className={`px-4 py-3 ${subtextClass} text-sm`}>
                              {order.payment?.toUpperCase() || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {userOrders.length > 0 && (
                <div
                  className={`p-4 border-t border-gray-300 dark:border-gray-700 ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <p className={`text-sm ${subtextClass}`}>
                    Total Orders:{" "}
                    <strong className={textClass}>{userOrders.length}</strong> |
                    Completed:{" "}
                    <strong className="text-green-600">
                      {
                        userOrders.filter((o) => o.status === "completed")
                          .length
                      }
                    </strong>{" "}
                    | Pending:{" "}
                    <strong className="text-yellow-600">
                      {userOrders.filter((o) => o.status === "pending").length}
                    </strong>{" "}
                    | Failed:{" "}
                    <strong className="text-red-600">
                      {userOrders.filter((o) => o.status === "failed").length}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiAdminDashboard;
