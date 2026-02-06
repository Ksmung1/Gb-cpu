import { useState, useEffect, useRef } from "react";
import RechargeCheckout from "../RechargeComponents/RechargeCheckout";
import { useProducts } from "../../context/ProductContext";
import diamondImg from "../../assets/images/d.avif";
import firstRechargeImg from "../../assets/images/dd.avif";
import weeklyImg from "../../assets/images/weekly.avif";
import twilightImg from "../../assets/images/twilight.jpg";
import defaultImg from "../../assets/images/d.avif";
import { useUser } from "../../context/UserContext";
import smallPacks from "../../assets/images/small-packs.png";
import mediumPacks from "../../assets/images/medium-packs.png";
import largePacks from "../../assets/images/large-packs.png";
import { useDarkMode } from "../../context/DarkModeContext";
import { useNavigate } from "react-router-dom";
import hvp from "../../assets/images/hvp.png";

const RechargeProductList = ({
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
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState("dd");
  const { products, loaded } = useProducts();
  const { isDarkMode } = useDarkMode();
  const checkoutRef = useRef(null);

  // Add this useEffect
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedItem]);
  if (!loaded) return <div>Loading....</div>;

  const groupNames = {
    dd: { label: "First Recharge", img: firstRechargeImg },
    d: { label: "Diamonds", img: diamondImg },
    weekly: { label: "Weekly Pass", img: weeklyImg },
    twilight: { label: "Twilight Pass", img: twilightImg },
  };

  const filteredList = products.filter((item) => {
    if (item.hide) return false;
    if (activeGroup === "twilight") {
      return item.type === "twilight pass";
    }
    if (activeGroup === "weekly") {
      return item.type === "weekly";
    }
    return item.group === activeGroup;
  });

  const getImageByGroupOrType = (item) => {
    const diamonds = parseInt(item.diamonds || 0);
    if (item.label === "High-Value Pass") return hvp;
    if (item.type === "weekly") return weeklyImg;
    if (item.type === "twilight pass") return twilightImg;

    // Different image based on diamonds
    if (item.group === "d") {
      if (diamonds >= 2000) return largePacks;
      if (diamonds >= 1000) return mediumPacks;
      if (diamonds >= 500) return diamondImg;
      if (diamonds >= 100) return smallPacks;
      return smallPacks;
    }

    if (item.group === "dd") return firstRechargeImg;
    return defaultImg;
  };

  return (
    <div
      className={`space-y-4 w-full flex flex-col sm:grid sm:grid-cols-2 gap-10 ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Filter Tabs with Images */}
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-3 justify-between">
          {Object.entries(groupNames).map(([key, { label, img }]) => (
            <button
              key={key}
              onClick={() => {
                setActiveGroup(key);
                setSelectedItem(null);
              }}
              className={`flex flex-col cursor-pointer items-center gap-1 p-2 rounded-lg text-[10px] font-semibold border transition-all ${
                activeGroup === key
                  ? "bg-yellow-300/90 text-black border-gray-100"
                  : isDarkMode
                  ? "bg-gray-800 text-gray-200 border-gray-700"
                  : "bg-gray-50 text-gray-700 border-gray-300"
              }`}
            >
              <div>
                <img
                  src={img}
                  alt={label}
                  className="h-10 rounded-sm object-cover"
                />
              </div>
              {label}
            </button>
          ))}
        </div>

        {/* ⚠️ Double Diamond Notice */}
        {activeGroup === "dd" && (
          <div
            className={`p-3 text-sm rounded-md shadow border-l-4 ${
              isDarkMode
                ? "bg-yellow-900 border-yellow-600 text-yellow-300"
                : "bg-yellow-100 border-yellow-500 text-yellow-800"
            }`}
          >
            <strong>Note:</strong> Double Diamonds are <u>only available</u> for
            first-time purchases. If already purchased, please select regular
            diamonds.
          </div>
        )}
        {activeGroup === "d" && (
          <div
            className={`p-3 text-sm rounded-md shadow border-l-4 ${
              isDarkMode
                ? "bg-yellow-900 border-yellow-600 text-yellow-300"
                : "bg-yellow-100 border-yellow-500 text-yellow-800"
            }`}
          >
            <strong>Note:</strong> Unsupported region ID: 🇮🇩🇵🇭🇲🇾🇷🇺🇸🇬🇧🇷🇹🇷. Please
            buy from{" "}
            <span
              onClick={() => navigate("/mlbb-international")}
              className="underline"
            >
              Mlbb International packs
            </span>{" "}
            section.{" "}
            <strong>
              <span
                onClick={() => navigate("/id-checker")}
                className="underline"
              >
                Region Checker Tool
              </span>
            </strong>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-3 px-0">
          {[...filteredList]
            .sort((a, b) => {
              const aDiamonds = parseInt(a.diamonds || 0);
              const bDiamonds = parseInt(b.diamonds || 0);
              return aDiamonds - bDiamonds;
            })
            .map((item, i) => {
              const imageSrc = getImageByGroupOrType(item);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedItem(item)}
                  className={`flex relative flex-row overflow-hidden cursor-pointer justify-between items-center px-2 py-1 rounded-md border shadow-md transition-all duration-200 hover:shadow-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-gray-200"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  } ${
                    selectedItem?.id === item.id
                      ? "ring-2 ring-offset-2 ring-blue-500"
                      : ""
                  }`}
                >
                  {item.outOfStock && (
                    <div className="absolute top-7 py-1 -left-5 w-[150px] bg-red-600 text-white text-[6px] text-center font-bold transform -rotate-45 z-10 shadow-lg pointer-events-none">
                      OUT OF STOCK
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <div className="w-12 h-12 flex items-center">
                      <img
                        className="rounded-sm object-cover"
                        src={imageSrc}
                        alt={item.label}
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] font-semibold">
                        {item?.diamonds === 0 ? "" : item.diamonds}{" "}
                        {item.type === "double diamond"
                          ? "Double"
                          : item.type === "weekly" &&
                            item.label?.toLowerCase().includes("3x")
                          ? "3x Weekly"
                          : item.type === "weekly" &&
                            item.label?.toLowerCase().includes("2x")
                          ? "2x Weekly"
                          : item.type === "weekly" &&
                            item.label?.toLowerCase().includes("4x")
                          ? "4x Weekly"
                          : item.type === "weekly" &&
                            item.label?.toLowerCase().includes("5x")
                          ? "5x Weekly"
                          : item.type === "weekly" &&
                            item.label?.toLowerCase().includes("pass")
                          ? "Special Item"
                          : item.type === "weekly"
                          ? "Weekly"
                          : item.type === "twilight pass"
                          ? "Twilight"
                          : "Diamonds"}
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
                  <div className="flex flex-col items-end space-y-1">
                    <p className="font-semibold text-[13px] text-green-500">
                      ₹
                      {(() => {
                        let parsedAmount;

                        if (
                          user?.role === "reseller" ||
                          user?.role === "prime"
                        ) {
                          parsedAmount = item.resellerRupees;
                        }
                        // else if (user?.role === "admin") {
                        //   parsedAmount = 1;
                        // }
                        else if (user?.role === "vip") {
                          parsedAmount = Math.round(item.rupees * 0.97); // VIP 1% discount, rounded
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
              );
            })}
        </div>
      </div>

      {/* Checkout Component */}
      <div
        ref={checkoutRef}
        id="recharge-checkout-section"
        className="scroll-mt-20"
      >
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

export default RechargeProductList;
