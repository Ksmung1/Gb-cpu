import React, { useEffect, useState } from "react";
import { db } from "../../configs/firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  getDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";
import { useModal } from "../../context/ModalContext";
import OrdersCard from "./AdminCards/OrdersCard";
import { useDarkMode } from "../../context/DarkModeContext";

// Custom Confirmation Modal component
const ConfirmationModal = ({ title, message, onConfirm, onCancel, isDarkMode }) => {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dim background */}
      <div
        className={`absolute inset-0 ${
          isDarkMode ? "bg-black/70" : "bg-black/50"
        } backdrop-blur-sm`}
        onClick={onCancel}
      />
      {/* Modal box */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-xl p-6 shadow-lg ${
          isDarkMode ? "bg-gray\-900 text-gray-200" : "bg-white text-gray-900"
        }`}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded text-sm font-semibold transition ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                : "bg-gray-300 hover:bg-gray-400 text-gray-900"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-sm font-semibold transition ${
              isDarkMode
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminRedeem = () => {
  const [orders, setOrders] = useState([]);
  const [charmsOrders, setCharmsOrders] = useState([]);
  const [skinOrders, setSkinOrders] = useState([]);
  const [editing, setEditing] = useState({});
  const { openModal } = useModal();
  const { isDarkMode } = useDarkMode();
  const [currentTab, setCurrentTab] = useState("ml");
  const hasPendingML = orders.length > 0;
const hasPendingCharms = charmsOrders.length > 0;
const hasPendingSkins = skinOrders.length > 0;

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "accounts-ml"), (snap) => {
      const filtered = snap.docs
        .map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
        .filter((o) => o.itemType === "ml-account" && o.status === "pending");
      setOrders(filtered);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "charms-orders"), (snap) => {
      const filtered = snap.docs
        .map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
        .filter((o) => o.status === "pending");
      setCharmsOrders(filtered);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "skin-orders"), (snap) => {
      const filtered = snap.docs
        .map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
        .filter((o) => o.status === "pending");
      setSkinOrders(filtered);
    });
    return () => unsub();
  }, []);

  // ML orders save with confirmation
  const saveInfoWithConfirm = (order) => {
    setConfirmState({
      isOpen: true,
      title: "Confirm Processing",
      message: "Are you sure you want to mark this ML order as processing?",
      onConfirm: async () => {
        setConfirmState({ isOpen: false });
        await saveInfo(order);
      },
    });
  };

  const saveInfo = async (order) => {
    const { email, password, loginInfo } = editing[order.id] || {};
    if (!email?.trim() || !password?.trim()) {
      alert("❌ Email/Username and Password are required.");
      return;
    }
    const accountRef = doc(db, "accounts-ml", order.itemId || order.id);
    const globalOrderRef = doc(db, "orders", order?.id || order.id);
    const userOrderRef = doc(db, "users", order.buyerId, "accounts-ml", order.id || order.id);
    try {
      await Promise.all([
        updateDoc(accountRef, { status: "processing" }),
        updateDoc(globalOrderRef, { status: "processing" }),
        updateDoc(userOrderRef, {
          status: "processing",
          email: email.trim(),
          password: password.trim(),
          loginInfo: loginInfo?.trim() || "",
        }),
      ]);
      setEditing((prev) => ({ ...prev, [order.id]: {} }));
    } catch (err) {
      alert("Something went wrong. Check console for details.");
      console.error(err);
    }
  };

  // Skin order mark status with confirmation for 'processing'
  const markSkinOrder = async (order, status) => {
const proceed = () => {
  console.log(order)
  if (!order?.userUid || !order?.id) {
    console.error("❌ Missing userUid or orderId in skin order:", order);
    openModal({
      title: "Missing Data",
      content: "Order data is incomplete. Cannot proceed.",
      type: "close",
    });
    return;
  }

  const globalRef = doc(db, "skin-orders", order.id);
  const userRef = doc(db, "users", order.userUid, "skin-orders", order.id);
  const isFail = status === "fail";
  const isRefund = status === 'refunded'

  openModal({
    title: isFail ? "Confirm Failure" : isRefund ?  `Confirm refund.` : "Confirm Completion",
    content: isFail
      ? `You're about to mark this order as failed.`
      : isRefund ? `Refund Rs. ${order.cost} to user?`
      : "Are you sure you want to mark this order as completed?",
    type: "confirm",
    onConfirm: async () => {
      try {
        const updates = [
          updateDoc(globalRef, { status }),
          updateDoc(userRef, { status }),
        ];
if (isRefund) {
  const balanceHistoryRef = collection(db, "users", order.userUid, "balance-history");
  const userMainRef = doc(db, "users", order.userUid);
const userDoc = await getDoc(userMainRef);
const currentBalance = userDoc.exists() ? userDoc.data().balance || 0 : 0;

// Calculate new balance after refund (increment)
const newBalance = currentBalance + (order.cost || 0);

  // Update user balance
  updates.push(updateDoc(userMainRef, { balance: increment(order.cost || 0) }));

  await addDoc(balanceHistoryRef, {
    type: "refund",
    amount: order.cost || 0,
    reason: `Refund for skin order ${order.id}`,
    timestamp: serverTimestamp(),
    by: "admin",
    balanceAfter: newBalance,
  });
}

        await Promise.all(updates);
        openModal({
          title: "Success",
          content: `Order marked as ${status}.`,
          type: "close",
        });
      } catch (err) {
        openModal({
          title: "Error",
          content: "Failed to update skin order.",
          type: "close",
        });
      }
    },
  });
};

    if (status === "processing") {
      setConfirmState({
        isOpen: true,
        title: "Confirm Processing",
        message: "Are you sure you want to mark this Skin order as processing?",
        onConfirm: () => {
          setConfirmState({ isOpen: false });
          proceed();
        },
      });
    } else {
      proceed();
    }
  };
const markCharmsAsPaid = async (order) => {
  openModal({
    title: "Confirm Mark as Paid",
    content: "Are you sure you want to mark this charisma order as completed?",
    type: "confirm",
    onConfirm: async () => {
      const globalOrderRef = doc(db, "charms-orders", order.id);
      const userOrderRef = doc(db, "users", order.userUid, "charms-orders", order.id);
      try {
        await Promise.all([
          updateDoc(globalOrderRef, { status: "completed" }),
          updateDoc(userOrderRef, { status: "completed" }),
        ]);
        openModal({
          title: "✅ Order Completed",
          content: "Charisma order marked as completed.",
          type: "close",
        });
      } catch (err) {
        console.error("❌ Failed to mark as paid:", err);
        openModal({
          title: "❌ Error",
          content: "Something went wrong while updating charisma order.",
          type: "close",
        });
      }
    },
  });
};


  const markCharmAsFail = async (order) => {
    openModal({
      title: "Confirm Failed",
      content: `You're about to mark this order as failed`,
      type: "confirm",
      onConfirm: async () => {
        const globalOrderRef = doc(db, "charms-orders", order.id);
        const userOrderRef = doc(db, "users", order.userUid, "charms-orders", order.id);
        const userRef = doc(db, "users", order.userUid);
        try {
          const userSnap = await getDoc(userRef);
          const currentBalance = userSnap.data()?.balance || 0;
          if (currentBalance < 0) {
            return;
          }
          await Promise.all([
            updateDoc(globalOrderRef, { status: "fail" }),
            updateDoc(userOrderRef, { status: "fail" }),
          ]);
          openModal({
            title: "✅ Order Fail",
            content: `Mark as fail successfully.`,
            type: "close",
          });
        } catch (err) {
          openModal({
            title: "❌ Error",
            content: "Something went wrong while processing the refund.",
            type: "close",
          });
        }
      },
    });
  };
    const markCharmAsRefund = async (order) => {
    openModal({
      title: "Confirm Refund",
      content: `You're about to Refund ${order?.cost} Rs`,
      type: "confirm",
      onConfirm: async () => {
        const globalOrderRef = doc(db, "charms-orders", order.id);
        const userOrderRef = doc(db, "users", order.userUid, "charms-orders", order.id);
        const userRef = doc(db, "users", order.userUid);
        const balanceHistoryRef = collection(db, "users", order.userUid, "balance-history");

        try {
          const userSnap = await getDoc(userRef);
          const currentBalance = userSnap.data()?.balance || 0;
          const newBalance = currentBalance + order?.cost || 0

          await Promise.all([
            updateDoc(globalOrderRef, { status: "refunded" }),
            updateDoc(userOrderRef, { status: "refunded" }),
            updateDoc(userRef, { balance: increment(order?.cost) }),
             addDoc(balanceHistoryRef, {
            type: "refund",
            amount: order.cost || 0,
            reason: `Refund for ${order.product || "order"} ${order.id}`,
            timestamp: serverTimestamp(),
            by: "admin",
            balanceAfter:  newBalance
          }),
          ]);
          openModal({
            title: "✅ Order Fail",
            content: `Mark as fail successfully.`,
            type: "close",
          });
        } catch (err) {
          openModal({
            title: "❌ Error",
            content: "Something went wrong while processing the refund.",
            type: "close",
          });
        }
      },
    });
  };

  const handleEditChange = (orderId, field, value) => {
    setEditing((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      alert("Failed to copy.");
    }
  };

  return (
    <div className="px-4 py-6">
<div className="flex justify-center gap-2 mb-6">
  {["ml", "charms", "skins"].map((tab) => {
    const showDot =
      (tab === "ml" && hasPendingML) ||
      (tab === "charms" && hasPendingCharms) ||
      (tab === "skins" && hasPendingSkins);

    return (
      <button
        key={tab}
        onClick={() => setCurrentTab(tab)}
        className={`relative px-4 py-2 rounded-full font-medium transition-all ${
          currentTab === tab
            ? "bg-blue-500 text-white"
            : isDarkMode
            ? "bg-gray-700 text-gray-100"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        {tab === "ml" ? "ML Orders" : tab === "charms" ? "Charms" : "Skins"}

        {showDot && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
    );
  })}
</div>

      <div className="space-y-4">
        {currentTab === "ml" && (
          <div className={`rounded p-4 shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-lg font-semibold mb-2">ML Pending Orders</h2>
            {orders.map((order) => (
              <OrdersCard
                key={order.id}
                order={order}
                type="ml-accounts"
                editing={editing[order.id]}
                onEditChange={(field, value) => handleEditChange(order.id, field, value)}
                onSave={() => saveInfoWithConfirm(order)}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        )}

        {currentTab === "charms" && (
          <div className={`rounded p-4 shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-lg font-semibold mb-2">Charisma Pending Orders</h2>
            {charmsOrders.map((order) => (
              <OrdersCard
                key={order.id}
                order={order}
                type="charms"
                onMarkPaid={() => markCharmsAsPaid(order)}
                onMarkFail={() => markCharmAsFail(order)}
                onMarkRefund={()=>markCharmAsRefund(order)}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        )}

        {currentTab === "skins" && (
          <div className={`rounded p-4 shadow ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-lg font-semibold mb-2">Skin Pending Orders</h2>
            {skinOrders.map((order) => (
              <OrdersCard
                key={order.id}
                order={order}
                type="skins"
                onMarkStatus={(status) => markSkinOrder(order, status)}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        )}
      </div>

      {/* Custom confirmation modal */}
      {confirmState.isOpen && (
        <ConfirmationModal
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState({ isOpen: false })}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default AdminRedeem;
