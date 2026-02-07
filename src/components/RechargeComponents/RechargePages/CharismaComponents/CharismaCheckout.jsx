import { useState, useEffect } from "react";
import { useUser } from "../../../../context/UserContext";
import { parsePath, useNavigate } from "react-router-dom";
import { useAlert } from "../../../../context/AlertContext";
import saveToDatabase from "../../../../utils/saveToDatabase";
import coin from "../../../../assets/images/coin.png";
import upi from "../../../../assets/images/upi.png";
import { useDarkMode } from "../../../../context/DarkModeContext";
import { serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../../../../configs/firebase";
import ConfirmDetailsForm from "./ConfirmDetailsForm";
import { useModal } from "../../../../context/ModalContext";
import OrderDetailModal from "../../../modal/OrderDetailModal";

const CharismaCheckout = ({ selectedItem, setSelectedItem, userId, setUserId, zoneId, setZoneId, username, setUsername, usernameExists, setUsernameExists }) => {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const {openModal, closeModal} = useModal()
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);  
  const balance = user?.balance || 0;
  const orderCount = user?.orderCount || 0;
  const {isDarkMode} = useDarkMode()

  const parsedPrice = parseFloat(selectedItem?.rupees) * quantity;
  const mobile = phone?.split(" ").pop(); 
   const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [isSelectedPayment, setIsSelectedPayment] = useState("coin");
  const [isDisabled, setIsDisabled] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);


    const resetForm = () => {
    setSelectedItem(null);          // clear selected item (make sure setSelectedItem comes from props or context)
    setIsSelectedPayment("coin");   // reset payment method
    setNewOrderId(generateRandomOrderId());  // generate fresh order id
    setOrderDetails(null);          // clear order details modal data
    setUserId("")
    setZoneId("")
    setUsername("")
    setUsernameExists(false)
  };
    useEffect(() => {
  setNewOrderId(generateRandomOrderId());
}, [isSelectedPayment, username]);



  function getLocalISOString() {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, "0");

    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    const timeString = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    const dateString = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    return `${dateString}T${timeString}`;
  }

  const fullDateTime = getLocalISOString();
  const [datePart, timePart] = fullDateTime.split("T");

  function generateRandomOrderId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let orderId = "CHARMS-";
    for (let i = 0; i < length; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
  }
  const [newOrderId, setNewOrderId] = useState(generateRandomOrderId())
const handleUpi = async () => {
  const orderData = {
    id: newOrderId,
    userId,
    uid: user.uid,
    zoneId,
    product: "charisma",
    productId: selectedItem.id,
    username: user.username,
    gameUsername: username,
    cost: parsedAmount,
    date: datePart,
    time: timePart,
    selectedItem,
  };

  try {
    showAlert("Redirecting, please wait...");

    // Call backend endpoint
    const { data } = await axios.post(`${import.meta.env.VITE_PAYMENT_URL}/customer/start-order`, orderData);

    if (data.success && data.orderId) {
      // Navigate to internal payment page instead of external redirect
      navigate(`/payment/${data.orderId}`);
    } else {
      showAlert(`Payment initiation failed: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
    showAlert("Something went wrong while starting payment.");
  }
};

  const handleConfirm = ({email, phone, quantity}) => {
    setEmail(email)
    setPhone(phone)
    setQuantity(quantity)

    // data = { email, phone, quantity }
  };
function openConfirmModal({ title, content }) {
  return new Promise((resolve) => {
    openModal({
      title,
      content,
      type: "confirm",
      onConfirm: () => {
        resolve(true);
        closeModal();
        
      },
      onCancel: () => {
        resolve(false);
        closeModal();
        
      },
    });
  });
}

const handleCreateOrder = async () => {
  setIsDisabled(true);
  try {
    if (!selectedItem) {
       showAlert("Please select a package.");
      return;
    }
    if (!username) {
       showAlert("Check your username.");
      return;
    }
    if (!user) {
       showAlert("Log in to purchase.");
      return;
    }
    if(!detailsConfirmed) {
      showAlert("Please confirm order details")
      return
    }
    if (!email) {
       showAlert("Please provide Email.");
      return;
    }
    if (!phone) {
       showAlert("Please provide Phone number.");
      return;
    }
    if (!quantity) {
       showAlert("Quantity is missing.");
      return;
    }

    // Await modal confirmation here:
    const confirmed = await openConfirmModal({
      title: "Confirmation",
      content: (
        <p>
          Confirm Purchase for <strong>{selectedItem.label || selectedItem.nama_layanan}</strong>?
        </p>
      ),
    });

    if (!confirmed) {
      setIsDisabled(false);
      return;
    }

    // Proceed with order creation
    const orderData = {
      id: newOrderId,
      orderId: newOrderId,
      userId,
      zoneId,
      productId: selectedItem.id,
      cost: parsedPrice,
      date: datePart,
      time: timePart,
      item: selectedItem.label,
      payment: isSelectedPayment,
      username: user.username,
      userUid: user.uid,
      gameUsername: username,
      status: "pending",
      email,
      phone,
      quantity,
      product: 'Charmisma Order',
      createdAt: serverTimestamp(),
                        fulfilled: true,
                  fulfilledAt: new Date(),

    };

    if (isSelectedPayment === "upi") {
      showAlert("Redirecting please wait...")
      handleUpi()
      return
    } else if (isSelectedPayment === "coin") {
      if (parseFloat(balance) < parsedPrice) {
         showAlert("Insufficient Balance.");
        setIsDisabled(false);
        return;
      }

      const newBalance = parseFloat(balance) - parsedPrice;
      const newOrderCount = orderCount + 1;

      await saveToDatabase(`/users/${user.uid}/charms-orders/${newOrderId}`, orderData);
      await saveToDatabase(`/charms-orders/${newOrderId}`, orderData);

      await saveToDatabase(`/users/${user.uid}`, {
        balance: newBalance,
        orderCount: newOrderCount,
      });

        await addDoc(collection(db, "users", user.uid, "balance-history"), {
          type: "deduction",
          amount: parsedPrice,
          reason: `Recharge for ${selectedItem.label} (${selectedItem.id})`,
          timestamp: serverTimestamp(),
          by: "user", 
          balanceAfter: newBalance,
        });
       showAlert("Recharge Success!");
               setUsernameExists(false);
        setOrderDetails(orderData);
        setShowOrderModal(true);

      setUsernameExists(false);
    }
    return
  } catch (error) {
     showAlert("Failed to Create Order!");

    console.error("Purchase failed:", error);
  } finally {
    setIsDisabled(false);
    setDetailsConfirmed(false)
  }
};


return (
  <div className={`w-full flex flex-col gap-6 p-0 ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
    <ConfirmDetailsForm selectedItem={selectedItem} isDarkMode={isDarkMode} user={user} onConfirm={handleConfirm}  detailsConfirmed={detailsConfirmed}   setDetailsConfirmed={setDetailsConfirmed} />
    <div
      className={`w-full border p-4 rounded-sm shadow-lg backdrop-blur-sm ${
        isDarkMode
          ? "border-gray-700 bg-gray-900/70"
          : "border-gray-200 bg-white/70"
      }`}
    >
      <h1 className={`text-xl font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
        Choose Payment Method
      </h1>
      <div className="flex flex-col gap-4">
        {["upi", "coin"].map((method) => (
          <button
            key={method}
            onClick={() => setIsSelectedPayment(method)}
            className={`relative flex-1 py-3 px-3 rounded-md transition duration-300 font-medium shadow-md text-left ${
              isSelectedPayment === method
                ? "bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg border border-yellow-600 text-gray-800"
                : `${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
                  }`
            }`}
          >
            {isSelectedPayment === method && (
              <div className="absolute top-1 right-1 bg-green-400 rounded-full p-[2px] shadow">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {method === "coin" ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <img className="w-10 h-10" src={coin} alt="Coin" />
                  <div>
                    <p className="text-lg font-semibold">Gamebar Coin</p>
                    <p className="text-sm font-[400]">Balance: {user?.balance || 0}</p>
                  </div>
                </div>

                {selectedItem && (
                  <p className={`text-lg font-semibold ${isSelectedPayment === "coin" ? "text-white" : "text-black"}`}>
                    ₹{parsedPrice || ""}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <img className="h-10" src={upi} alt="UPI" />
                </div>

                {selectedItem && (
                  <p className={`text-lg font-semibold ${isSelectedPayment === "upi" ? "text-white" : "text-black"}`}>
                    ₹{parsedPrice || ""}
                  </p>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>

    <div
      className={`w-full border p-4 rounded-md shadow-md space-y-4 ${
        isDarkMode
          ? "border-gray-700 bg-gray-900/70 text-gray-300"
          : "border-gray-200 bg-white/70 text-gray-800"
      }`}
    >
      <button
        disabled={isDisabled}
        onClick={user ? handleCreateOrder : () => navigate("/login")}
        className={`w-full py-3 text-center rounded-lg font-semibold transition-all duration-300 ${
          isDisabled
            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 hover:from-sky-600 hover:via-indigo-600 hover:to-violet-700"
        }`}
      >
        {user ? "BUY NOW" : "Log in first"}
      </button>
    </div>
     {showOrderModal && orderDetails && (
            <OrderDetailModal
              orderData={orderDetails}
              navigateTo="/redeem"
              onClose={() => {
                setShowOrderModal(false);
                resetForm();  // FIXED typo here
              }}
            />
          )}
    
  </div>
);

};

export default CharismaCheckout;