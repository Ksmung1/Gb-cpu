import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useAlert } from "../../../../context/AlertContext";

const ConfirmDetailsForm = ({ selectedItem, isDarkMode, user, onConfirm, detailsConfirmed, setDetailsConfirmed}) => { 
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const {showAlert} = useAlert()

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      const rawPhone = user.phone || ""
          if (rawPhone.length > 10) {
          const countryCode = rawPhone.slice(0, rawPhone.length - 10);
          const number = rawPhone.slice(-10);
          setPhone(`${countryCode} ${number}`);
          } else {
          setPhone(rawPhone); // fallback if input is already correct or invalid
          }
    }
  }, [user]);
  const increaseQty = () => {
    if(detailsConfirmed) return
    if (quantity < 5) setQuantity(quantity + 1);
  };

  const decreaseQty = () => {
    if(detailsConfirmed) return
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const baseStyle = isDarkMode ? "bg-gray-900 text-zinc-100 border-zinc-700" : "bg-white text-zinc-800 border-zinc-300";
  const inputStyle = isDarkMode ? "bg-gray-800 text-zinc-100 border-zinc-700" : "bg-zinc-100 text-zinc-800 border-zinc-300";

  return (
    <div className={`w-full mx-auto p-4 rounded-2xl shadow-md space-y-4 border ${baseStyle}`}>
      <h2 className="text-xl font-semibold">Confirm Your Details</h2>

      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputStyle}`}
        />
      </div>

      {/* Phone Input */}
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone
        </label>
   <input
  id="phone"
  type="text"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  pattern="^\+\d{1,4} \d{6,14}$"
  placeholder="+91 9876543210"
  className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputStyle}`}
/>

      </div>

      {/* Selected Item */}
      <div className="text-sm">
        <p><strong>Item:</strong> {selectedItem?.label || "None selected"}</p>
      </div>

      {/* Quantity Picker */}
      <div className="flex items-center space-x-4">
        <p className="text-sm font-medium">Quantity:</p>
        <button
          onClick={decreaseQty}
          className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
          disabled={quantity === 1}
        >
          <FaMinus size={12} />
        </button>
        <span className="text-lg font-semibold">{quantity}</span>
        <button
          onClick={increaseQty}
          className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
          disabled={quantity === 5}
        >
          <FaPlus size={12} />
        </button>
      </div>

      {/* Confirm Button */}
      <button
        disabled={detailsConfirmed}
        className={`w-full py-2 px-4 rounded-lg ${detailsConfirmed ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 cursor-pointer hover:bg-blue-700 "} text-white transition duration-200`}
          onClick={() => {
          if (onConfirm) {
          onConfirm({ email, phone, quantity });
          }  
          if (!selectedItem) {
                    showAlert('No item selected')
                    return
          }
            setDetailsConfirmed(true)

          }}      >
        {detailsConfirmed ? "Confrimed" : "Confirm Details"}
      </button>
    </div>
  );
};

export default ConfirmDetailsForm;
