import { useEffect, useState, useRef } from "react";
import { useDarkMode } from "../../../../context/DarkModeContext";
import RechargeCheckout from "../../RechargeCheckout";
import { db } from "../../../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";

// Images
import smallImg from "../../../../assets/images/any-diamond.jpg";
import avgImg from "../../../../assets/images/d1.jpg";
import mediumImg from "../../../../assets/images/d2.jpg";
import largeImg from "../../../../assets/images/d3.jpg";
import xlargeImg from "../../../../assets/images/d5.jpg";
import superlargeImg from "../../../../assets/images/d4.jpg";

const MLBBCustomProductList = ({
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
  const { isDarkMode } = useDarkMode();
  const [products, setProducts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkoutRef = useRef(null);

  /* ---------------- Fetch Products ---------------- */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "mlCustomProductList"),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => !p.hide);

        setProducts(list);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  /* ---------------- Scroll to Checkout ---------------- */
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedItem]);

  /* ---------------- Helpers ---------------- */
  const getImageByDiamonds = (item) => {
    const d = parseInt(item.diamonds || 0);
    if ([55, 86].includes(d)) return avgImg;
    if ([110, 172].includes(d)) return xlargeImg;
    if ([275, 343].includes(d)) return mediumImg;
    if ([565, 706].includes(d)) return largeImg;
    if (d >= 1130) return superlargeImg;
    return smallImg;
  };

  const getPriceForRole = (item) => {
    if (role === "prime" || role === "reseller") {
      return item.resellerRupees ?? item.rupees;
    }
    if (role === "vip") {
      return Math.round(item.rupees * 0.97);
    }
    return item.rupees;
  };

  const groupOrder = ["any", "50", "100", "250", "500", "1000"];
  const groupLabels = {
    any: "Any Amount Task",
    "50": "50 Recharge Task",
    "100": "100 Recharge Task",
    "250": "250 Recharge Task",
    "500": "500 Recharge Task",
    "1000": "1000 Recharge Task",
  };

  const groups = groupOrder.map((key) => ({
    key,
    label: groupLabels[key],
    items: products
      .filter((p) => p.group === key)
      .sort((a, b) => (a.diamonds || 0) - (b.diamonds || 0)),
  }));

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center`}>
        <p className="text-xl">Loading Packs...</p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen py-4">
      <div className="max-w-7xl mx-auto px-2">

        {groups.map(
          ({ key, label, items }) =>
            items.length > 0 && (
              <section key={key} className="mb-10">

                {/* Group Header */}
                <div
                  className={`p-2 mb-4 text-lg rounded-md shadow border-l-4 ${
                    isDarkMode
                      ? "bg-yellow-900 border-yellow-600 text-yellow-300"
                      : "bg-yellow-100 border-yellow-500 text-yellow-800"
                  }`}
                >
                  <strong>{label}</strong>
                </div>

                {/* Product Grid (COMPACT DESIGN) */}
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item, i) => {
                    const imageSrc = getImageByDiamonds(item);
                    const price = getPriceForRole(item);
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <div
                        key={i}
                        onClick={() => !item.outOfStock && setSelectedItem(item)}
                        className={`flex relative flex-row overflow-hidden cursor-pointer justify-between items-center px-2 py-1 rounded-md border shadow-md transition-all duration-200 hover:shadow-lg
                          ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-gray-200"
                              : "bg-gray-50 border-gray-300 text-gray-900"
                          }
                          ${isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""}
                          ${item.outOfStock ? "opacity-80 cursor-not-allowed" : ""}
                        `}
                      >
                        {/* OUT OF STOCK RIBBON */}
                        {item.outOfStock && (
                          <div className="absolute top-7 py-1 -left-5 w-[150px] bg-red-600 text-white text-[8px] text-center font-bold transform -rotate-45 z-10">
                            OUT OF STOCK
                          </div>
                        )}

                        {/* Left */}
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 flex items-center">
                            <img
                              src={imageSrc}
                              alt={item.label}
                              className="rounded-sm object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] font-semibold">
                              {item?.diamonds > 0 ? item.diamonds : ""} Diamonds
                            </p>
                            <p
                              className={`text-xs italic ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {item.label}
                            </p>
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-end space-y-1">
                          <p className="font-semibold text-[13px] text-green-500">
                            ₹{price}
                          </p>
                          {item.falseRupees > 0 && (
                            <p className="text-[10px] text-red-500 line-through">
                              ₹{item.falseRupees}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )
        )}

        {/* Checkout */}
        <div ref={checkoutRef} className="mt-10 max-w-2xl mx-auto">
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
            role={role}
          />
        </div>

      </div>
    </div>
  );
};

export default MLBBCustomProductList;
