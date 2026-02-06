import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { db, storage } from "../../configs/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { useDarkMode } from "../../context/DarkModeContext";

const AccountAuction = () => {
  const { user } = useUser();
  const { openModal } = useModal();
  const userUsername = user?.username || "Opai";
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newAccount, setNewAccount] = useState({
    description: "",
    img1: null,          // file object
    price: "",
    images: [],          // array of files
  });

  function generateRandomOrderId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let orderId = 'MLACC-';
    for (let i = 0; i < length; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
  }

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "accounts-ml"), (snap) => {
      const data = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((acc) => acc.status !== "pending" && acc.status !== "completed" && acc.status === "active");
      setAccounts(data);
    });
    return () => unsub();
  }, []);

  const deleteAccount = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this account?");
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "accounts-ml", id));
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      openModal({
        title: "Deleted",
        content: <p>Account deleted successfully.</p>,
        type: "close",
      });
    } catch (err) {
      console.error("Error deleting document:", err);
      openModal({
        title: "Error",
        content: <p>Failed to delete the account. Try again.</p>,
        type: "close",
      });
    }
  };

  // Handle save account: upload images then save document
  const handleSaveAccount = async () => {
    if (!newAccount.description || !newAccount.img1 || !newAccount.price) {
      openModal({
        title: "Validation Error",
        content: <p>Please fill in all required fields (Description, Main Image, Price).</p>,
        type: "close",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload main image
      const mainImgRef = ref(storage, `accounts/${Date.now()}_${newAccount.img1.name}`);
      await uploadBytes(mainImgRef, newAccount.img1);
      const mainImgUrl = await getDownloadURL(mainImgRef);

      // Upload additional images (if any)
      const additionalImgUrls = [];
      for (const file of newAccount.images) {
        const imgRef = ref(storage, `accounts/${Date.now()}_${file.name}`);
        await uploadBytes(imgRef, file);
        const url = await getDownloadURL(imgRef);
        additionalImgUrls.push(url);
      }

const customId = generateRandomOrderId();

await setDoc(doc(db, "accounts-ml", customId), {
  id: customId, // Save the ID in the doc itself
  description: newAccount.description,
  img1: mainImgUrl,
  images: additionalImgUrls,
  price: Number(newAccount.price),
  postedBy: userUsername,
  status: "active",
  createdAt: new Date(),
});

      // Reset and close modal
      setNewAccount({ description: "", img1: null, price: "", images: [] });
      setShowAddModal(false);
      openModal({
        title: "Success",
        content: <p>Account added successfully!</p>,
        type: "close",
      });
    } catch (error) {
      console.error("Error saving account:", error);
      openModal({
        title: "Error",
        content: <p>Failed to save the account. Please try again.</p>,
        type: "close",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full min-h-screen px-4 md:px-20 lg:px-40 py-10 transition-all duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Account ID..."
          className={`w-full border px-4 py-2 rounded-lg ${isDarkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" : "bg-white border-gray-300 text-black"}`}
        />
      </div>

      {/* Account Cards */}
      {accounts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {accounts
            .filter((acc) =>
              acc.id.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((acc) => (
              <div
                key={acc.id}
                onClick={() => navigate(`/ml-acc/${acc.id}`)}
                className={`cursor-pointer rounded-xl border shadow transition-transform duration-300 group hover:shadow-xl hover:-translate-y-1 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 hover:border-blue-400"
                    : "bg-white border-gray-200 hover:border-blue-500"
                }`}
              >
                <div className="relative w-full h-40 rounded-t-xl overflow-hidden">
                  <img
                    src={acc.img1}
                    alt={acc.description}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
                  />
                </div>

                <div className="p-4 flex flex-col justify-between flex-grow">
                  <div className="mb-2">
                    <h3 className={`text-lg font-semibold italic line-clamp-2 transition group-hover:text-blue-500 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                      {acc.description}
                    </h3>
                    <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>ID: {acc.id}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-blue-500 text-xl font-bold">₹{acc.price}</span>
                    <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded font-semibold">
                      Posted by: {acc.postedBy}
                    </span>
                  </div>

                  {user?.role === "admin" && (
                    <div className="mt-3">
                      <button
                        className="w-full bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAccount(acc.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No accounts available.</p>
      )}

      {/* Add Account Button */}
      {user?.role === "admin" && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Account
          </button>
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-60 z-50 flex justify-center items-center">
          <div className={`rounded-lg p-6 w-full max-w-lg space-y-4 relative ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-2 right-3 text-xl text-gray-400 hover:text-white"
            >
              ×
            </button>
            <h2 className="text-xl font-bold">Add New Account</h2>

            <input
              type="text"
              placeholder="Description"
              className={`w-full border px-3 py-2 rounded ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              value={newAccount.description}
              onChange={(e) =>
                setNewAccount({ ...newAccount, description: e.target.value })
              }
            />

            <label className="block text-sm font-semibold">Main Image (Thumbnail)</label>
            <input
              type="file"
              accept="image"
              id="mainImageInput"
              className="hidden bg-gray-100"
              onChange={(e) =>
                setNewAccount({ ...newAccount, img1: e.target.files[0] })
              }
            />
            <label
  htmlFor="mainImageInput"
  className={`inline-block cursor-pointer px-4 py-2 rounded font-semibold text-center ${
    isDarkMode
      ? "bg-gray-700 text-white hover:bg-gray-600"
      : "bg-blue-500 text-white hover:bg-blue-600"
  }`}
>
  Choose Image
</label>

            <label className="block text-sm font-semibold">Additional Images</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="imageInput"
              multiple
              onChange={(e) =>
                setNewAccount({ ...newAccount, images: Array.from(e.target.files) })
              }
            />
                        <label
  htmlFor="imageInput"
  className={`inline-block cursor-pointer px-4 py-2 rounded font-semibold text-center ${
    isDarkMode
      ? "bg-gray-700 text-white hover:bg-gray-600"
      : "bg-blue-500 text-white hover:bg-blue-600"
  }`}
>
  Choose Images
</label>

            <input
              type="number"
              placeholder="Price (Rs)"
              className={`w-full border px-3 py-2 rounded ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              value={newAccount.price}
              onChange={(e) =>
                setNewAccount({ ...newAccount, price: e.target.value })
              }
            />

            <button
              disabled={loading}
              className={`w-full py-2 rounded ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
              onClick={handleSaveAccount}
            >
              {loading ? "Please wait a while..." : "Save Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountAuction;
