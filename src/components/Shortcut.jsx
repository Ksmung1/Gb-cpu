import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CiShop } from "react-icons/ci";
import { BsCheckCircle, BsSearch } from "react-icons/bs";
import { GiGamepad } from "react-icons/gi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { useDarkMode } from "../context/DarkModeContext";
import { useUser } from "../context/UserContext";
import { MdOutlineMessage } from "react-icons/md";
import { CgGames } from "react-icons/cg";
const shortcutItems = [
  {
    label: "Market",
    routes: ["/", "/recharge"],
    icon: <CiShop className="font-bold text-red-500" size={25} />,
  },
  {
    label: "Browse",
    routes: ["/browse"],
    icon: <BsSearch className="text-blue-500" size={24} />,
  },
  {
    label: "Status Checker",
    routes: ["/id-checker"],
    icon: <BsCheckCircle className="text-green-500" size={24} />,
  },
  {
    label: "Games",
    routes: ["/games"],
    icon: <CgGames className="text-purple-500" size={24} />,
  },
  {
    label: "Message",
    routes: ["/message"],
    icon: <MdOutlineMessage className="text-yellow-500" size={24} />,
  },
];

function Shortcut() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const { messageExists } = useUser();

  const handleClick = (route) => {
    if (location.pathname !== route) {
      navigate(route);
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 flex justify-around items-center py-3 border-t z-10 h-14 sm:px-40 ${
        isDarkMode
          ? "bg-gray-900 border-gray-700 text-gray-300"
          : "bg-white border-gray-300 text-gray-700"
      }`}
    >
      {shortcutItems.map(({ label, routes, icon }) => {
        const isActive = routes.some((r) => location.pathname === r);
        const showDot = label === "Message" && messageExists;

        return (
          <div
            key={label}
            onClick={() => handleClick(routes[0])}
            className={`relative flex flex-col items-center cursor-pointer select-none text-xs transition-colors duration-200 rounded-md px-3 py-1 ${
              isActive
                ? isDarkMode
                  ? "bg-blue-600 text-white font-semibold shadow-lg"
                  : "bg-blue-100 text-blue-700 font-semibold shadow-md"
                : isDarkMode
                ? "text-gray-300 hover:text-white"
                : "text-gray-700 hover:text-blue-600"
            }`}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") handleClick(routes[0]);
            }}
            aria-label={label}
          >
            <div className="relative">
              {icon}
              {showDot && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-gray-900" />
              )}
            </div>
            <p className="mt-1 text-[10px]">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default Shortcut;
