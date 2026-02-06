import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../configs/firebase";
import SkinGiftCheckout from "./SkinGiftCheckout";
import { useDarkMode } from "../../../../context/DarkModeContext";

const SkinGiftingProductList = ({userId, setUserId, zoneId, setZoneId, username, setUsername, usernameExists, setUsernameExists}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState('')
  const {isDarkMode} = useDarkMode()

  const fetchProducts = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "skinGiftProducts"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <p className="text-center py-4">Loading...</p>;

return (
  <div className="grid sm:grid-cols-2 gap-10">
   
    <div className="flex flex-col gap-10">
             <div
          className={`p-3 text-sm rounded-md shadow border-l-4 ${
            isDarkMode
              ? 'bg-yellow-900 border-yellow-600 text-yellow-300'
              : 'bg-yellow-100 border-yellow-500 text-yellow-800'
          }`}
        >
          <strong>Note:</strong>  Skins  order requires 8 Days friendship and delivery may take upto 9 Days.  
          <span className="font-bold text-green-500"> You can track this order in Queue after successfully placing order</span>
        </div>
      {/* Product Grid */}
      <div className="grid grid-cols-2 w-full gap-4">
        {products.map((product, i) => (
          <div
            key={i}
            onClick={() => setSelectedItem(product)}
            className={`flex flex-row cursor-pointer justify-between items-center px-2 py-1 rounded-md shadow-md transition-all duration-200 hover:shadow-lg ${
              isDarkMode
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-300"
            } ${
              selectedItem?.id === product.id
                ? "ring-2 ring-offset-2 ring-purple-400"
                : ""
            }`}
          >
            <div className="w-16 h-16 overflow-hidden flex items-center">
              <img
                src={product.img || "https://via.placeholder.com/150"}
                alt={product.label}
                className="w-full h-full rounded-sm object-cover"
              />
            </div>
            <div className="flex flex-col items-end">
              <p className={`font-bold text-sm ${isDarkMode ? "text-green-400" : "text-green-700"}`}>
                ₹{product.rupees}
              </p>
              <p className={`line-through text-xs ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                ₹{product.falseRupees}
              </p>
              <h3 className={`mt-1 text-[10px] text-right font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                {product.label}
              </h3>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-center col-span-2 text-red-500">No products found.</p>
        )}
      </div>
    </div>
    {/* Checkout Panel */}
    <SkinGiftCheckout selectedItem={selectedItem} setSelectedItem={setSelectedItem}  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
  </div>
);

};

export default SkinGiftingProductList;
