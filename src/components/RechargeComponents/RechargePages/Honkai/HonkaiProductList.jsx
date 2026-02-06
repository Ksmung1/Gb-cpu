// src/components/HonkaiProductList.jsx
import { useEffect, useState, useRef } from "react"; // ← added useRef
import { db } from "../../../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import oneiric60 from "../../../../assets/images/60-oneiric.webp";
import oneiric300 from "../../../../assets/images/330-oneiric.webp";
import oneiric1090 from "../../../../assets/images/1090-oneiric.webp";
import oneiric2240 from "../../../../assets/images/2240-oneiric.webp";
import oneiric3880 from "../../../../assets/images/3880-oneiric.webp";
import oneiric8080 from "../../../../assets/images/8080-oneiric.webp";
import expressPassImg from "../../../../assets/images/express-supply-pass.webp";
import defaultImg from "../../../../assets/images/oneiric-shard.png";

import { useDarkMode } from "../../../../context/DarkModeContext";
import ResellerCheckout from "../../ResellerCheckout";

export const getPriceForRole = (item, role) => {
  if (!item) return 0;
  if ((role === "prime" || role === "reseller") && item.resellerRupees != null) {
    return item.resellerRupees;
  }
  if (role === "vip") {
    return Math.round(item.rupees * 0.97);
  }
  return item.rupees;
};

const HonkaiProductList = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
  role = "customer",
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState("oneiric");
  const [products, setProducts] = useState([]);
  const { isDarkMode } = useDarkMode();

  // ← NEW: Ref for auto-scroll to checkout
  const checkoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "honkaiProductList"),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((item) => !item.hide)
          .sort((a, b) => (a.rupees || 0) - (b.rupees || 0));

        setProducts(list);
        console.log("Fetched Honkai products:", list.length);
      },
      (error) => {
        console.error("Firestore fetch error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ← NEW: Auto-scroll when a product is selected
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedItem]);

  const groupNames = {
    oneiric: "Oneiric",
    express: "Passes",
  };

  const filteredList = products.filter((item) => {
    if (activeGroup === "specials") {
      return item.group !== "dd" && item.group !== "s";
    }
    return item.group === activeGroup;
  });

  const shardImageMap = {
    60: oneiric60,
    330: oneiric300,
    1090: oneiric1090,
    2240: oneiric2240,
    3880: oneiric3880,
    8080: oneiric8080,
  };

  const getProductImage = (item) => {
    if (item.type === "pass") return expressPassImg;
    if (item.group === "oneiric" && item.diamonds !== undefined) {
      return shardImageMap[item.diamonds] || defaultImg;
    }
    return defaultImg;
  };

  return (
    <div className="container mx-auto py-4 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6 text-purple-600 dark:text-purple-400">
        Honkai: Star Rail Products
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

      {/* Warning for Shards */}
      {activeGroup === "dd" && (
        <div
          className={`${
            isDarkMode
              ? "bg-yellow-900/50 border-yellow-700 text-yellow-300"
              : "bg-yellow-100 border-yellow-500 text-yellow-800"
          } border-l-4 p-3 text-sm rounded-md shadow mb-6`}
        >
          <strong>Note:</strong> Oneiric Shard amount may vary by region or first-time purchase bonus.
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
        {filteredList.map((item) => {
          const imageSrc = getProductImage(item);
          const isSelected = selectedItem?.id === item.id;
          const isOutOfStock = item.outOfStock;
          const price = getPriceForRole(item, role);

          return (
            <div
              key={item.id}
              onClick={() => !isOutOfStock && setSelectedItem(item)}
              className={`relative card rounded-md ${
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
              {isOutOfStock && (
                <div
                  className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full z-10"
                  title="Out of Stock"
                >
                  Out of Stock
                </div>
              )}

              {item.bonus && (
                <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
                  +Bonus
                </span>
              )}

              <img
                src={imageSrc}
                alt={item.label}
                className="w-full h-32 object-cover"
                loading="lazy"
              />

              <div className="p-4 py-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
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

      {/* Checkout Section – now with ref for smooth scroll */}
      <div ref={checkoutRef} className="mt-6">
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

export default HonkaiProductList;