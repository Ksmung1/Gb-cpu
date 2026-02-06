// src/components/GenshinProductList.jsx
import { useEffect, useState, useRef } from "react"; // ← added useRef
import { db } from "../../../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import crystalImg from "../../../../assets/images/genshin-crystal.webp";
import passImg from "../../../../assets/images/blessin-welkin.jpg";

import { useDarkMode } from "../../../../context/DarkModeContext";
import ResellerCheckout from "../../ResellerCheckout";

const GenshinProductList = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
  role,
}) => {
  const { isDarkMode } = useDarkMode();
  const [selectedItem, setSelectedItem] = useState(null);
  const [products, setProducts] = useState([]);

  // ← NEW: Ref to scroll to checkout
  const checkoutRef = useRef(null);

  const getPriceForRole = (item, role) => {
    if (!item) return 0;
    if ((role === "prime" || role === "reseller") && item.resellerRupees != null) {
      return item.resellerRupees;
    }
    if (role === "vip") {
      return Math.round(item.rupees * 0.97);
    }
    return item.rupees;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "genshinProductList"),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((item) => !item.hide)
          .sort((a, b) => (a.rupees || 0) - (b.rupees || 0));

        setProducts(list);
        console.log("Fetched Genshin products:", list.length);
      },
      (error) => {
        console.error("Firestore fetch error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ← NEW: Auto-scroll to checkout when product selected
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedItem]);

  const getImageByLabel = (label) =>
    label.toLowerCase().includes("crystal") ? crystalImg : passImg;

  return (
    <div className="container mx-auto py-4 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400">
        Genshin Impact Products
      </h1>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
        {products.map((item) => {
          const imageSrc = getImageByLabel(item.label);
          const isSelected = selectedItem?.id === item.id;
          const isOutOfStock = item.outOfStock;
          const price = getPriceForRole(item, role);

          return (
            <div
              key={item.id}
              onClick={() => !isOutOfStock && setSelectedItem(item)}
              className={`
                relative rounded-md card ${isDarkMode ? "bg-gray-800" : "bg-white"}
                shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer
                ${isSelected ? "ring-2 ring-purple-500" : "hover:ring-1 hover:ring-gray-300"}
                ${isOutOfStock ? " cursor-not-allowed" : ""}
              `}
              role="button"
              aria-label={`${item.label} - ₹${price}${isOutOfStock ? " (Out of Stock)" : ""}`}
              tabIndex={isOutOfStock ? -1 : 0}
            >
              {isOutOfStock && (
                <div
                  className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full"
                  title="Out of Stock"
                >
                  Out of Stock
                </div>
              )}

              <img
                src={imageSrc}
                alt={item.label}
                className="w-full h-32 object-cover"
                loading="lazy"
              />

              <div className="p-4 py-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-medium">{item.label}</p>
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
                        isDarkMode ? "text-gray-200" : "text-gray-800"
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

      {/* Checkout – now with ref for auto-scroll */}
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

export default GenshinProductList;