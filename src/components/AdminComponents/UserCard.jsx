import React, { useState } from "react";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth, storage } from "../../configs/firebase"; // make sure to export storage
import { useModal } from "../../context/ModalContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAlert } from "../../context/AlertContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const groupStyleMap = {
  admin: "bg-yellow-100 border-yellow-400",
  vip: "bg-purple-100 border-purple-400",
  prime: "bg-red-100 border-red-400",
  reseller: "bg-blue-100 border-blue-400",
  customer: "bg-white border-gray-300",
  default: "bg-white border-gray-200",
};
const rolesList = ["vip", "reseller", "customer", "prime", 'api'];

const UserCard = ({
  user,
  stats,
  visibleRoleFilter = null,
  expanded,
  onToggle,
}) => {
  const [isBlocked, setIsBlocked] = useState(user.isBlocked || false);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [changingRole, setChangingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role || "customer");
  const { openModal } = useModal();
  const [messageModal, setMessageModal] = useState(false);
  const { isDarkMode } = useDarkMode();

  // New states for image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const total = stats.totalOrders || 0;
  const completed = stats.completedOrders || 0;
  const successRate =
    total > 0 ? ((completed / total) * 100).toFixed(2) : "0.00";

  if (visibleRoleFilter && user?.role !== visibleRoleFilter) return null;

  const handleBlockToggle = async () => {
    if (user?.id === auth.currentUser?.uid) {
      openModal({
        title: "Failed",
        content: <p>You cannot block yourself!</p>,
        type: "close",
      });
      return;
    }

    if (user?.role === "admin") {
      openModal({
        title: "Failed",
        content: <p>You cannot block an admin!</p>,
        type: "close",
      });
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        isBlocked: !isBlocked,
      });
      setIsBlocked((prev) => !prev);
    } catch (err) {
      console.error("Failed to update block status:", err);
      openModal({
        title: "Error",
        content: <p>Failed to update block status.</p>,
        type: "close",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection & preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
    }
  };

  // Upload image to Firebase Storage and return URL
  const uploadImageAndGetURL = async (file) => {
    const storageRef = ref(storage, `user-message-images/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSendToFirebase = async (title, content) => {
    if (!title.trim() && !content.trim() && !imageFile) {
      showAlert("Please enter a title, message, or attach an image.");
      return;
    }

    setLoading(true);

    try {
      const fromUserId = auth.currentUser.uid;
      const fromUserRef = doc(db, "users", fromUserId);
      const fromUserSnap = await getDoc(fromUserRef);

      if (!fromUserSnap.exists()) {
        showAlert("Sender information not found.");
        setLoading(false);
        return;
      }

      const fromUserData = fromUserSnap.data();
      const fromUserName =
        fromUserData.username || fromUserData.email || "Unknown";

      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImageAndGetURL(imageFile);
      }

      await addDoc(collection(db, "messages"), {
        recipientId: user.id,
        recipientName: user.username,
        senderId: fromUserId,
        senderName: fromUserName,
        title,
        body: content,
        imageUrl,
        timestamp: serverTimestamp(),
        read: false,
        type: messageType || "normal",
      });

      showAlert("Message sent!");
      setMessageContent("");
      setMessageTitle("");
      setMessageType("");
      setImageFile(null);
      setImagePreviewUrl(null);
      setMessageModal(false);
    } catch (error) {
      console.error("Error sending message:", error);
      showAlert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    setMessageModal(!messageModal);
  };

  const handleRoleChange = async () => {
    try {
      setLoading(true);
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { role: selectedRole });
      openModal({
        title: "Success",
        content: (
          <p>
            Role updated to <strong>{selectedRole}</strong>.
          </p>
        ),
        type: "close",
      });
    } catch (err) {
      console.error("Failed to change role:", err);
      openModal({
        title: "Error",
        content: <p>Could not update role.</p>,
        type: "close",
      });
    } finally {
      setLoading(false);
      setChangingRole(false);
    }
  };

  const role = user?.role?.toLowerCase() || "default";
  const roleClasses = groupStyleMap[role] || groupStyleMap.default;

  return (
    <div
      className={`border rounded-2xl p-4 transition cursor-pointer hover:shadow-lg space-y-3 ${
        isDarkMode
          ? "bg-gray-800 text-gray-100 border-gray-700"
          : "bg-white text-gray-900 border-gray-200"
      }`}
      onClick={onToggle}
    >
      {/* Top Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src={user?.photoURL || "/default-avatar.png"}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-xs">
              {user?.username || "N/A"}{" "}
              <span className="text-blue-400 text-xs font-normal">
                ({user?.role})
              </span>
            </span>
            {user?.balance ? <p className="text-sm"><strong>Balance: </strong>₹{user?.balance}</p> : ""}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBlockToggle();
            }}
            disabled={loading}
            className={`text-xs px-3 py-1 rounded-full font-medium transition shadow-sm ${
              isBlocked
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {loading ? "..." : isBlocked ? "Unblock" : "Block"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSendMessage();
            }}
            disabled={loading}
            className={`text-xs px-3 py-1 rounded-full font-medium transition shadow-sm  bg-yellow-500 hover:bg-yellow-600 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Send message
          </button>
          {!changingRole ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setChangingRole(true);
              }}
              className={`text-xs px-3 py-1 rounded-full font-medium hover:bg-opacity-80 ${
                isDarkMode
                  ? "bg-gray-700 text-gray-200"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Change Role
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`text-xs border px-2 py-[6px] rounded-md ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                {rolesList.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleChange();
                }}
                className="bg-blue-500 text-white text-xs px-2 py-[6px] rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChangingRole(false);
                }}
                className="bg-red-500 text-white text-xs px-2 py-[6px] rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm rounded-xl p-3 ${
            isDarkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"
          }`}
        >
          <p>
            <strong>Phone:</strong> {user.phone || "N/A"}
          </p>
          <p>
            <strong>Balance:</strong> ₹{user.balance || "0.00"}
          </p>
          <p>
            <strong>UID:</strong> {user.uid || "N/A"}
          </p>
          <p>
            <strong>Total Orders:</strong> {total}
          </p>
          <p>
            <strong>Completed:</strong> {completed}
          </p>
          <p>
            <strong>Success Rate:</strong> {successRate || 0}%
          </p>
        </div>
      )}

      {/* Message Modal */}
      {messageModal && (
        <div
          className="fixed inset-0 backdrop-blur bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setMessageModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-xl p-5 shadow-lg relative ${
              isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMessageModal(false)}
              className="absolute top-2 right-2 text-xl font-bold hover:text-red-500"
            >
              &times;
            </button>

            <h2 className="text-lg font-semibold mb-4">
              Send Message to {user.username}
            </h2>

            <label className="text-sm font-medium">Title:</label>
            <input
              type="text"
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              className={`w-full px-3 py-2 mb-3 mt-1 rounded border outline-none focus:ring-2 text-sm ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-400"
                  : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500"
              }`}
              placeholder="Enter message title..."
            />

            <label className="text-sm font-medium">Message:</label>
            <textarea
              rows={4}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className={`w-full px-3 py-2 mt-1 rounded border outline-none resize-none text-sm ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-400"
                  : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500"
              }`}
              placeholder="Type your message here..."
            />

            {/* Image Upload */}
            <label className="text-sm font-medium mt-4 block">Attach Image (optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-3"
            />
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="mb-3 max-w-xs rounded shadow border"
              />
            )}

            <label className="text-sm font-medium mt-4 block">Message Type:</label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className={`w-full px-3 py-2 mt-1 rounded border text-sm outline-none ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-400"
                  : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500"
              }`}
            >
              <option value="normal">Normal</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
            </select>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSendToFirebase(messageTitle, messageContent)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;
