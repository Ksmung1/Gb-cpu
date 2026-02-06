import React from "react";
import { useDarkMode } from "../../context/DarkModeContext";

const ComingSoon = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen px-4 transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
      }`}
    >
      <h1 className="text-3xl font-bold mb-4">🚀 Coming Soon!</h1>
      <p className="text-lg text-center max-w-md">
        We are working hard to bring you something amazing. We will notify you
        when we are done. Stay tuned!
      </p>
    </div>
  );
};

export default ComingSoon;
