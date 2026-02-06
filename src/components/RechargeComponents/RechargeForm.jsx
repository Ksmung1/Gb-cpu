import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUserID } from "../../context/UserIDContext";
import { checkUsername } from "../../utils/checkUsername";
import { FaQuestionCircle } from "react-icons/fa";

const RechargeForm = ({userId, setUserId, zoneId, setZoneId, username, setUsername,usernameExists, setUsernameExists}) => {

  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const [product, setProduct] = useState("");
  const [productId, setProductId] = useState("");
  const [hasPrevData, setHasPrevData] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ml_prev_data");
    if (stored) setHasPrevData(true);
  }, []);

  useEffect(() => {
    if (location.pathname === "/recharge") {
      setProduct("mobilelegends");
      setProductId("13");
    } else if (location.pathname === "/mcgg-recharge") {
      setProduct("magicchessgogo");
      setProductId("23837");
    } else if (location.pathname === "/mlbb-skin-gift") {
      setProduct("mobilelegends");
      setProductId("13");
    } else if (location.pathname === "/genshin") {
      setProduct("genshinimpact");
      setProductId("13");
    } else {
      setProduct("mobilelegends");
      setProductId("13");
    }
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      setUsernameExists(false);
      setUserId("");
      setZoneId("");
    };
  }, []);

  const resetUsernameData = () => {
    setUsername("");
    setUsernameExists(false);
    setShowModal(false);
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData("text");
    const parenMatch = pastedText.match(/^(\d+)\s*\((\d+)\)$/);
    if (parenMatch) {
      e.preventDefault();
      setUserId(parenMatch[1]);
      setZoneId(parenMatch[2]);
      resetUsernameData();
      return;
    }

    const parts = pastedText.split(/[\s-]+/);
    if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      e.preventDefault();
      setUserId(parts[0]);
      setZoneId(parts[1]);
      resetUsernameData();
      return;
    }

    const digitsOnly = pastedText.replace(/\D/g, "");
    if (digitsOnly.length > 5) {
      e.preventDefault();
      setUserId(digitsOnly);
      setZoneId("");
      resetUsernameData();
    }
  };

  const handleNumberInput = (e, setter) => {
    const value = e.target.value.replace(/\D/g, "");
    setter(value);
    resetUsernameData(); // 👈 Reset when user types or edits
  };

  const handleClick = async () => {
    if (!userId || !zoneId) {
      setModalMessage("❌ Missing User ID or Server ID.");
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      setUsernameExists(true);
      const result = await checkUsername({
        userid: userId,
        zoneid: zoneId,
        product,
        productid: productId,
      });

      if (result.success) {
        setUsername(result.username);
        setShowModal(false);
      } else {
        setModalMessage(result.message || "❌ Failed to fetch username. Please check IDs.");
        setShowModal(true);
        setUsername("");
      }
    } catch (error) {
      setModalMessage("❌ Something went wrong.");
      setUsernameExists(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-6 shadow-md border-1 border-gray-50 bg-white/70 rounded-xl items-center w-full sm:w-[100%]">
      <div className="flex items-center gap-1 relative group">
        <p>Order Information</p>
        <FaQuestionCircle className="text-gray-700 cursor-pointer" />
        <div className="absolute bottom-full left-1/3 -translate-x-1/3 bg-white text-black text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          Please paste ID and Server
        </div>
      </div>

      <input
        value={userId}
        onChange={(e) => handleNumberInput(e, setUserId)}
        onPaste={handlePaste}
        type="text"
        placeholder="User ID"
        className="text-center w-full border-2 border-gray-500 p-2 rounded-[30px]"
      />
      <input
        value={zoneId}
        onChange={(e) => handleNumberInput(e, setZoneId)}
        type="text"
        placeholder="Server ID"
        className="text-center w-full border-2 border-gray-500 p-2 rounded-[30px]"
      />

      <button
        onClick={handleClick}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full ${
          loading ? "cursor-not-allowed" : "cursor-pointer"
        } shadow-md transition duration-300 w-50`}
        disabled={loading}
      >
        {loading ? "Loading..." : username ? `✅ ${username}` : "Check Username"}
      </button>

      {showModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full text-center">
          {modalMessage}
        </div>
      )}
    </div>
  );
};

export default RechargeForm;
