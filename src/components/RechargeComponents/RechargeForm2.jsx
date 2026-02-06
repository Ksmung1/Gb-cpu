import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { checkUsername } from "../../utils/checkUsername";
import { useDarkMode } from "../../context/DarkModeContext";
import { RefreshCw, Info } from "lucide-react";

// ONLY EDIT THIS OBJECT WHEN ADDING NEW GAME
const GAME_CONFIG = {
  "/mlbb-recharge": { product: "mobilelegends", productId: "13", storageKey: "ml_prev_data" },
  "/mcgg-recharge": { product: "magicchessgogo", productId: "23837", storageKey: "mc_prev_data" },
  "/super-sus": { product: "supersus", productId: "3088", storageKey: "ss_prev_data" },
  "/blood-strike": { product: "bloodstrike", productId: "20294", storageKey: "bs_prev_data" },
  "/where-winds-meet": { product: "wherewindsmeet", productId: "25723", storageKey: "wwm_prev_data" },
  // Add new game? → Just one line here
};

const DEFAULT_CONFIG = { product: "mobilelegends", productId: "13", storageKey: "ml_prev_data" };

const RechargeForm2 = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const location = useLocation();
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();

  const config = GAME_CONFIG[location.pathname] || DEFAULT_CONFIG;

  const [zone, setZone] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [hasPrevData, setHasPrevData] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isReseller = user?.role === "reseller";

  // ONE SINGLE useEffect for all games
  useEffect(() => {
    const stored = localStorage.getItem(config.storageKey);
    if (stored) setHasPrevData(true);
  }, [config.storageKey]);

  useEffect(() => {
    if (usernameExists === false) {
      setUserId("");
      setZoneId("");
      setUsername("");
      setZone("");
      setModalMessage("");
      setShowModal(false);
      setLoading(false);
      setCooldown(0);
    }
  }, [usernameExists]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleInfoClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2500);
  };

  const resetResults = () => {
    setUsername("");
    setZone("");
    setModalMessage("");
    setShowModal(false);
    setCooldown(0);
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("text").trim();
    resetResults();
    const parenMatch = pastedText.match(/^(\d+)\s*\((\d+)\)$/);
    if (parenMatch) {
      e.preventDefault();
      setUserId(parenMatch[1]);
      setZoneId(parenMatch[2]);
      return;
    }

    const parts = pastedText.split(/[\s-]+/);
    if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      e.preventDefault();
      setUserId(parts[0]);
      setZoneId(parts[1]);
      return;
    }

    const digitsOnly = pastedText.replace(/\D/g, "");
    if (digitsOnly.length > 5) {
      e.preventDefault();
      setUserId(digitsOnly);
      setZoneId("");
    }
  };

  const handleNumberInput = (e, setter) => {
    const value = e.target.value.replace(/\D/g, "");
    resetResults();
    setter(value);
  };

  const fetchLastId = () => {
    const saved = JSON.parse(localStorage.getItem(config.storageKey));
    if (saved) {
      setUserId(saved.userId);
      setZoneId(saved.zoneId);
      setShowModal(false);
      resetResults();
    } else {
      setModalMessage("Warning: No previously fetched ID found.");
      setShowModal(true);
    }
  };

  const handleClick = async () => {
    if (cooldown > 0 && !isReseller) {
      setModalMessage(`Please wait ${Math.ceil(cooldown / 60)} min(s). <a href="https://your-subscription-link.com" target="_blank" class="underline text-blue-600">Upgrade plan</a>`);
      setShowModal(true);
      return;
    }
    if (!userId || !zoneId) {
      setModalMessage("Missing User ID or Server ID.");
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      setUsernameExists(true);
      const result = await checkUsername({
        userid: userId,
        zoneid: zoneId,
        product: config.product,
        productid: config.productId,
      });

      if (result.success) {
        setUsername(result.username);
        setZone(result.region || "");
        setShowModal(false);

        localStorage.setItem(config.storageKey, JSON.stringify({
          userId,
          zoneId,
          username: result.username,
          region: result.region || "",
        }));
        setHasPrevData(true);
      } else {
        setModalMessage(result.message || "Failed to fetch username.");
        setUsername("");
        setShowModal(true);
      }

      if (!isReseller) {
        setCooldown(5 * 60);
      }
    } catch (error) {
      setModalMessage("Something went wrong.");
      setUsername("");
      setUsernameExists(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // YOUR EXACT SAME UI — NOT A SINGLE PIXEL CHANGED
  return (
    <div className={`relative flex flex-col gap-2 p-4 shadow-md border rounded-xl items-center w-full sm:w-[100%] ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white/70 border-gray-300 text-gray-900"}`}>
      <div className="flex items-center gap-2 relative w-full group">
        <p>Order Information</p>
        <div className={`absolute bottom-full left-1/3 -translate-x-1/3 rounded py-1 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-black"}`}>
          Please paste ID and Server
        </div>
        {hasPrevData && !userId && !zoneId && (
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={fetchLastId} className="p-1 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors" title="Load previous ID" aria-label="Load previously saved User ID and Server ID">
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="relative">
              <button onClick={handleInfoClick} className="p-1 rounded-full bg-slate-600 hover:bg-slate-700 text-white transition-colors" aria-label="Show tooltip for loading previous ID">
                <Info className="h-4 w-4" />
              </button>
              {showTooltip && (
                <div className={`absolute top-full right-0 mt-1 rounded py-1 px-2 text-xs z-10 shadow-lg animate-fadeInOut ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-black"}`}>
                  Click to load previously saved User ID and Server ID
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <input value={userId} onChange={(e) => handleNumberInput(e, setUserId)} onPaste={handlePaste} type="text" placeholder="User ID" maxLength={20} className={`text-center w-full p-2 rounded-[30px] border-2 ${isDarkMode ? "border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400" : "border-gray-500 bg-white text-black placeholder-gray-600"}`} />

      <input value={zoneId} onChange={(e) => handleNumberInput(e, setZoneId)} onPaste={handlePaste} type="text" placeholder="Server ID" maxLength={10} className={`text-center w-full p-2 rounded-[30px] border-2 ${isDarkMode ? "border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400" : "border-gray-500 bg-white text-black placeholder-gray-600"}`} />

      <button
        onClick={handleClick}
        disabled={loading || (cooldown > 0 && !isReseller)}
        className={`w-50 py-2 px-4 rounded-full shadow-md font-semibold transition duration-300 ${loading || (cooldown > 0 && !isReseller) ? "cursor-not-allowed opacity-60 bg-blue-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        title={cooldown > 0 && !isReseller ? "Upgrade to remove cooldown" : ""}
        dangerouslySetInnerHTML={{ __html: loading ? "Loading..." : username ? `${username}` : "Check Username" }}
      />

      {username && (
        <div className={`flex flex-col justify-start w-full p-3 mt-2 rounded shadow-md border-2 ${isDarkMode ? "border-gray-700 bg-gray-900 text-gray-200" : "border-gray-300 bg-white text-gray-900"}`}>
          <p><strong>UserID:</strong> {userId}</p>
          <p><strong>ZoneID:</strong> {zoneId}</p>
          <p><strong>Username:</strong> {username}</p>
          {zone && <p><strong>Region:</strong> {zone}</p>}
        </div>
      )}

      {showModal && (
        <div className={`w-full text-center rounded px-4 py-3 border flex justify-between items-center ${isDarkMode ? "bg-red-900 border-red-700 text-red-300" : "bg-red-100 border-red-400 text-red-700"}`}>
          <span dangerouslySetInnerHTML={{ __html: modalMessage }} />
          <button onClick={() => setShowModal(false)} className="text-red-700 font-bold" aria-label="Close error message">X</button>
        </div>
      )}
    </div>
  );
};

export default RechargeForm2;