import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../configs/firebase";
import { charismaImageMap } from "../../RechargeUtils/productList";
import CharismaCheckout from "./CharismaCheckout";
import { useDarkMode } from "../../../../context/DarkModeContext";

const CharismaProductList = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const [charismaProducts, setCharismaProducts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const { isDarkMode } = useDarkMode();

  // This ref points to the checkout section
  const checkoutRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "charismaProducts"));
      const products = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          img: charismaImageMap[data.img] || null,
        };
      });
      setCharismaProducts(products);
    };

    fetchProducts();
  }, []);

  // Auto-scroll to checkout when a product is selected
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedItem]);

  return (
    <div
      className={`space-y-4 w-full flex flex-col sm:grid sm:grid-cols-2 gap-10 ${
        isDarkMode ? "text-gray-300" : "text-gray-800"
      }`}
    >
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-2">
        {charismaProducts.map((item, i) => (
          <div
            key={i}
            onClick={() => setSelectedItem(item)}
            className={`flex flex-row cursor-pointer justify-between items-center px-2 py-1 rounded-md border shadow-md transition-all duration-200 hover:shadow-lg ${
              selectedItem?.id === item.id
                ? "ring-2 ring-offset-2 ring-purple-400"
                : isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 w-15 h-15 overflow-hidden">
              <img className="w-fit rounded-lg" src={item.img} alt={item.label} />
            </div>
            <div className="flex flex-col items-end">
              <p className="font-semibold text-[13px]">
                ₹{item.rupees}
              </p>
              <p
                className={`text-[9px] line-through ${
                  isDarkMode ? "text-red-400" : "text-red-800"
                }`}
              >
                ₹{item.falseRupees}
              </p>
              <p className="text-xs font-semibold text-end text-gray-500">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Section — ref attached here */}
      <div ref={checkoutRef}>
        <CharismaCheckout
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

export default CharismaProductList;