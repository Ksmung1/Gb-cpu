// OrderPage.jsx (Full account details with multiple images)
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useDarkMode } from "../../../context/DarkModeContext";

const OrderPage = () => {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const {isDarkMode} = useDarkMode()
  useEffect(() => {
    const fetchAccount = async () => {
      const docSnap = await getDoc(doc(db, "accounts-ml", id));
      if (docSnap.exists()) {
        setAccount(docSnap.data());
      } else {
        setAccount(null);
      }
      setLoading(false);
    };
    fetchAccount();
  }, [id]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!account) return <p className="p-4 text-red-500">Account not found.</p>;

return (
  <div className="w-full px-4 md:px-10 lg:px-20 py-10 bg-white">
    <h1 className="text-2xl font-bold mb-6">Account Details</h1>

    {/* Image Gallery */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      {account?.images?.length > 0 ? (
        account.images.map((imgUrl, i) => (
          <img
            key={i}
            src={imgUrl}
            alt={`Account Image ${i + 1}`}
            className="w-full h-40 object-cover rounded shadow"
            loading="lazy"
          />
        ))
      ) : (
        <p className="col-span-full text-center text-gray-500">No images available</p>
      )}
    </div>

    {/* Details */}
    <div className="space-y-3 text-gray-700">
      <p>
        <span className="font-semibold">Product Name:</span> {account.name || "N/A"}
      </p>
      <p>
        <span className="font-semibold">Skins:</span> {account.skins ?? 0}
      </p>
      <p>
        <span className="font-semibold">Heroes:</span> {account.heroes ?? 0}
      </p>
      <p>
        <span className="font-semibold">Level:</span> {account.level || "N/A"}
      </p>
      <p>
        <span className="font-semibold">Price:</span> ₹{account.price ?? 0}
      </p>
      <p className="text-sm">
        <span className="font-semibold">Description:</span> {account.description || "-"}
      </p>
    </div>
  </div>
);

};

export default OrderPage;
