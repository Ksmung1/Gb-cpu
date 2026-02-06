import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDarkMode } from "../../context/DarkModeContext";
import { RefreshCw, Info } from "lucide-react";

const RechargeForm3 = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const { isDarkMode } = useDarkMode();
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPrevData, setHasPrevData] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Log props for debugging
  useEffect(() => {
    console.log("Props:", { userId, setUserId, zoneId, setZoneId, username, setUsername, usernameExists, setUsernameExists });
  }, [userId, zoneId, username, usernameExists]);

  // Check for previous data in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("inter_prev_data");
    if (stored) setHasPrevData(true);
  }, []);

  // Reset form when usernameExists is false (similar to RechargeForm2)
  useEffect(() => {
    if (usernameExists === false) {
      setUserId("");
      setZoneId("");
      setUsername("");
      setRegion("");
      setError("");
      setLoading(false);
    }
  }, [usernameExists, setUserId, setZoneId, setUsername]);

  // Reset helper — clears fetched username & region when IDs are changed
  const resetFetchedData = () => {
    setUsername("");
    setRegion("");
    setError("");
    // Do not reset usernameExists to avoid triggering useEffect
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("text").trim();
    resetFetchedData();
    const parenMatch = pastedText.match(/^(\d+)\s*\((\d+)\)$/);
    if (parenMatch) {
      e.preventDefault();
      console.log("Pasting UserID:", parenMatch[1], "ZoneID:", parenMatch[2]);
      setUserId(parenMatch[1]);
      setZoneId(parenMatch[2]);
      return;
    }

    const parts = pastedText.split(/[\s-]+/);
    if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      e.preventDefault();
      console.log("Pasting UserID:", parts[0], "ZoneID:", parts[1]);
      setUserId(parts[0]);
      setZoneId(parts[1]);
      return;
    }

    const digitsOnly = pastedText.replace(/\D/g, "");
    if (digitsOnly.length > 5) {
      e.preventDefault();
      console.log("Pasting UserID (digits only):", digitsOnly);
      setUserId(digitsOnly);
      setZoneId("");
    }
  };

  const handleNumberInput = (e, setter) => {
    const value = e.target.value.replace(/\D/g, "");
    console.log("handleNumberInput called with value:", value, "setter:", setter.name || "unknown");
    resetFetchedData();
    setter(value);
  };

  const fetchLastId = () => {
    const saved = JSON.parse(localStorage.getItem("inter_prev_data"));
    if (saved) {
      console.log("Fetching saved data (only UserID and ZoneID):", {
        userId: saved.userId,
        zoneId: saved.zoneId,
      });
      setUserId(saved.userId);
      setZoneId(saved.zoneId);
      resetFetchedData(); // Clear username, region, and error
      setError("");
      // Do not set username, region, or usernameExists
    } else {
      setError("⚠️ No previously fetched ID found.");
    }
  };

  const handleInfoClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUsername("");
    setRegion("");
    // Do not reset usernameExists to avoid clearing inputs

    if (!userId) {
      setError("Please enter User ID");
      return;
    }
    if (!zoneId) {
      setError("Please enter Server ID");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/ml/get-username/${userId}/${zoneId}`
      );
      setUsername(res.data.username);
      setRegion(res.data.region);
      setUsernameExists(true);
      localStorage.setItem(
        "inter_prev_data",
        JSON.stringify({
          userId,
          zoneId,
          username: res.data.username,
          region: res.data.region,
        })
      );
      setHasPrevData(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
      setUsername("");
      setUsernameExists(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 shadow-md border rounded-xl items-center w-full sm:w-[100%] ${
        isDarkMode
          ? "bg-gray-800 border-gray-700 text-gray-200"
          : "bg-white/70 border-gray-300 text-gray-900"
      }`}
    >
      <div className="flex items-center gap-2 relative w-full group">
        <p>Order Information</p>
        {hasPrevData && !userId && !zoneId && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={fetchLastId}
              className="p-1 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
              title="Load previous ID"
              aria-label="Load previously saved User ID and Server ID"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={handleInfoClick}
                className="p-1 rounded-full bg-slate-600 hover:bg-slate-700 text-white transition-colors"
                aria-label="Show tooltip for loading previous ID"
              >
                <Info className="h-4 w-4" />
              </button>
              {showTooltip && (
                <div
                  className={`absolute top-full right-0 mt-1 rounded py-1 px-2 text-xs z-10 shadow-lg animate-fadeInOut ${
                    isDarkMode
                      ? "bg-gray-900 text-gray-200"
                      : "bg-white text-black"
                  }`}
                >
                  Click to load previously saved User ID and Server ID
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        value={userId}
        onChange={(e) => handleNumberInput(e, setUserId)}
        onPaste={handlePaste}
        type="text"
        placeholder="User ID"
        maxLength={20}
        className={`text-center w-full p-2 rounded-[30px] border-2 ${
          isDarkMode
            ? "border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400"
            : "border-gray-500 bg-white text-black placeholder-gray-600"
        }`}
      />

      <input
        value={zoneId}
        onChange={(e) => handleNumberInput(e, setZoneId)}
        onPaste={handlePaste}
        type="text"
        placeholder="Server ID"
        maxLength={10}
        className={`text-center w-full p-2 rounded-[30px] border-2 ${
          isDarkMode
            ? "border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400"
            : "border-gray-500 bg-white text-black placeholder-gray-600"
        }`}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-50 py-2 px-4 rounded-full shadow-md font-semibold transition duration-300 ${
          loading
            ? "cursor-not-allowed opacity-60 bg-blue-600 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        dangerouslySetInnerHTML={{
          __html:
            loading
              ? "Loading..."
              : username && usernameExists
              ? `✅ ${username}`
              : "Check Username",
        }}
      />

      {username && usernameExists && (
        <div
          className={`flex flex-col justify-start w-full p-3 mt-2 rounded shadow-md border-2 ${
            isDarkMode
              ? "border-gray-700 bg-gray-900 text-gray-200"
              : "border-gray-300 bg-white text-gray-900"
          }`}
        >
          <p>
            <strong>UserID:</strong> {userId}
          </p>
          <p>
            <strong>ZoneID:</strong> {zoneId}
          </p>
          <p>
            <strong>Username:</strong> {username}
          </p>
          {region && (
            <p>
              <strong>Region:</strong> {region}
            </p>
          )}
        </div>
      )}

      {error && (
        <div
          className={`w-full text-center rounded px-4 py-3 border flex justify-between items-center ${
            isDarkMode
              ? "bg-red-900 border-red-700 text-red-300"
              : "bg-red-100 border-red-400 text-red-700"
          }`}
        >
          <span dangerouslySetInnerHTML={{ __html: error }} />
          <button
            onClick={() => setError("")}
            className="text-red-700 font-bold"
            aria-label="Close error message"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};


export default RechargeForm3;