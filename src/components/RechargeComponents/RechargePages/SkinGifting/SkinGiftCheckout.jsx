import { useState, useEffect } from "react";
import { useUser } from "../../../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../../context/ModalContext";
import { useAlert } from "../../../../context/AlertContext";
import { handlePayment } from "../../../../utils/handlePayment";
import saveToDatabase from "../../../../utils/saveToDatabase";
import { useUserID } from "../../../../context/UserIDContext";
import coin from "../../../../assets/images/coin.png";
import upi from "../../../../assets/images/upi.png";
import { useDarkMode } from "../../../../context/DarkModeContext";
import ContactInput from "./SkinContactInput";
import { db } from "../../../../configs/firebase";
import { serverTimestamp, addDoc, collection } from "firebase/firestore";
import OrderDetailModal from "../../../modal/OrderDetailModal";

const SkinGiftCheckout = ({ selectedItem, setSelectedItem, userId, setUserId, zoneId, setZoneId, username, setUsername, usernameExists, setUsernameExists }) => {
  const { user } = useUser();
  const email = user?.email || "abc@gmail.com";
  const [contactValue, setContactValue] = useState("");
  const phone = user?.phone || 'no contact'; 
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
    const resetForm = () => {
    setSelectedItem(null);          // clear selected item (make sure setSelectedItem comes from props or context)
    setIsSelectedPayment("coin");   // reset payment method
    setNewOrderId(generateRandomOrderId());  // generate fresh order id
    setOrderDetails(null);          // clear order details modal data
  };

  const parseDateDMY = (dateStr) => {
  if (!dateStr) return null;
  const [dd, mm, yyyy] = dateStr.split("-");
  if (!dd || !mm || !yyyy) return null;
  // Pad with zeros just in case
  const day = dd.padStart(2, "0");
  const month = mm.padStart(2, "0");
  return new Date(`${yyyy}-${month}-${day}`); // ISO format yyyy-mm-dd
};

// Helper: format Date object back to "dd/mm/yyyy"
const formatDateDMY = (dateObj) => {
  if (!dateObj) return "";
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Calculate delivery date by adding 8 days
const calculateDeliveryDate = (dateStr) => {
  const orderDate = parseDateDMY(dateStr);
  if (!orderDate) return "";
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 8);
  return formatDateDMY(deliveryDate);
};


  const { isDarkMode } = useDarkMode();
  const mobile = user?.phone.slice(-10);
  const balance = user?.balance || 0;

  function getLocalISOString() {
    const now = new Date();

    const pad = (num) => num.toString().padStart(2, "0");

    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert to 12-hour format

    const timeString = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    const dateString = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    return `${dateString}T${timeString}`;
  }

  const fullDateTime = getLocalISOString();
  const [datePart, timePart] = fullDateTime.split("T");

  function generateRandomOrderId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let orderId = "SKIN-";
    for (let i = 0; i < length; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
  }

  const [newOrderId, setNewOrderId] = useState(generateRandomOrderId());
  const { showAlert } = useAlert();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const [isSelectedPayment, setIsSelectedPayment] = useState("coin");
  const [isDisabled, setIsDisabled] = useState(false);

    useEffect(() => {
  setNewOrderId(generateRandomOrderId());
}, [isSelectedPayment, username]);

  const handleCreateOrder = () => {
      const deliveryDate = calculateDeliveryDate(datePart)

    setIsDisabled(true);
    try {
      if (!selectedItem) {
        showAlert("Please select a package")
        return;
      }
      if (!username) {
          showAlert("Please check your username")
        return;
      }
      if (!contactValue) {
          showAlert("No contact provided.")
        return;
      }
      if (!user) {
        showAlert("Login first to make a purchase")
        return;
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsDisabled(false);
    }


    openModal({
      title: "Confirmation",
      content: <p>Confirm Purchase for <strong>{selectedItem.label}</strong>?</p>,
      type: "confirm",
      onConfirm: async () => {
        try {
          if (isSelectedPayment === "upi") {
            try {
              const orderData = {
                id: newOrderId,
                user: user.uid,
                description: selectedItem.label,
                product: 'Skin Gifting',
                userId,
                zoneId,
                productId: selectedItem.id,
                cost: parseFloat(selectedItem.rupees),
                date: datePart,
                time: timePart,
                item: selectedItem.label,
                payment: "upi",
                username: user.username,
                userUid: user.uid,
                gameUsername: username,
                email,
                phone,
                img: selectedItem.img,
                createdAt: serverTimestamp(),
                deliveryDate
              };

              const paymentSuccess = await handlePayment(
                mobile,
                parseFloat(selectedItem.rupees),
                user.uid,
                selectedItem.label,
                showAlert,
                newOrderId,
                orderData
              );
              if(!paymentSuccess) {
                return
              } 
              showAlert("Redirecting to payment page.")
              await saveToDatabase(`/users/${user.uid}/skin-orders/${newOrderId}`, orderData);
              await saveToDatabase(`/skin-orders/${newOrderId}`, orderData);

              setUsernameExists(false);
             
            } catch (err) {
              console.log(err);
            }
          } else if (isSelectedPayment === "coin") {
            const parsedPrice = parseFloat(selectedItem.rupees);
            if (parseFloat(balance) < parsedPrice) {
              showAlert("Insufficient Gamebar Coin balance. Please topup to proceed.");
              return;
            }

            const newBalance = parseFloat(balance) - parsedPrice;

            const orderData = {
              id: newOrderId,
              orderId: newOrderId,
              userId,
              zoneId,
              product: 'Skin Gifting',
              productId: selectedItem.id,
              cost: parsedPrice,
              date: datePart,
              time: timePart,
              item: selectedItem.label,
              payment: isSelectedPayment,
              username: user.username,
              user: user.uid,
              userUid: user.uid,
              gameUsername: username,
              status: "pending",
              email,
              phone,
              contactValue,
              img: selectedItem.img,
              description: selectedItem.label,
              createdAt: serverTimestamp(),
              deliveryDate
            };

             saveToDatabase(`/users/${user.uid}/skin-orders/${newOrderId}`, orderData);
            saveToDatabase(`/skin-orders/${newOrderId}`, orderData);

            saveToDatabase(`/users/${user.uid}`, {
              balance: newBalance,
            });
            await addDoc(collection(db, "users", user.uid, "balance-history"), {
          type: "deduction",
          amount: parsedPrice,
          reason: `Recharge for ${selectedItem.label} (${selectedItem.id})`,
          timestamp: serverTimestamp(),
          by: "user", 
          balanceAfter: newBalance,
        });
        setUsernameExists(false);
        setOrderDetails(orderData);
        setShowOrderModal(true);
  
          }
        } catch (error) {
      showAlert("An error occured, Please try again later")
          console.error("Purchase failed:", error);
        } finally {
          setIsDisabled(false);
        }
      },
      onCancel: () => {
        console.log("Logout cancelled");
      },
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 p-0">
<ContactInput 
  contactValue={contactValue} 
  setContactValue={setContactValue} 
  userPhone={user?.phone} 
  userEmail={user?.email} 
/>


      {/* Payment Method Box */}
      <div
        className={`w-full border p-4 rounded-sm shadow-lg backdrop-blur-sm ${
          isDarkMode ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-white/70 text-gray-800"
        }`}
      >
        <h1 className="text-xl font-semibold mb-3">Choose Payment Method</h1>
        <div className="flex flex-col gap-4">
          {["upi", "coin"].map((method) => (
            <button
              key={method}
              onClick={() => setIsSelectedPayment(method)}
              className={`relative flex-1 py-3 px-3 rounded-md transition duration-300 font-medium shadow-md text-left ${
                isSelectedPayment === method
                  ? "bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-800 shadow-lg border border-yellow-600"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600"
                  : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
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

              {/* Coin Method */}
              {method === "coin" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <img className="w-10 h-10" src={coin} alt="coin" />
                    <div>
                      <p className="text-lg font-semibold">Gamebar Coin</p>
                      <p className="text-sm font-[400]">
                        Balance: <strong className="text-green-500">{user?.balance || 0}</strong>
                      </p>
                    </div>
                  </div>
                  {selectedItem && (
                    <p
                      className={`text-lg font-semibold ${
                        isSelectedPayment === "coin"
                          ? "text-white"
                          : isDarkMode
                          ? "text-gray-200"
                          : "text-black"
                      }`}
                    >
                      ₹{selectedItem?.rupees || ""}
                    </p>
                  )}
                </div>
              )}

              {/* UPI Method */}
              {method === "upi" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <img className="h-10" src={upi} alt="upi" />
                  </div>
                  {selectedItem && (
                    <p
                      className={`text-lg font-semibold ${
                        isSelectedPayment === "upi"
                          ? "text-white"
                          : isDarkMode
                          ? "text-gray-200"
                          : "text-black"
                      }`}
                    >
                      ₹{selectedItem?.rupees || ""}
                    </p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Checkout Summary */}
      <div
        className={`w-full border p-4 rounded-md shadow-md space-y-4 ${
          isDarkMode ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-white/70 text-gray-800"
        }`}
      >
        <button
          disabled={isDisabled}
          onClick={user ? handleCreateOrder : () => navigate("/login")}
          className={`w-full py-3 text-center rounded-lg font-semibold transition-all duration-300 ${
            isDisabled
              ? isDarkMode
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
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
            resetForm();  
          }}
        />
      )}
    </div>
  );
};

export default SkinGiftCheckout;
