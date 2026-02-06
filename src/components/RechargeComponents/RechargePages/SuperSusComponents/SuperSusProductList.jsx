// src/components/SuperSusComponents/SuperSusProductList.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useDarkMode } from "../../../../context/DarkModeContext";

// images …
import smallImg from "../../../../assets/images/small-goldstar.png";
import mediumImg from "../../../../assets/images/medium-goldstar.png";
import largeImg from "../../../../assets/images/big-goldstar.png";
import superlargeImg from "../../../../assets/images/large-goldstar.png";
import weeklyCard from "../../../../assets/images/supersus-weekly.webp";
import montlyCard from "../../../../assets/images/supersus-monthly.png";
import superVipCard from "../../../../assets/images/supersus-supervip.png";
import superPass from "../../../../assets/images/supersus-superpass.jpeg";
import superPassPackage from "../../../../assets/images/supersus-superpass-package.jpeg";

import ResellerCheckout from "../../ResellerCheckout";

/* -------------------------------------------------
   PRICE LOGIC – ONE SOURCE OF TRUTH
   ------------------------------------------------- */
const getPriceForRole = (item, role) => {
  if (!item) return 0;

  // admin & reseller → reseller price (fallback to normal price)
  if ((role === "prime" || role === "reseller") && item.resellerRupees != null) {
    return item.resellerRupees;
  }

  // VIP → 97% of normal price
  if (role === "vip") {
    return Math.round(item.rupees * 0.97);
  }

  // default → normal price
  return item.rupees;
};

const SuperSusProductList = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
  role,               // ← receives role from SuperSus
}) => {
  const { isDarkMode } = useDarkMode();
  const [selectedItem, setSelectedItem] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeGroup, setActiveGroup] = useState("goldstar");
  const [loading, setLoading] = useState(true);
  const checkoutRef = useRef(null);

  /* -------------------------------------------------
     FETCH PRODUCTS
     ------------------------------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "supersusProductList"),
      (snap) => {
        const list = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((i) => !i.hide)
          .sort((a, b) => (a.rupees || 0) - (b.rupees || 0));

        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /* -------------------------------------------------
     AUTO‑SCROLL TO CHECKOUT
     ------------------------------------------------- */
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      setTimeout(() => {
        checkoutRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [selectedItem]);

  /* -------------------------------------------------
     IMAGE HELPERS
     ------------------------------------------------- */
  const getImageByDiamonds = (diamonds) => {
    const d = parseInt(diamonds || 0);
    if (d >= 3000) return superlargeImg;
    if (d >= 2000) return largeImg;
    if (d >= 500) return mediumImg;
    return smallImg;
  };

  const getProductImage = (item) => {
    const label = item.label?.trim();

    if (label === "Weekly Card") return weeklyCard;
    if (label === "Monthly Card") return montlyCard;
    if (label === "Super VIP Card") return superVipCard;
    if (label === "SUPER PASS") return superPass;
    if (label === "Super Pass Package") return superPassPackage;

    if (item.group === "goldstar" && item.diamonds) return getImageByDiamonds(item.diamonds);
    return smallImg;
  };

  /* -------------------------------------------------
     FILTER BY GROUP
     ------------------------------------------------- */
  const filteredList = products.filter((i) => !i.outOfStock && i.group === activeGroup);

  const groupNames = { goldstar: "Gold star", others: "Others" };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <p className="text-xl">Loading Super Sus...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto">

        {/* TITLE */}
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
          Super Sus Top‑Up
        </h1>

        {/* GROUP TABS */}
        <div className="flex justify-center gap-3 mb-8">
          {Object.entries(groupNames).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveGroup(key);
                setSelectedItem(null);
              }}
              className={`
                px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 shadow-sm
                ${activeGroup === key
                  ? isDarkMode
                    ? "bg-yellow-600 text-black border-yellow-500 shadow-md"
                    : "bg-yellow-500 text-black border-yellow-600 shadow-md"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredList.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const price = getPriceForRole(item, role);   // ← role‑aware price
            const imageSrc = getProductImage(item);

            return (
              <div
                key={item.id}
                onClick={() => !item.outOfStock && setSelectedItem(item)}
                className={`
                  relative rounded-md card ${isDarkMode ? "bg-gray-800" : "bg-white"}
                  shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer
                  ${isSelected ? "ring-2 ring-purple-500" : "hover:ring-1 hover:ring-gray-300"}
                  ${item.outOfStock ? "opacity-90 cursor-not-allowed" : ""}
                `}
                role="button"
                aria-label={`${item.label} - ₹${price}${item.outOfStock ? " (Out of Stock)" : ""}`}
                tabIndex={item.outOfStock ? -1 : 0}
              >
                {item.outOfStock && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Out of Stock
                  </div>
                )}
                <img src={imageSrc} alt={item.label} className="w-full h-32 object-cover" loading="lazy" />
                <div className="p-4 py-1">
                  <p className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {item.label}
                  </p>
                  <p className={`text-xl font-semibold ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                    ₹{price}
                  </p>
                  {item.falseRupees && (
                    <p className={`text-xs line-through ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      ₹{item.falseRupees}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CHECKOUT – also receives role */}
        <div ref={checkoutRef} className="mt-12 max-w-2xl mx-auto">
          <ResellerCheckout
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            userId={userId}
            setUserId={setUserId}
            zoneId={zoneId}
            setZoneId={setZoneId}
            username={username}
            setUsername={setUsername}
            usernameExists={usernameExists}
            setUsernameExists={setUsernameExists}
            role={role}
          />
        </div>
      </div>
    </div>
  );
};

export default SuperSusProductList;