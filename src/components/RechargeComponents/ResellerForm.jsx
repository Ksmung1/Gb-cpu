/* ResellerForm.jsx – pure JavaScript (no TypeScript) */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAlert } from "../../context/AlertContext";

/* -------------------------------------------------
   1. Zone‑specific configuration
   ------------------------------------------------- */
const ZONE_DROPDOWN_MAP = {
  Asia: "os_asia",
  America: "os_america",
  Europe: "os_europe",
  "TW/HK/MO": "os_tw,hk,mo",
};

const GAME_CONFIG = {
  // ---------- No zone ----------
  "pubg-global": { needsZone: false },
  "super-sus": { needsZone: false },
  "honor-of-kings": {needsZone: false},

  // ---------- Dropdown zone ----------
  "honkai-starrail": { needsZone: true, zoneType: "dropdown" },
  "genshin-impact": { needsZone: true, zoneType: "dropdown" },
  "zzz": { needsZone: true, zoneType: "dropdown" },
  "wuthering-waves": { needsZone: true, zoneType: "dropdown" },


  // ---------- Text‑input zone ----------
};

/* -------------------------------------------------
   2. Component
   ------------------------------------------------- */
const ResellerForm = ({
  userId,
  setUserId,
  usernameExists,
  setUsernameExists,
  username,
  setUsername,
}) => {
  /* ---- form state ---- */
  const [loading, setLoading] = useState(false);
  const [gameCode, setGameCode] = useState(""); // e.g. "pubg-global"
  const [zoneLabel, setZoneLabel] = useState(""); // UI label (Asia, NA1, etc.)
  const [zoneid, setZoneid] = useState("");       // actual value sent to API

  /* ---- context ---- */
  const { showAlert } = useAlert();
  const { isDarkMode } = useDarkMode();
  const location = useLocation();

  /* -------------------------------------------------
     3. Extract gameCode from URL
     ------------------------------------------------- */
  useEffect(() => {
    const path = location.pathname.toLowerCase().replace(/^\//, "");
    if (path && GAME_CONFIG[path]) {
      setGameCode(path);
      // reset form when game changes
      setUserId("");
      setUsername("");
      setZoneLabel("");
      setZoneid("");
      setUsernameExists(false);
    }
  }, [location.pathname, setUsernameExists]);

  /* -------------------------------------------------
     4. Load saved data (per game)
     ------------------------------------------------- */
  useEffect(() => {
    if (!gameCode) return;

    const storageKey = `${gameCode}_prev_data`;
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    let data;
    try {
      data = JSON.parse(saved);
    } catch (e) {
      console.error(`Failed to parse ${storageKey}`, e);
      return;
    }

    setUserId(data.userId || "");
    setUsername(data.username || "");
    setZoneLabel(data.zoneLabel || "");
    setZoneid(data.zoneid || "");
    setUsernameExists(!!data.usernameExists);
  }, [gameCode, setUsernameExists]);

  /* -------------------------------------------------
     5. Reset username when UID or zone changes
     ------------------------------------------------- */
  useEffect(() => {
    if (userId || zoneid) {
      setUsernameExists(false);
      setUsername("");
    }
  }, [userId, zoneid, setUsernameExists]);

  /* -------------------------------------------------
     6. UID → numbers only
     ------------------------------------------------- */
  const handleUIDInput = (e) => {
    const numbers = e.target.value.replace(/\D/g, "");
    setUserId(numbers);
  };

  /* -------------------------------------------------
     7. Zone change → set both label and zoneid
     ------------------------------------------------- */
  const handleZoneChange = (label, id) => {
    setZoneLabel(label);
    setZoneid(id);
  };

  /* -------------------------------------------------
     8. Confirm → call backend
     ------------------------------------------------- */
  const handleConfirm = async () => {
    if (!userId) return showAlert("Please enter your Player ID / UID");
    if (!gameCode) return showAlert("Invalid game route");

    const cfg = GAME_CONFIG[gameCode];
    if (cfg.needsZone && !zoneid) {
      return showAlert("Please select / enter a zone");
    }

    setLoading(true);

    try {
      const url = new URL("https://api.gamebar.in/get-game-username");
      url.searchParams.append("code", gameCode);
      url.searchParams.append("user_id", userId);

      // send zoneid only when required
      if (cfg.needsZone && zoneid) {
        url.searchParams.append("server_code", zoneid); // ← API expects `zoneid`
      }

      const res = await fetch(url.toString());

      // ---- HTTP error ----
      if (!res.ok) {
        let msg = "Unknown error";
        try {
          const err = await res.json();
          msg = err.error || `HTTP ${res.status}`;
        } catch {
          msg = `HTTP ${res.status}`;
        }
        showAlert(`Error: ${msg}`);
        return;
      }

      // ---- Parse JSON ----
      const data = await res.json();
      const playerName = data.username?.trim();

      if (!playerName) {
        showAlert("Player not found");
        return;
      }

      // ---- Success ----
      setUsername(playerName);
      setUsernameExists(true);

      // Persist per game
      const storageKey = `${gameCode}_prev_data`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          userId,
          username: playerName,
          usernameExists: true,
          zoneLabel: cfg.needsZone ? zoneLabel : undefined,
          zoneid: cfg.needsZone ? zoneid : undefined,
        })
      );
    } catch (err) {
      console.error("API call failed:", err);
      showAlert(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------
     9. Render
     ------------------------------------------------- */
  if (!gameCode || !GAME_CONFIG[gameCode]) {
    return (
      <div className="text-center text-red-500 p-6">
        Invalid game path. Supported: {Object.keys(GAME_CONFIG).join(", ")}
      </div>
    );
  }

  const cfg = GAME_CONFIG[gameCode];
  const showZone = cfg.needsZone;

  return (
    <div
      className={`flex flex-col gap-3 p-4 shadow-md rounded-md items-center w-full sm:w-full ${
        isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white/70 text-gray-900"
      }`}
    >


   

      {/* ---- Player ID / UID ---- */}
      <input
        value={userId}
        onChange={handleUIDInput}
        type="text"
        inputMode="numeric"
        placeholder="Enter Player ID"
        className={`text-center w-full border-2 p-2 rounded-[30px] placeholder-gray-500 ${
          isDarkMode
            ? "border-gray-600 bg-gray-700 text-gray-200"
            : "border-gray-500 bg-white text-gray-900"
          }`}
      />
            {/* ---- Zone (dropdown) ---- */}
      {showZone && cfg.zoneType === "dropdown" && (
        <select
          value={zoneLabel}
          onChange={(e) =>
            handleZoneChange(e.target.value, ZONE_DROPDOWN_MAP[e.target.value])
          }
          className={`text-center w-full border-2 p-2 rounded-[30px] ${
            isDarkMode
              ? "border-gray-600 bg-gray-700 text-gray-200"
              : "border-gray-500 bg-white text-gray-900"
          }`}
        >
          <option value="">Select Zone</option>
          {Object.keys(ZONE_DROPDOWN_MAP).map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      )}
         {/* ---- Zone (text input) ---- */}
      {showZone && cfg.zoneType === "input" && (
        <input
          value={zoneLabel}
          onChange={(e) => handleZoneChange(e.target.value, e.target.value)}
          type="text"
          placeholder="Enter Zone (e.g. NA1)"
          className={`text-center w-full border-2 p-2 rounded-[30px] placeholder-gray-500 ${
            isDarkMode
              ? "border-gray-600 bg-gray-700 text-gray-200"
              : "border-gray-500 bg-white text-gray-900"
          }`}
        />
      )}

      {/* ---- Confirm button ---- */}
      <button
        onClick={handleConfirm}
        disabled={loading || usernameExists}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition duration-300 w-full sm:w-52
          ${loading || usernameExists ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
        `}
      >
        {loading
          ? "Loading…"
          : usernameExists
          ? "Confirmed"
          : "Confirm Player ID"}
      </button>

      {/* ---- Show username ---- */}
      {usernameExists && (
        <p className="text-md font-medium text-center">
          Player: <span className="text-green-400 font-bold">{username}</span>
        </p>
      )}
    </div>
  );
};

export default ResellerForm;