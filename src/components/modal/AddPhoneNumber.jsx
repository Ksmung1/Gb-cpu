import React, { useState } from "react";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { useDarkMode } from "../../context/DarkModeContext";

// Minimal country codes, you can expand this list
const countryCodes = [
  { code: "+63", name: "Philippines" },   // PH
  { code: "+62", name: "Indonesia" },     // ID
  { code: "+91", name: "India" },         // IN
  { code: "+60", name: "Malaysia" },      // MY
  { code: "+65", name: "Singapore" },     // SG
  { code: "+66", name: "Thailand" },      // TH
  { code: "+84", name: "Vietnam" },       // VN
  { code: "+1", name: "USA" },            // US (expat community)
  { code: "+44", name: "UK" },            // UK
];


const AddPhoneNumber = ({ onClose }) => {
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // default
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  const savePhoneNumber = async () => {
    if (!phone.trim()) {
      setPhoneError("Phone number cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `${countryCode}${phone.replace(/^0+/, "")}`; // remove leading zeros
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, { phone: formattedPhone });

      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setPhoneError(err, "Failed to save phone number. Try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        isDarkMode ? "bg-black/50" : "bg-gray-300/50"
      } backdrop-blur-sm`}
    >
      <div
        className={`p-6 rounded-lg w-[90%] max-w-md ${
          isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
        } shadow-lg`}
      >
        <h2 className="text-md font-semibold mb-4 text-center">
          Add Phone Number
        </h2>

        <div className="flex gap-2 mb-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className={`px-3 py-2 border rounded ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-gray-100"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            {countryCodes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Phone number"
            className={`flex-1 px-3 py-2 border rounded ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button
          onClick={savePhoneNumber}
          disabled={loading || !phone.trim()}
          className={`w-full px-3 py-2 rounded mb-2 ${
            loading || !phone.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : isDarkMode
              ? "bg-green-600 hover:bg-green-700"
              : "bg-green-500 hover:bg-green-600"
          } text-white`}
        >
          {loading ? "Saving..." : "Save Phone Number"}
        </button>

        {phoneError && (
          <p className="text-red-500 text-sm text-center">{phoneError}</p>
        )}

        <button
          onClick={onClose}
          className={`w-full mt-3 px-3 py-2 rounded ${
            isDarkMode
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddPhoneNumber;
