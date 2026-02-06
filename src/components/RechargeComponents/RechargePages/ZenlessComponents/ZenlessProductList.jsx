// src/components/ZenlessProductList.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useDarkMode } from "../../../../context/DarkModeContext";
import ResellerCheckout from "../../ResellerCheckout";

// Images
import monochrome60 from "../../../../assets/images/60-monochrome.webp";
import monochrome300 from "../../../../assets/images/330-monochrome.webp";
import monochrome1090 from "../../../../assets/images/1090-monochrome.webp";
import monochrome2240 from "../../../../assets/images/2240-monochrome.webp";
import monochrome3880 from "../../../../assets/images/3880-monochrome.webp";
import monochrome8080 from "../../../../assets/images/8080-monochrome.webp";
import expressPassImg from "../../../../assets/images/inter-knot-membership.webp";
import defaultImg from "../../../../assets/images/60-monochrome.webp";

/* -------------------------------------------------
   PRICE LOGIC – ONE SOURCE OF TRUTH (shared)
   ------------------------------------------------- */


const ZenlessProductList = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
  role = "customer",               // receives role from parent
}) => {
  const { isDarkMode } = useDarkMode();
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState("monochrome");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const checkoutRef = useRef(null);

  /* -------------------------------------------------
     FETCH PRODUCTS
     ------------------------------------------------- */
  const getPriceForRole = (item, role) => {
  if (!item) return 0;

  // admin & reseller → reseller price (fallback to normal)
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
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "zenlessProductList"),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => !item.hide)
          .sort((a, b) => (a.rupees || 0) - (b.rupees || 0));

        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
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
      checkoutRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedItem]);

  /* -------------------------------------------------
     GROUP FILTERING
     ------------------------------------------------- */
  const groupNames = {
    monochrome: "Monochrome",
    others: "Others",
  };

  const filteredList = products.filter((item) => {
    if (item.outOfStock) return false;
    return item.group === activeGroup;
  });

  /* -------------------------------------------------
     IMAGE MAPPING
     ------------------------------------------------- */
  const shardImageMap = {
    60: monochrome60,
    330: monochrome300,
    1090: monochrome1090,
    2240: monochrome2240,
    3880: monochrome3880,
    8080: monochrome8080,
  };

  const getProductImage = (item) => {
    if (item.group === "others") return expressPassImg;
    if (item.group === "monochrome" && item.diamonds !== undefined) {
      return shardImageMap[item.diamonds] || defaultImg;
    }
    return defaultImg;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading Zenless Zone Zero...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 min-h-screen">
      <h1
        className={`text-2xl font-bold text-center mb-6 ${
          isDarkMode ? "text-blue-400" : "text-blue-600"
        }`}
      >
        Zenless Zone Zero Top‑Up
      </h1>

      {/* Group Tabs */}
      <div className="mb-6 flex justify-center gap-3">
        {Object.entries(groupNames).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveGroup(key);
              setSelectedItem(null);
            }}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
              activeGroup === key
                ? isDarkMode
                  ? "bg-purple-700 text-white border-purple-600 shadow-md"
                  : "bg-purple-600 text-white border-purple-700 shadow-md"
                : isDarkMode
                  ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
        {filteredList.map((item) => {
          const imageSrc = getProductImage(item);
          const isSelected = selectedItem?.id === item.id;
          const isOutOfStock = item.outOfStock;
          const price = getPriceForRole(item, role); // role‑aware price

          return (
            <div
              key={item.id}
              onClick={() => !isOutOfStock && setSelectedItem(item)}
              className={`relative rounded-md card ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer ${
                isSelected
                  ? "ring-2 ring-purple-500"
                  : "hover:ring-1 hover:ring-gray-300"
              } ${isOutOfStock ? "opacity-90 cursor-not-allowed" : ""}`}
              role="button"
              aria-label={`${item.label} - ₹${price} ${
                isOutOfStock ? " (Out of Stock)" : ""
              }`}
              tabIndex={isOutOfStock ? -1 : 0}
            >
              {/* Out of Stock Badge */}
              {isOutOfStock && (
                <div
                  className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full z-10"
                  title="Out of Stock"
                >
                  Out of Stock
                </div>
              )}

              {/* Bonus Badge */}
              {item.bonus && (
                <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
                  +Bonus
                </span>
              )}

              {/* Product Image */}
              <img
                src={imageSrc}
                alt={item.label}
                className="w-full h-32 object-cover"
                loading="lazy"
              />

              {/* Card Content */}
              <div className="p-4 py-1">
                <div className="flex justify-between items-start mb-1">
                  <p
                    className={`text-xs font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </p>
                </div>

                <div className="text-left">
                  <p
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-orange-400" : "text-orange-600"
                    }`}
                  >
                    ₹{price}
                  </p>
                  {item.falseRupees && (
                    <p
                      className={`text-xs line-through ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      ₹{item.falseRupees}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout – also receives role */}
      <div ref={checkoutRef} className="mt-12">
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
  );
};

export default ZenlessProductList;