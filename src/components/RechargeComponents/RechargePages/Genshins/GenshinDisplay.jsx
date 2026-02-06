import { useState } from "react";
import { useLocation } from "react-router-dom";
import genLogo from "../../../../assets/images/genshin.jpg";
import { useDarkMode } from "../../../../context/DarkModeContext";
import { CloudLightning, Headphones, Shield } from "lucide-react";

const gameInfo = {
  "/genshin-impact": {
    name: "Genshin Impact",
    logo: genLogo,
    image: genLogo,
    guide: [
      "Log in to your Gamebar account.",
      "Navigate to the Genshin Impact section.",
      "Select your desired top-up amount.",
      "Complete the payment using a secure method.",
      "Receive Genesis Crystals instantly!",
    ],
  },
};

const GenshinDisplay = () => {
  const [showGuide, setShowGuide] = useState(false);
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const currentGame = gameInfo[location.pathname] || gameInfo["/recharge"];

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className={`relative z-10 p-4 md:p-6 flex flex-col gap-3 h-full ${
          isDarkMode ? "text-gray-200" : "text-black"
        }`}
      >
        {/* Header */}
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-md overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src={currentGame.logo}
              alt={`${currentGame.name} logo`}
            />
          </div>
          <div className="flex flex-col">
            <h2
              className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              {currentGame.name}
            </h2>

            {/* Features */}
            <div className="flex items-center gap-6 mt-1 text-sm font-medium">
              <span className="flex items-center gap-1">
                <CloudLightning className="w-4 h-4 text-yellow-400" /> Fast
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-500" /> Safe
              </span>
              <span className="flex items-center gap-1">
                <Headphones className="w-4 h-4 text-blue-500" /> 24/7
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal (kept if you still want tutorial) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div
            className={`relative w-full max-w-md rounded-xl border shadow-2xl ${
              isDarkMode
                ? "bg-gray-900 border-green-400 text-gray-300"
                : "bg-white border-green-400 text-gray-900"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-2 rounded-t-xl text-white ${
                isDarkMode ? "bg-green-700" : "bg-green-600"
              }`}
            >
              <span className="text-lg font-bold">🛍️ Gamebar</span>
              <button
                className={`text-xl font-bold ${
                  isDarkMode ? "hover:text-red-400" : "hover:text-red-600"
                } cursor-pointer`}
                onClick={() => setShowGuide(false)}
                aria-label="Close tutorial"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <p className="text-sm font-bold mb-2">Quick Tutorial</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {currentGame.guide.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenshinDisplay;
