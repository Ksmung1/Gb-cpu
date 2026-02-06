import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import 'react-phone-input-2/lib/style.css';
import { useDarkMode } from "../../../../context/DarkModeContext";

const ContactInput = ({ contactValue, setContactValue, userPhone, userEmail }) => {
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (!contactValue) {
      if (contactMethod === "whatsapp" && userPhone) {
        setContactValue(userPhone);
      } else if (contactMethod === "gmail" && userEmail) {
        setContactValue(userEmail);
      }
    }
  }, [contactMethod, contactValue, setContactValue, userPhone, userEmail]);

  return (
    <div
      className={`p-4 border-2 rounded-md ${
        isDarkMode
          ? "border-gray-700 bg-gray-800 text-gray-200"
          : "border-gray-200 bg-white/90 text-gray-900"
      }`}
    >
      <h1 className={`text-lg font-bold mb-2 ${isDarkMode ? "text-gray-100" : ""}`}>
        Preferred Contact Method
      </h1>

      <select
        className={`w-full p-2 rounded mb-4 border ${
          isDarkMode ? "border-gray-600 bg-gray-700 text-gray-200" : "border-gray-300 bg-white text-gray-900"
        } focus:outline-none focus:ring-2 focus:ring-indigo-400`}
        value={contactMethod}
        onChange={(e) => {
          setContactMethod(e.target.value);
          setContactValue(""); // reset input value on method change
        }}
      >
        <option value="whatsapp">WhatsApp</option>
        <option value="telegram">Telegram</option>
        <option value="gmail">Gmail</option>
      </select>

      {contactMethod === "whatsapp" && (
        <div>
          <PhoneInput
            country={"in"}
            value={contactValue}
            onChange={setContactValue}
            inputStyle={{
              width: "100%",
              backgroundColor: isDarkMode ? "#374151" : "#fff",
              color: isDarkMode ? "#d1d5db" : "#000",
              borderRadius: "0.375rem",
              borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
              padding: "0.5rem",
              paddingLeft: '3rem',
              borderWidth: "1.5px",
            }}
            inputProps={{
              name: "whatsapp",
              required: true,
              autoComplete: "tel",
            }}
          />
          <p className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Enter your WhatsApp number so we can reach out if needed.
          </p>
        </div>
      )}

      {contactMethod === "telegram" && (
        <div>
          <input
            type="text"
            placeholder="@yourTelegramHandle"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            className={`w-full rounded p-2 border focus:ring-2 focus:ring-indigo-400 focus:outline-none ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
          <p className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Provide your Telegram handle (e.g., @username).
          </p>
        </div>
      )}

      {contactMethod === "gmail" && (
        <div>
          <input
            type="email"
            placeholder="yourname@gmail.com"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            className={`w-full rounded p-2 border focus:ring-2 focus:ring-indigo-400 focus:outline-none ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
          <p className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Enter your Gmail address where we can contact you.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactInput;
