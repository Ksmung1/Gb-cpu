// src/components/Genshins/GenshinForm.jsx
import React, { useState, useEffect } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Card, CardContent } from "../../../ui/card";
import { Loader2 } from "lucide-react";
import { useDarkMode } from "../../../../context/DarkModeContext";
import { useAlert } from "../../../../context/AlertContext";

const GenshinForm = ({
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
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  // Map UI zone → server_code
  const zoneIdMap = {
    asia: "os_asia",
    america: "os_america",
    europe: "os_europe",
    china: "os_tw,hk,mo",
  };

  // Load saved data
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("genshin_prev_data"));
    if (saved) {
      setUserId(saved.uid || "");
      setZoneId(saved.zone || "asia");
      setUsername(saved.username || "");
      setUsernameExists(!!saved.usernameExists);
    }
  }, [setUserId, setZoneId, setUsername, setUsernameExists]);

  // Reset username on input change
  useEffect(() => {
    if (userId || zoneId) {
      setUsernameExists(false);
      setUsername("");
    }
  }, [userId, zoneId, setUsernameExists]);

  // CALL YOUR EXPRESS SERVER
  async function fetchUsername(uid, server) {
    const serverCode = zoneIdMap[server];
    if (!serverCode) throw new Error("Invalid server");

    if (!/^\d{9}$/.test(uid)) {
      throw new Error("UID must be 9 digits");
    }

    const url = new URL("https://api.gamebar.in/get-genshin-username", window.location.origin);
    url.searchParams.set("user_id", uid);
    url.searchParams.set("server_code", serverCode);

    const response = await fetch(url);
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const msg = data.error || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    if (!data.username) {
      throw new Error("Username not found");
    }

    return data.username;
  }

  const handleConfirm = async () => {
    if (!userId.trim()) {
      showAlert("Please enter a UID");
      return;
    }

    setLoading(true);
    try {
      const fetchedUsername = await fetchUsername(userId.trim(), zoneId);

      setUsername(fetchedUsername);
      setUsernameExists(true);

      localStorage.setItem(
        "genshin_prev_data",
        JSON.stringify({
          uid: userId.trim(),
          zone: zoneId,
          username: fetchedUsername,
          usernameExists: true,
        })
      );

      showAlert(`Username found: ${fetchedUsername}`);
    } catch (err) {
      console.error("Error:", err);
      setUsername("Invalid UID or Server");
      setUsernameExists(false);
      showAlert(`${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`px-4 w-full mx-auto rounded-2xl shadow-lg ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Genshin Impact Recharge</h2>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-medium whitespace-nowrap">UID:</label>
            <Input
              type="text"
              placeholder="812345678"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={`flex-1 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "border-gray-300"
              }`}
            />
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-medium whitespace-nowrap">Server:</label>
            <select
              className={`flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              }`}
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
            >
              <option value="asia">Asia</option>
              <option value="america">America</option>
              <option value="europe">Europe</option>
              <option value="china">TW, HK, MO</option>
            </select>
          </div>
        </div>

        <Button
          className={`w-full rounded-2xl ${
            usernameExists ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
          disabled={loading || !userId.trim() || usernameExists}
          onClick={handleConfirm}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" /> Checking...
            </>
          ) : (
            "Confirm UID"
          )}
        </Button>

        {username && (
          <p
            className={`text-center mt-3 font-medium ${
              username.includes("Invalid") ? "text-red-500" : "text-green-500"
            }`}
          >
            {username.includes("Invalid") ? "Error" : "Success"} Username:{" "}
            <span className="text-blue-600 font-bold">{username}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default GenshinForm;