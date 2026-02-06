import { useEffect, useState } from "react";
import { db } from "../../../../configs/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import MagicChessCheckout from "./MagicChessCheckout";

// 💡 Image Imports
import diamondImg from "../../../../assets/images/diamond.webp";
import firstRechargeImg from "../../../../assets/images/diamonds.webp";
import weeklyImg from "../../../../assets/images/weekly-mc.png";
import twilightImg from "../../../../assets/images/twilight.jpg";
import defaultImg from "../../../../assets/images/weekly-mc.png";
import { useDarkMode } from "../../../../context/DarkModeContext";
import { useUser } from "../../../../context/UserContext";

const RechargeProductList = ({userId, setUserId, zoneId, setZoneId, username, setUsername, usernameExists, setUsernameExists}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState("dd");
  const [products, setProducts] = useState([]);
  const {isDarkMode} = useDarkMode()
  const {user} = useUser()
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "magicChessProductList"),
      (snapshot) => {

        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a,b)=>parseFloat(a?.price) -parseFloat(b?.price))
        setProducts(list);
      },
      (error) => {
        console.error("🔥 Firestore fetch error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const groupNames = {
    dd: { label: "First Recharge", img: firstRechargeImg },
    d: { label: "Diamonds", img: diamondImg },
    weekly: { label: "Weekly Pass", img: weeklyImg },
  };

const filteredList = products
  .filter((item) => {
    if (item.hide === true) return false; // Hide if hide is true
    if (activeGroup === "weekly") return item.type === "weekly";
    if (activeGroup === "twilight") return item.type === "twilight pass";
    return item.group === activeGroup;
  })
  .sort((a, b) => parseFloat(a.rupees) - parseFloat(b.rupees)); // Sort by price


  const getTypeTag = (type) => {
    switch (type) {
      case "double diamond":
        return 
      case "weekly":
        return 
      case "twilight pass":
        return
      default:
        return null;
    }
  };

  const getImageByGroupOrType = (item) => {
    if (item.type === "weekly") return weeklyImg;
    if (item.type === "twilight pass") return twilightImg;
    if (item.group === "d") return diamondImg;
    if (item.group === "dd") return firstRechargeImg;
    return defaultImg;
  };

  return (
    <div className="space-y-4 w-full flex flex-col sm:grid sm:grid-cols-2 gap-10">
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
                  ? `bg-yellow-300/90 text-black border-gray-100`
                  : `${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-300'}`
              }`}
            >
              <img src={img} alt={label} className="h-10 rounded-sm object-contain" />
              {label}
            </button>
          ))}
        </div>

        {/* DD Warning */}
        {activeGroup === "dd" && (
          <div className={`border-l-4 p-3 text-sm rounded-md shadow ${
            isDarkMode
              ? 'bg-yellow-900 border-yellow-700 text-yellow-300'
              : 'bg-yellow-100 border-yellow-500 text-yellow-800'
          }`}>
            <strong>Note:</strong> Double Diamonds are <u>only available</u> for first-time purchases.
          </div>
        )}

        {/* Product Grid */}
        <div className="grid   grid-cols-2 gap-3">
          {filteredList.map((item, i) => {
            const imageSrc = getImageByGroupOrType(item);
            return (
              <div
                key={i}
                onClick={() => setSelectedItem(item)}
                className={`flex flex-row relative overflow-hidden cursor-pointer justify-between items-center px-2 py-1 rounded-md border shadow-md transition-all duration-200 hover:shadow-lg ${
                  selectedItem?.id === item.id ? 'ring-2 ring-offset-2 ring-blue-400' : ''
                } ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-gray-300'
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                }`}
              >
                  {item.outOfStock && (
                  <div className="absolute top-5 py-1 -left-1 w-[140px] bg-red-600 text-white text-[6px] text-center font-bold transform -rotate-45 z-10 shadow-lg pointer-events-none">
                    OUT OF STOCK
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <img
                    className="w-12 max-w-12 h-15 rounded-sm object-contain"
                    src={imageSrc}
                    alt={item.label}
                  />
                  <div className="flex flex-col space-y-1">
                    <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} text-[12px] font-bold`}>{item.diamonds}</p>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>{item.label}</p>
                    {getTypeTag(item.type)}
                  </div>
                </div>
            <div className="flex flex-col items-end space-y-1">
  <p className="font-semibold text-[13px] text-green-500">
    ₹{
      (() => {
        let parsedAmount;

        if (user?.role === "reseller" || user?.role === 'prime') {
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
      })()
    }
  </p>
  <p className="text-[10px] text-red-500 line-through">{item.falseRupees}</p>
</div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout */}
      <MagicChessCheckout selectedItem={selectedItem} setSelectedItem={setSelectedItem} userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} />
    </div>
  );
};

export default RechargeProductList;
