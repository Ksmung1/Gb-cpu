import { X } from "lucide-react";
import { useState } from "react";

export default function AssetsSelector({setShowAssets, allAssets, selectedAssets = [], setSelectedAssets }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const maxSelection = 5;

  const assetTypes = [...new Set(allAssets.map((a) => a.assetType))];

  const toggleAsset = (id) => {
    setSelectedAssets((prev) => {
      if (!prev) prev = []; // ensure setShowAssetsprev is always an array
      if (prev.includes(id)) {
        return prev.filter((aid) => aid !== id);
      } else if (prev.length < maxSelection) {
        return [...prev, id];
      } else {
        return prev; // ignore if max reached
      }
    });
  };

  const filteredAssets =
    typeFilter === "all"
      ? allAssets
      : allAssets.filter((a) => a.assetType === typeFilter);

  return (
   <div
  className="w-full min-h-[300px] max-w-sm sm:max-w-lg overflow-y-auto max-h-[300px] mb-2 
             rounded-xl mx-auto text-center 
             bg-white/5 backdrop-blur-md border border-white/20 shadow-lg relative"
>

   <h2 className="flex items-center  justify-between font-semibold text-sm text-white mb-3 sticky top-0 bg-blue-500 z-10 p-2 px-4 rounded">
  <span>Choose Assets</span>
  <button
    onClick={() => setShowAssets(false)}
    className="text-red-500 font-bold"
  >
    <X/>
 </button>
</h2>


      {/* Asset Type Filters */}
      <div className="flex flex-wrap justify-start px-2 gap-2 mb-3">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${typeFilter === "all"
              ? "border-white text-white"
              : "border-white text-white/70"}`}
        >
          All
        </button>
        {assetTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${typeFilter === t
                ? "bg-green-600 text-white"
                : "bg-white/10 text-white/70"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Assets List */}
      <div className="flex flex-wrap gap-1 mt-2 justify-start px-2">
        {filteredAssets.map((asset) => {
          const isSelected = selectedAssets.includes(asset.id);
          return (
            <img
              key={asset.id}
              src={asset.imageUrl}
              alt={asset.name || "asset"}
              onClick={() => toggleAsset(asset.id)}
              className={`cursor-pointer rounded-full border-4 transition-all
                ${isSelected ? "border-green-400 scale-105 shadow-lg" : "border-transparent"}
                hover:scale-105 hover:shadow-md`}
              style={{ width: 60, height: 60 }}
              title={`${asset.name} - ${asset.assetType}`}
            />
          );
        })}
      </div>

      <p className="mt-2 text-xs text-white/70">
        Selected {selectedAssets.length} / {maxSelection}
      </p>
    </div>
  );
}
