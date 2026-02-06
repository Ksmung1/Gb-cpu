import { useEffect, useState, useRef } from "react"; // ← added useRef
import { db } from "../../../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import smallPackImg from "../../../../assets/images/small-packs.png";
import mediumPackImg from "../../../../assets/images/medium-packs.png";
import largePackImg from "../../../../assets/images/large-packs.png";
import defaultImg from "../../../../assets/images/d.avif";

import { useDarkMode } from "../../../../context/DarkModeContext";
import RechargeCheckout from "../../RechargeCheckout";
import { useUser } from "../../../../context/UserContext";

const imgMap = {
  small: smallPackImg,
  medium: mediumPackImg,
  large: largePackImg,
};

const getDiamondImage = (item) => {
  if (item.img && imgMap[item.img]) return imgMap[item.img];

  const d = Number(item.diamonds || 0);

  if (d >= 400) return largePackImg;
  if (d >= 200) return mediumPackImg;
  if (d > 0) return smallPackImg;

  return defaultImg;
};

const filters = [
  { name: "Small packs", key: "small", img: smallPackImg },
  { name: "Medium packs", key: "medium", img: mediumPackImg },
  { name: "Large packs", key: "large", img: largePackImg },
];

const MGlobalProductList = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const { user } = useUser();
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Small packs");
  const [products, setProducts] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const { isDarkMode } = useDarkMode();

  // ← NEW: Ref for smooth scroll to checkout
  const checkoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "mGlobalProductList"),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => a?.price - b?.price)
          .filter((a) => a?.hide !== true);
        setProducts(list);
      },
      (error) => {
        console.error("Firestore fetch error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ← NEW: Auto-scroll when product selected
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedItem]);

  const filteredSortedList = products.filter((item) => {
    const d = Number(item.diamonds) || 0;
    return item.packSize === activeFilter && d <= 100;
  });

  const diamondMap = new Map();
  filteredSortedList.forEach((item) => {
    const d = Number(item.diamonds) || 0;
    const existing = diamondMap.get(d);
    if (!existing || Number(item.price) < Number(existing.price)) {
      diamondMap.set(d, item);
    }
  });
  const uniqueByDiamonds = Array.from(diamondMap.values()).sort(
    (a, b) => (Number(a.diamonds) || 0) - (Number(b.diamonds) || 0)
  );

  const displayedList = showAll ? uniqueByDiamonds : uniqueByDiamonds.slice(0, 30);

  return (
    <div
      className={`space-y-4 w-full flex flex-col sm:grid sm:grid-cols-2 gap-10 ${
        isDarkMode ? "text-gray-300" : "text-gray-800"
      }`}
    >
      <div className="flex flex-col gap-5">
        {/* Filter Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {filters.map(({ name, img }) => (
            <button
              key={name}
              onClick={() => {
                setActiveFilter(name);
                setSelectedItem(null);
                setShowAll(false);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-semibold border transition-all ${
                activeFilter === name
                  ? "bg-yellow-300/90 text-black border-gray-100"
                  : isDarkMode
                  ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              <img src={img || defaultImg} alt={name} className="h-10 rounded-sm object-cover" />
              {name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-3">
          {displayedList.length > 0 ? (
            displayedList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`flex relative overflow-hidden flex-row cursor-pointer justify-between items-center px-2 py-1 rounded-md border shadow-md transition-all duration-200 hover:shadow-lg ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                } ${
                  selectedItem?.id === item.id
                    ? isDarkMode
                      ? "ring-2 ring-offset-2 ring-blue-500 ring-offset-gray-900"
                      : "ring-2 ring-offset-2 ring-blue-400"
                    : ""
                }`}
              >
                {item.outOfStock && (
                  <div className="absolute top-5 py-1 -left-1 w-[100px] bg-red-600 text-white text-[6px] text-center font-bold transform -rotate-45 z-10 shadow-lg pointer-events-none">
                    OUT OF STOCK
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex w-12 h-12 items-center gap-2">
                    <img
                      className="object-contain w-full h-full"
                      src={getDiamondImage(item)}
                      alt={item.label}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className={`${isDarkMode ? "text-gray-200" : "text-gray-800"} text-[12px] font-semibold`}>
                      {item?.diamonds || ""} {item.type}
                    </p>
                    <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"} text-xs italic`}>
                      {item.label}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <p className="font-semibold text-[13px] text-green-500">
                    ₹
                    {(() => {
                      let parsedAmount;

                      if (user?.role === "reseller" || user?.role === "prime") {
                        parsedAmount = item.resellerRupees;
                      } else if (user?.role === "vip") {
                        parsedAmount = Math.round(item.rupees * 0.97);
                      } else {
                        parsedAmount = item.rupees;
                      }

                      return parsedAmount;
                    })()}
                  </p>
                  <p className="text-[10px] text-red-500 line-through">
                    {item.falseRupees}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className={`${isDarkMode ? "text-gray-500" : "text-gray-500"} text-sm col-span-2 text-center mt-4`}>
              No items available at the moment.
            </div>
          )}
        </div>

        {/* Show More Button */}
        {uniqueByDiamonds.length > 30 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className={`mt-4 px-4 py-2 rounded transition ${
              isDarkMode
                ? "bg-blue-700 hover:bg-blue-800 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            Show More
          </button>
        )}
      </div>

      {/* Checkout – now with ref for smooth scroll */}
      <div ref={checkoutRef}>
        <RechargeCheckout
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
        />
      </div>
    </div>
  );
};

export default MGlobalProductList;