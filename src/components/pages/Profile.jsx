import React from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "../../configs/firebase";
import { useAlert } from "../../context/AlertContext";
import { useState } from "react";
import saveToDatabase from "../../utils/saveToDatabase";
import { 
  FiEye, 
  FiEyeOff, 
  FiHome, 
  FiUser, 
  FiCreditCard, 
  FiGift, 
  FiShoppingCart, 
  FiList, 
  FiMessageSquare, 
  FiDollarSign, 
  FiBookOpen
} from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { useDarkMode } from "../../context/DarkModeContext";
import { FaUserSecret } from "react-icons/fa";
import { Code } from "lucide-react";

const Profile = ({ setProfileVisible }) => {
  const { user, setUser, isAdmin, hasPendingOrders } = useUser();
  const [visible, setVisible] = useState(false); 
  const { showConfirm } = useAlert();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [newPhotoURL, setNewPhotoURL] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useDarkMode();

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      await saveToDatabase(`/users/${user.uid}`, {
        username: newUsername,
        photoURL: newPhotoURL,
      });
      setUser({ ...user, username: newUsername, photoURL: newPhotoURL });
    } catch (error) {
      console.error("Update failed:", error);
      showConfirm("Failed to update profile.");
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleLogout = () => {
    showConfirm("Are you sure you want to Logout?", async () => {
      try {
        await signOut(auth);
        // Clear all localStorage items related to auth
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        // Clear user state
        setUser(null);
        navigate("/login");
      } catch (err) {
        console.error("Logout failed:", err);
        // Even if signOut fails, clear localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setUser(null);
        navigate("/login");
      }
    });
  };

  // define list with icon + color
const menuItems = [
  { label: "Home", path: "/", icon: <FiHome />, color: "text-blue-500" },
  { label: "Profile", path: "/profile", icon: <FiUser />, color: "text-purple-500" },
  { label: "Subscription", path: "/subscription", icon: <FiCreditCard />, color: "text-pink-500" },
  { label: "Games", path: "/games", icon: <FiGift />, color: "text-yellow-500" },
  { label: "Wallet", path: "/wallet", icon: <FiDollarSign />, color: "text-green-500" },   // replaced FiWallet
  { label: "Order History", path: "/orders", icon: <FiShoppingCart />, color: "text-indigo-500" }, // replaced FiShoppingBag
  { label: "Queue", path: "/redeem", icon: <FiList />, color: "text-red-500" },
  { label: "Balance History", path: `/check-history/${user?.uid || "uhei293uwvuewg"}`, icon: <FiBookOpen />, color: "text-teal-500" }, // replaced with FiBookOpen
  // { label: "API", path: `/api`, icon: <Code />, color: "text-blue-500" }, // replaced with FiBookOpen
];


  return (
    <div
      className={`w-[60%] shadow-lg rounded-br-[20px] md:w-[50%] lg:w-[30%] fixed top-0 left-0 md:left-10 lg:left-20 flex z-100 overflow-auto justify-center px-4
      ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}
    `}
    >
      <div className="rounded-2xl w-full mt-2">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center w-full justify-between">
            <div
              onClick={() => setProfileVisible(false)}
              className={`w-10 h-10 overflow-hidden object-cover cursor-pointer
              ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
              title="Close"
            >
              <IoClose size={40} />
            </div>

            <div
              className={`flex flex-row items-center justify-start px-2 cursor-pointer
              ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            >
              <div className="w-full flex flex-col justify-start text-right">
                <h2 className={`font-bold capitalize ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
                  {user?.role}
                </h2>
                <div className="flex items-center space-x-2 justify-end">
                  <h5
                    className={`text-sm cursor-pointer font-bold mr-1 select-none
                    ${isDarkMode ? "text-green-400" : "text-green-700"}`}
                  >
                    {visible ? `₹${(user?.balance || 0).toFixed(0)}` : "Balance"}
                  </h5>
                  <button
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? "Hide balance" : "Show balance"}
                    className={`${isDarkMode ? "text-green-400 hover:text-green-600" : "text-green-700 hover:text-green-900"} focus:outline-none`}
                  >
                    {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className={`mt-5 border-t ${isDarkMode ? "border-gray-700" : "border-gray-300"}`} />

        <div className={`flex items-center justify-between mt-2 ${isDarkMode ? "text-gray-200" : ""}`}>
          <h1>
            Hello, <strong>{user?.username || "Guest"}</strong>
          </h1>
        </div>

        {/* Admin Tools */}
        {isAdmin && (
          <div
            onClick={() => {
              navigate("/admin");
              setProfileVisible(false);
            }}
            className="flex items-center gap-2 cursor-pointer text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition relative"
          >
            <div className="relative">
              <FaUserSecret className="text-xl" />
              {hasPendingOrders && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </div>
            <span className="text-sm font-semibold">Admin Tools</span>
          </div>
        )}

        {/* Menu */}
        <ul className="my-5 flex flex-col gap-1">
          {menuItems.map(({ label, path, icon, color }) => (
            <li
              key={path}
              onClick={() => {
                navigate(path);
                setProfileVisible(false);
              }}
              className={`p-2 font-semibold cursor-pointer rounded flex items-center gap-2
              ${isDarkMode ? "hover:bg-blue-800" : "hover:bg-blue-200"}`}
            >
              <span className={`${color}`}>{icon}</span>
              {label}
            </li>
          ))}

          <li className={`p-2 font-semibold cursor-pointer rounded flex items-center gap-2 ${isDarkMode ? "hover:bg-green-800" : "hover:bg-green-200"}`}>
            <span className="text-green-600"><FiMessageSquare /></span>
            <a href="https://wa.me/916009099196" target="_blank" rel="noopener noreferrer">
              Contact us on WhatsApp
            </a>
          </li>
        </ul>

        {/* Login / Logout */}
        {!user ? (
          <div className="mt-6 space-y-4">
            <button
              onClick={() => navigate("/login")}
              className="w-[100px] mb-5 cursor-pointer py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all"
            >
              Login
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <button
              onClick={handleLogout}
              className="w-[100px] mb-5 cursor-pointer py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`rounded-2xl shadow-xl p-4 w-[90%] max-w-md
            ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
          >
            <h2 className="text-lg font-bold mb-4 text-center">Edit Profile</h2>

            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username"
              className={`w-full mb-3 p-2 rounded-lg border
              ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900"}`}
            />

            {newPhotoURL && (
              <img
                key={newPhotoURL}
                src={newPhotoURL}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover mb-4 mx-auto"
                onError={() => setNewPhotoURL("")}
              />
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-lg
                ${isDarkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-300 hover:bg-gray-400"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
