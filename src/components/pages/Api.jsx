import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import { useUser } from "../../context/UserContext";
import { useAlert } from "../../context/AlertContext";
import {
  Key,
  Package,
  FileText,
  ShoppingCart,
  Settings,
  Users,
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useState } from "react";

const Api = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { user, setUser } = useUser();
  const { showAlert } = useAlert();
  const isAdmin = user?.role === "admin";
  const isApiUser = user?.role === "admin" || user?.role === "api";
  const [showKey, setShowKey] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [generating, setGenerating] = useState(false);

  const cardClass = `
    p-6 rounded-xl shadow-md cursor-pointer 
    transition-all duration-300 transform hover:scale-105 hover:shadow-xl
    ${
      isDarkMode
        ? "bg-gray-800 border border-gray-700 hover:border-blue-500"
        : "bg-white border border-gray-200 hover:border-blue-400"
    }
  `;

  const textClass = isDarkMode ? "text-white" : "text-gray-900";
  const subtextClass = isDarkMode ? "text-gray-400" : "text-gray-600";
  const iconClass = isDarkMode ? "text-blue-400" : "text-blue-600";

  const generateApiKey = () => {
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      ""
    );
    return `GB-${hex}`;
  };

  const handleCopy = async () => {
    if (!user?.apiKey) return;
    try {
      await navigator.clipboard.writeText(user.apiKey);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 1500);
    } catch (err) {
      console.error(err);
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 1500);
    }
  };

  const handleGenerateKey = async () => {
    if (!isAdmin) {
      showAlert(
        "Only administrators can generate API keys. Please contact an admin."
      );
      return;
    }

    try {
      setGenerating(true);
      const newKey = generateApiKey();
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        apiKey: newKey,
        apiKeyGeneratedAt: new Date().toISOString(),
      });

      setUser((prev) => ({
        ...prev,
        apiKey: newKey,
      }));

      showAlert("API key generated successfully!");
    } catch (err) {
      console.error("Error generating API key:", err);
      showAlert("Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };

  const maskedKey = (key) => {
    if (!key || key.length < 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  const menuItems = [
    {
      icon: Package,
      title: "Products",
      description: "View available API products",
      path: "/api/products",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: FileText,
      title: "API Docs",
      description: "View API documentation",
      path: "/api/docs",
      color: "from-green-500 to-green-600",
    },
    {
      icon: ShoppingCart,
      title: "Orders",
      description: "View orders made via API",
      path: "/api/orders",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: CreditCard,
      title: "Subscriptions",
      description: "Manage your API subscription plans",
      path: "/api/subscriptions",
      color: "from-pink-500 to-pink-600",
    },
    ...(isAdmin
      ? [
          {
            icon: Users,
            title: "Admin Dashboard",
            description: "Manage API users and keys",
            path: "/api/admin",
            color: "from-red-500 to-red-600",
            admin: true,
          },
        ]
      : []),
  ];

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
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${textClass}`}>
            API Dashboard
          </h1>
          <p className={`text-lg ${subtextClass} max-w-2xl mx-auto`}>
            Manage your API access, view products, documentation, and track your
            usage
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                className={cardClass}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${item.color} shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className={`text-xl font-semibold ${textClass}`}>
                        {item.title}
                      </h2>
                      {item.admin && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${subtextClass} mt-1`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* API Profile Section */}
        {isApiUser && (
          <div
            className={`mt-12 p-6 rounded-xl ${
              isDarkMode
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            } shadow-lg`}
          >
            <h3 className={`text-2xl font-semibold mb-6 ${textClass}`}>
              API Profile
            </h3>

            <div className="space-y-6">
              {/* Username */}
              <div>
                <div className={`text-sm ${subtextClass} mb-1`}>Username</div>
                <div className={`text-lg font-semibold ${textClass}`}>
                  {user?.username || "-"}
                </div>
              </div>

              {/* UID */}
              <div>
                <div className={`text-sm ${subtextClass} mb-1`}>UID</div>
                <div className={`text-lg font-semibold ${textClass}`}>
                  {user?.uid || "-"}
                </div>
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className={`text-sm ${subtextClass} mb-1`}>
                      API Key
                    </div>
                    <div className={`text-xs ${subtextClass}`}>
                      Keep this secret. Do not share publicly.
                    </div>
                  </div>
                  {!user?.apiKey && isAdmin && (
                    <button
                      onClick={handleGenerateKey}
                      disabled={generating}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                      {generating ? "Generating..." : "Generate API Key"}
                    </button>
                  )}
                </div>

                {user?.apiKey ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`flex-1 font-mono px-3 py-2 rounded border text-sm ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-100 text-gray-800"
                      } overflow-x-auto`}
                    >
                      {showKey ? user.apiKey : maskedKey(user.apiKey)}
                    </div>
                    <button
                      onClick={() => setShowKey((prev) => !prev)}
                      className={`p-2 rounded border ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      title={showKey ? "Hide API key" : "Show API key"}
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={handleCopy}
                      className={`px-3 py-2 text-sm rounded border ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {copyStatus ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                ) : (
                  !isAdmin && (
                    <div
                      className={`px-3 py-2 text-sm ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-400"
                          : "bg-gray-200 text-gray-600"
                      } rounded-lg mt-2`}
                    >
                      Contact admin to generate API key
                    </div>
                  )
                )}
                {copyStatus && (
                  <div className={`mt-1 text-xs text-green-600`}>
                    {copyStatus}
                  </div>
                )}
              </div>

              {/* API Usage */}
              {(user?.apiCallsLimit || user?.apiCallsUsed !== undefined) && (
                <div>
                  <div className={`text-sm ${subtextClass} mb-2`}>
                    API Usage
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={textClass}>
                        {user?.apiCallsUsed || 0} / {user?.apiCallsLimit || 0}{" "}
                        calls
                      </span>
                      <span className={subtextClass}>
                        {user?.apiCallsLimit
                          ? `${(
                              (user?.apiCallsLimit || 0) -
                              (user?.apiCallsUsed || 0)
                            ).toLocaleString()} remaining`
                          : "No limit set"}
                      </span>
                    </div>
                    <div
                      className={`w-full h-2 rounded-full ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            ((user?.apiCallsUsed || 0) /
                              (user?.apiCallsLimit || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Section */}
        {user?.apiKey && (
          <div
            className={`mt-12 p-6 rounded-xl ${
              isDarkMode
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            } shadow-lg`}
          >
            <h3 className={`text-xl font-semibold mb-4 ${textClass}`}>
              Quick Stats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className={`text-sm ${subtextClass}`}>Subscription Plan</p>
                <p className={`text-2xl font-bold mt-1 ${textClass}`}>
                  {user?.apiSubscriptionPlan || "None"}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className={`text-sm ${subtextClass}`}>API Calls Used</p>
                <p className={`text-2xl font-bold mt-1 ${textClass}`}>
                  {user?.apiCallsUsed || 0} / {user?.apiCallsLimit || 0}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p className={`text-sm ${subtextClass}`}>Status</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    user?.apiKey ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {user?.apiKey ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Api;
