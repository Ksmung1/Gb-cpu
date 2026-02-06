import React, { useState } from "react";
import games from "../../assets/files/games";
import GameList from "./GameList";
import MobileLegendsAdmin from "./AdminProductPages/MobileLegendAdmin"; 
import MagicChessAdmin from "./AdminProductPages/MagicChessAdmin";
import CharismaAdmin from "./AdminProductPages/CharismaAdmin";
import HonkaiAdmin from "./AdminProductPages/HonkaiAdmin";
import SkinGiftingAdmin from "./AdminProductPages/SkinGiftingAdmin";
import MGlobalAdmin from "./AdminProductPages/MGlobalAdmin";
import { useDarkMode } from "../../context/DarkModeContext";
import InternationalAdmin from "./AdminProductPages/InternationalAdmin";
import GenshinAdmin from "./AdminProductPages/GenshinAdmin";
import ZenlessAdmin from "./AdminProductPages/ZenlessAdmin";
import PubgAdmin from "./AdminProductPages/PubgAdmin";
import SupersusAdmin from "./AdminProductPages/SupersusAdmin";
import MLCustomAdmin from "./AdminProductPages/MLCustomAdmin";
import WutheringAdmin from "./AdminProductPages/WutheringAdmin";
import BloodStrikeAdmin from "./AdminProductPages/BloodStrikeAdmin";
import HonorKingsAdmin from "./AdminProductPages/HonorKingsAdmin";
import WhereWindsMeetAdmin from "./AdminProductPages/WhereWindsMeet";

const AdminProducts = () => {
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null); 
  const [products, setProducts] = useState([]);
  const [viewingGame, setViewingGame] = useState(null); 
  const {isDarkMode} = useDarkMode()
  const handleGameClick = async (game) => {
    setSelectedGame(game.name);
    setProducts([]);
    setLoading(true);

    if (game.onclick) {
      try {
        const result = await game.onclick();
        if (result) setProducts(result);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setProducts([]);
    }
  };

  const handleBack = () => {
    setSelectedGame(null);
    setProducts([]);
  };

  const handleBackFromView = () => {
    setViewingGame(null);
  };

  const handleView = (name) => {
    const routeName = name.toLowerCase().replace(/\s+/g, "-");
    console.log(routeName)
    setViewingGame(routeName);
  };

  if (viewingGame) {
    return (
      <div className="py-6 px-0">
        <button onClick={handleBackFromView} className={`mb-4 ${isDarkMode ? "bg-white text-black" : "bg-black text-white "} px-3 py-1 rounded`}>
          ← Back
        </button>
        {viewingGame === "mobile-legends" && <MobileLegendsAdmin />}
        {viewingGame === "magic-chess:-go-go" && <MagicChessAdmin/>}
        {viewingGame === "charisma-via-gifting" && <CharismaAdmin/>}
        {viewingGame === "honkai-star-rail" && <HonkaiAdmin/>}
        {viewingGame === "skin-gifting" && <SkinGiftingAdmin/>}
        {viewingGame === "mlbb-(small-packs)" && <MGlobalAdmin/>}
        {viewingGame === "mlbb-international" && <InternationalAdmin/>}
        {viewingGame === "genshin-impact" && <GenshinAdmin/>}
        {viewingGame === "zenless-zone-zero" && <ZenlessAdmin/>}
        {viewingGame === "pubg-global" && <PubgAdmin/>}
        {viewingGame === "super-sus" && <SupersusAdmin/>}
        {viewingGame === "mlbb-custom-packs" && <MLCustomAdmin/>}
        {viewingGame === "wuthering-waves" && <WutheringAdmin/>}
        {viewingGame === "blood-strike" && <BloodStrikeAdmin/>}
        {viewingGame === "honor-of-kings" && <HonorKingsAdmin/>}
        {viewingGame === "where-winds-meet" && <WhereWindsMeetAdmin/>}
      </div>
    );
  }

  if (selectedGame && products.length > 0)
    return (
      <GameList
        products={products}
        selectedGame={selectedGame}
        onBack={handleBack}
      />
    );

return (
  <div className={`p-6 max-w-5xl mx-auto ${isDarkMode ? "text-white" : "text-gray-900"}`}>
    <h2 className="text-2xl font-bold mb-4">Admin Game Management</h2>

    <table
      className={`w-full table-auto border-collapse text-sm ${
        isDarkMode ? "border border-gray-600" : "border border-gray-300"
      }`}
    >
      <thead>
        <tr className={isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200"}>
          <th className={`px-4 py-2 ${isDarkMode ? "border border-gray-600" : "border border-gray-300"}`}>Image</th>
          <th className={`px-4 py-2 ${isDarkMode ? "border border-gray-600" : "border border-gray-300"}`}>Game Name</th>
          <th className={`px-4 py-2 ${isDarkMode ? "border border-gray-600" : "border border-gray-300"}`}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {games.map(({ id, name, img, route, onclick }) => (
          <tr key={id} className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
            <td className={`px-4 py-2 ${isDarkMode ? "border border-gray-600" : "border border-gray-300"}`}>
              <img
                onClick={() => handleGameClick({ id, name, img, route, onclick })}
                src={img}
                alt={name}
                className="w-14 h-14 object-cover rounded cursor-pointer"
              />
            </td>
            <td className={`px-4 py-2 ${isDarkMode ? "border border-gray-600" : "border border-gray-300"}`}>{name}</td>
            <td className={`px-4 py-2 space-x-2 ${isDarkMode ? "border border-gray-600" : "border border-gray-300"}`}>
              <button
                onClick={() => handleView(name)}
                className={`px-2 py-1 rounded transition ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

};

export default AdminProducts;
