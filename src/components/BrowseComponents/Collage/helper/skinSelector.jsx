import { X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { FixedSizeGrid as Grid } from "react-window";

const pointColors = {
  4000: "border-red-900 bg-red-600",
  3000: "border-orange-900 bg-orange-600",
  2000: "border-pink-900 bg-pink-500",
  400: "border-purple-900 bg-purple-500",
  200: "border-blue-900 bg-blue-500",
  100: "border-green-900 bg-green-500",
  40: "border-gray-900 bg-gray-500",
};

export default function SkinSelector({
  setShowSkins,
  allSkins,
  selectedSkins,
  setSelectedSkins,
}) {
  const [pointFilter, setPointFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const toggleItem = (id) => {
    setSelectedSkins((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // --- Filtering + sorting ---
  const sortedSkins = useMemo(
    () => [...allSkins].sort((a, b) => b.points - a.points),
    [allSkins]
  );

  const filteredSkins = useMemo(() => {
    return sortedSkins.filter((skin) => {
      const matchesPoints =
        pointFilter === "all" ? true : skin.points === pointFilter;

      const matchesSearch =
        skin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skin.hero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (skin.family?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      return matchesPoints && matchesSearch;
    });
  }, [sortedSkins, pointFilter, searchQuery]);

  const sortedPoints = useMemo(
    () => [...new Set(allSkins.map((s) => s.points))].sort((a, b) => b - a),
    [allSkins]
  );

  // --- Grid settings ---
  const columnCount = 5;
  const rowCount = Math.ceil(filteredSkins.length / columnCount);
  const rowHeight = 70;

  // adjust columnWidth dynamically
  const columnWidth = containerWidth > 0 ? containerWidth / columnCount : 70;

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // --- Renderer for grid cell ---
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= filteredSkins.length) return null;

    const skin = filteredSkins[index];
    const isSelected = selectedSkins.includes(skin.id);

    return (
      <div style={style} className="flex justify-center items-center">
        <img
          src={skin.imageUrl}
          alt={skin.name || "skin option"}
          onClick={() => toggleItem(skin.id)}
          className={`cursor-pointer rounded-full border-4 transition-all
            ${
              isSelected
                ? "border-green-400 scale-105 shadow-lg"
                : "border-transparent"
            }
            hover:scale-105 hover:shadow-md`}
          style={{ width: 58, height: 58 }}
          title={`${skin.name} (${skin.hero}) - ${skin.points} Points`}
        />
      </div>
    );
  };

  return (
    <div
      className="w-full min-h-[300px] max-w-sm sm:max-w-lg overflow-hidden mb-2 
                 rounded-xl mx-auto text-center 
                 bg-white/5 backdrop-blur-xl border border-white/20 shadow-lg relative"
    >
      <h2 className="flex items-center justify-between font-semibold text-sm text-white mb-3 sticky top-0 bg-blue-500 z-10 p-2 px-4 rounded">
        <span>Choose Skins</span>
        <button onClick={() => setShowSkins(false)} className="text-red-500 font-bold">
          <X />
        </button>
      </h2>

      {/* 🔍 Search Bar */}
      <div className="top-11 z-10 mb-3 rounded-md flex items-center px-2">
        <input
          type="text"
          placeholder="Search by Hero or Skin name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-[6px] rounded-lg bg-white/10 text-white 
                     placeholder-white/90 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Point Filter */}
      <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
        <button
          onClick={() => setPointFilter("all")}
          className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-colors
            ${pointFilter === "all"
              ? "border-white text-white"
              : "border-white text-white/70"}`}
        >
          All
        </button>
        {sortedPoints.map((points) => (
          <button
            key={points}
            onClick={() => setPointFilter(pointFilter === points ? "all" : points)}
            className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-colors
              ${pointColors[points]}`}
          >
            {points}
          </button>
        ))}
      </div>

      {/* Virtualized Skins Grid */}
      <div ref={containerRef} className="mt-4 px-2 pb-2 mx-auto overflow-x-hidden">
        {containerWidth > 0 && (
          <Grid
            columnCount={columnCount}
            columnWidth={columnWidth}
            height={300}
            rowCount={rowCount}
            rowHeight={rowHeight}
            width={containerWidth}
          >
            {Cell}
          </Grid>
        )}
      </div>
    </div>
  );
}
