import React from "react";
import { useDarkMode } from "../../context/DarkModeContext";

const GameList = ({ products, selectedGame, onBack }) => {
  const {isDarkMode} = useDarkMode()
return (
  <div
    className={`p-6 max-w-3xl mx-auto ${
      isDarkMode ? "text-gray-200" : "text-gray-800"
    }`}
  >
    {/* Back Button */}
    <button
      onClick={onBack}
      className={`mb-4 px-3 py-1 rounded transition ${
        isDarkMode
          ? "bg-gray-700 hover:bg-gray-600 text-white"
          : "bg-gray-300 hover:bg-gray-400 text-black"
      }`}
    >
      ← Back to Games
    </button>

    {/* Title */}
    <h2 className="text-2xl font-semibold mb-4">{selectedGame} Products</h2>

    {/* Product List */}
    <ul
      className={`w-full divide-y rounded-lg overflow-hidden border transition ${
        isDarkMode
          ? "divide-gray-700 border-gray-700"
          : "divide-gray-200 border-gray-300"
      }`}
    >
      {/* Header Row */}
      <li
        className={`grid grid-cols-3 px-4 py-2 text-sm font-semibold transition ${
          isDarkMode ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <span>ID</span>
        <span>SPU</span>
        <span className="text-right">Price</span>
      </li>

      {/* Products */}
      {products.map((prod, idx) => (
        <li
          key={idx}
          className={`grid grid-cols-3 px-4 py-2 text-sm transition cursor-default ${
            isDarkMode
              ? "hover:bg-gray-700 text-gray-200"
              : "hover:bg-gray-50 text-gray-900"
          }`}
        >
          <span>{prod.id}</span>
          <span>{prod.spu}</span>
          <span className="text-right">{prod.price || "-"}</span>
        </li>
      ))}
    </ul>
  </div>
);

};

export default GameList;
