import React, { useState } from "react";

const CollageSetting = ({
  cols,
  setCols,
  bgColor,
  setBgColor,
  border,
  setBorder,
  orderBy,
  setOrderBy,
  group,
  setGroup,
  setSetting,
  accountSection,
  setAccountSection,
  style,       // current style of collage
  filter,      // current filter
  setFilter    // setter for filter
}) => {
  const [activeSlider, setActiveSlider] = useState(null); // Track which slider is being dragged

  return (
    <div
      className={`relative mb-6 p-4 max-w-sm rounded-2xl border shadow-lg transition-all duration-300 ${
        activeSlider ? "bg-transparent border-transparent" : "bg-white/5 backdrop-blur-md border-white/20"
      }`}
    >
      {/* Close Button (X) */}
      <button
        onClick={() => setSetting(false)}
        className={`absolute top-2 right-2 text-white hover:text-red-400 transition ${
          activeSlider ? "opacity-0" : "opacity-100"
        }`}
      >
        ❌
      </button>

      <div className="space-y-2">
        {/* Header */}
        <h2
          className={`font-bold text-xl text-left w-full text-white mb-2 transition-opacity duration-300 ${
            activeSlider ? "opacity-0" : "opacity-100"
          }`}
        >
          ⚙ Collage Settings
        </h2>

        {/* Account Section Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">Account Section</span>
          <button
            onClick={() => setAccountSection((prev) => !prev)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
              accountSection ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                accountSection ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Columns */}
        <div
          className={`flex flex-col gap-1 relative transition-opacity duration-300 ${
            activeSlider && activeSlider !== "cols" ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-white font-medium">Columns: {cols}</span>
          <input
            type="range"
            min="5"
            max="15"
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            onMouseDown={() => setActiveSlider("cols")}
            onMouseUp={() => setActiveSlider(null)}
            onTouchStart={() => setActiveSlider("cols")}
            onTouchEnd={() => setActiveSlider(null)}
            className="w-full cursor-pointer accent-blue-500 z-10"
          />
        </div>

        {/* Border / Gap */}
        <div
          className={`flex flex-col gap-1 relative transition-opacity duration-300 ${
            activeSlider && activeSlider !== "border" ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-white font-medium">Border / Gap: {border}px</span>
          <input
            type="range"
            min="0"
            max="5"
            value={border}
            onChange={(e) => setBorder(Number(e.target.value))}
            onMouseDown={() => setActiveSlider("border")}
            onMouseUp={() => setActiveSlider(null)}
            onTouchStart={() => setActiveSlider("border")}
            onTouchEnd={() => setActiveSlider(null)}
            className="w-full cursor-pointer accent-blue-500 z-10"
          />
        </div>

        {/* Background Color */}
        <div
          className={`flex justify-between items-center transition-opacity duration-300 ${
            activeSlider ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-white font-medium">Background:</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-10 h-8 border border-white/30 rounded cursor-pointer"
          />
        </div>

        {/* Order By */}
        <div
          className={`flex justify-between items-center transition-opacity duration-300 ${
            activeSlider ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-white font-medium">Sort by:</span>
          <div className="relative">
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="appearance-none bg-transparent text-white font-semibold p-2 pr-8 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option className="bg-gray-800 text-white" value="auto">Auto (Tap order)</option>
              <option className="bg-gray-800 text-white" value="points">Points (High → Low)</option>
              <option className="bg-gray-800 text-white" value="low-points">Points (Low → High)</option>
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Group toggle */}
        <div
          className={`flex items-center justify-between rounded-lg text-white shadow p-3 bg-slate-800 transition-opacity duration-300 ${
            activeSlider ? "opacity-0" : "opacity-100"
          }`}
        >
          <label htmlFor="group" className="text-md font-semibold">
            Group similar skins
          </label>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{group ? "ON ✅" : "OFF ❌"}</span>
            <button
              onClick={() => setGroup(!group)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                group ? "bg-blue-600" : "bg-gray-600"
              }`}
              role="switch"
              aria-checked={group}
              aria-labelledby="group"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                  group ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-white font-medium">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-black text-black text-white font-semibold p-2 pr-8 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="none">None</option>
            <option value="grayscale">Grayscale</option>
            <option value="vivid">Vivid</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CollageSetting;
