// AccountDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, updateDoc, setDoc, onSnapshot, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useUser } from "../../../context/UserContext";
import { db } from "../../../configs/firebase";
import { useModal } from "../../../context/ModalContext";
import { useDarkMode } from "../../../context/DarkModeContext";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css"

import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import 'yet-another-react-lightbox/styles.css'

import Zoom from "yet-another-react-lightbox/plugins/zoom"

const AccountDetails = () => {
  const { id } = useParams();
  const {openModal} = useModal()
  const { userData, user } = useUser();
  const [loading, setLoading] = useState()
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();
  const {isDarkMode} = useDarkMode()
  const [lightboxOpen, setLightboxOpen] = useState(false);
const [selectedIndex, setSelectedIndex] = useState(0);

const allImages = account ? [account.img1, ...(account.images || [])] : [];
const lightboxSlides = allImages.map((img) => ({ src: img }));

function getLocalISOString() {
  const now = new Date();

  const pad = (num) => num.toString().padStart(2, '0');

  let hours = now.getHours();
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format

  const timeString = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
  const dateString = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

  return `${dateString}T${timeString}`;
}
const fullDateTime = getLocalISOString()
const [datePart, timePart] = fullDateTime.split('T');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "accounts-ml", id), (snap) => {
      if (snap.exists()) {
        setAccount({ id: snap.id, ...snap.data() });
      } else {
        setAccount(null);
      }
    });
    return () => unsub();
  }, [id]);
  const balance = parseFloat(user?.balance) || 0;
  const price = parseFloat(account?.price) || 0;

const handleBuy = () => {
  if (!user) {
    return openModal({
      title: "Login Required",
      content: <p>Please log in to make a purchase.</p>,
      type: "close",
    });
  }


  if (balance < price) {
    return openModal({
      title: "Insufficient Balance",
      content: <p>Your balance is not enough to complete this purchase.</p>,
      type: "close",
    });
  }

  openModal({
    title: "Confirm Purchase",
    content: <p>Are you sure you want to buy this account for ₹{price}?</p>,
    type: "confirm",
    onConfirm: handleBuyConfirmed,
  });
};

const handleBuyConfirmed = async () => {
  try {
    setLoading(true);

    await updateDoc(doc(db, "accounts-ml", account.id), {
      status: "pending",
      buyerId: user.uid,
      boughtAt: Date.now(),
      itemType: "ml-account"
    });

    const orderData = {
      ...account,
      buyerId: user.uid,
      status: "pending",
      boughtAt: Date.now(),
      date: datePart,
      time: timePart,
      itemType: "ml-account",
      phone: user?.phone || "NO PHONE NUMBER",
      user:user?.username || "NO USERNAME",
      email: user?.email || "NO EMAIL",
      timestamp: serverTimestamp(),
    };

    await setDoc(doc(db, `users/${user.uid}/accounts-ml`, account.orderId), orderData);
    await setDoc(doc(db, 'orders', account.orderId), orderData);

    await updateDoc(doc(db, "users", user.uid), {
      balance: balance - price,
    });
           await addDoc(collection(db, "users", user.uid, "balance-history"), {
          type: "deduction",
          amount: price,
          reason: `Buying ml account`,
          timestamp: serverTimestamp(),
          by: "user", 
        });

    openModal({
      title: "Order Placed",
      content: <p>Order placed! Await account processing.</p>,
      type: "close",
    });
    navigate('/redeem')
  } catch (err) {
    console.error("Buy failed", err);
    openModal({
      title: "Error",
      content: <p>Something went wrong while placing the order.</p>,
      type: "close",
    });
  } finally {
    setLoading(false);
  }
};

  if (!account) return <p className="text-center py-20">Loading or account not found...</p>;
const date = new Date(account.createdAt)
  const formatted = date.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: 'medium'
  })
return (
<div
  className={`max-w-4xl mx-auto p-6 rounded-xl shadow-xl transition-all duration-300 mt-0 md:mt-10 md:mx-20 ${
    isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
  }`}
>
  {/* Title */}
  <h2 className="text-3xl font-extrabold mb-2 capitalize tracking-tight">
    {account.description || `Account ID: ${account.id}`}
  </h2>

  {/* Date */}
  <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
    Posted on:{" "}
    <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
      {formatted}
    </span>
  </p>

  {/* Highlight Note */}
  <div className="mb-6">
    <p
      className={`p-3 rounded-md font-semibold text-center shadow-md ${
        isDarkMode
          ? "bg-yellow-500/10 text-yellow-300 border border-yellow-600"
          : "bg-yellow-300 text-yellow-900"
      }`}
    >
      🔥 Check all images for full details before buying!
    </p>
  </div>

  {/* Image Gallery */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
<img
  src={account.img1}
  alt="Main Image"
  className="w-full h-64 object-cover rounded-lg shadow-md cursor-pointer"
  onClick={() => {
    setSelectedIndex(0);
    setLightboxOpen(true);
  }}
/>
    {account?.images?.length > 0 ? (
      account.images.map((img, i) => (
    <img
  key={i}
  src={img}
  alt={`Image ${i}`}
  className="w-full h-64 object-cover rounded-lg shadow-md cursor-pointer"
  onClick={() => {
    setSelectedIndex(i + 1); // +1 because main image is at 0
    setLightboxOpen(true);
  }}
/>

      ))
    ) : (
      <p
        className={`text-center col-span-2 italic ${
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        No additional images
      </p>
    )}
  </div>

  {/* Details */}
  <div className="space-y-3 mb-8 text-md leading-relaxed">
    <p className="text-2xl font-bold text-green-500">₹ {account.price}</p>

    <p>
      <span className="font-semibold">Posted by: </span>
      <span className="italic text-blue-400">{account.postedBy || "Unknown"}</span>
    </p>

    <p>
      <span className="font-semibold">Account ID: </span>
      <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{account.id}</span>
    </p>

    <p>
      <span className="font-semibold">Status: </span>
      {account.status === "pending" ? (
        <span className="text-red-400 font-semibold">Pending Confirmation</span>
      ) : (
        <span className="text-green-400 font-semibold">Available</span>
      )}
    </p>
  </div>

  {lightboxOpen && (
  <Lightbox
    open={lightboxOpen}
    close={() => setLightboxOpen(false)}
    slides={lightboxSlides}
    index={selectedIndex}
    plugins={[Zoom, Thumbnails]}
  />
)}


  {/* Buy Button */}
  {account.status !== "pending" && (
    <button
      disabled={loading}
      onClick={handleBuy}
      className={`w-full py-3 rounded-lg text-lg font-semibold transition duration-300 ${
        loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
      } text-white shadow-md`}
    >
      {loading ? "Processing..." : "💸 Buy Now"}
    </button>
  )}
</div>

);

};

export default AccountDetails;
