import React, { useState } from "react";
import UserCard from "./UserCard";
import { useDarkMode } from "../../context/DarkModeContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { storage } from "../../configs/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAlert } from "../../context/AlertContext";

const UserList = ({ users, userStats, search }) => {
  const [searchTerm, setSearchTerm] = useState(search || "");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const { isDarkMode } = useDarkMode();
  const [BulkModal, setBulkModal] = useState(false);
  const { showAlert } = useAlert();
  const roles = ["", "admin", "vip", "reseller", "customer", "prime", 'api'];
  const [expandedUserId, setExpandedUserId] = useState(null);

  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkMessageType, setBulkMessageType] = useState("normal");
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "" ||
      (selectedRoleFilter === "customer"
        ? user.role === "customer" || !("role" in user) || user.role == null || user.role === "Customer"
        : user.role === selectedRoleFilter);
    console.log({
      userId: user.uid,
      username: user.username,
      role: user.role,
      hasRoleProperty: "role" in user,
      matchesRole,
      matchesSearch,
    });
    return matchesSearch && matchesRole;
  });

  const sendMessageToAll = async () => {
    if (!bulkMessage.trim()) return;
    setSending(true);

    let imageUrl = null;

    try {
      if (imageFile) {
        const imageRef = ref(storage, `bulkMessages/${Date.now()}-${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const promises = filteredUsers.map((recipient) =>
        addDoc(collection(db, "messages"), {
          recipientId: recipient.uid,
          recipientName: recipient.username,
          senderId: "system",
          senderName: "Admin",
          title: `Important Information - ${bulkMessageType.charAt(0).toUpperCase() + bulkMessageType.slice(1)}`,
          body: bulkMessage,
          type: bulkMessageType,
          timestamp: serverTimestamp(),
          read: false,
          imageUrl: imageUrl || null,
        })
      );

      await Promise.all(promises);
      showAlert("Messages sent to all filtered users!");
      setBulkMessage("");
      setSelectedRoleFilter("");
      setImageFile(null);
    } catch (error) {
      console.error("Error sending bulk messages:", error);
      alert("Failed to send messages. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className={`flex flex-col md:flex-row gap-3 mb-4 p-2 rounded ${isDarkMode ? "bg-gray-900" : ""}`}>
        <input
          type="text"
          placeholder="Search user by username or UID"
          className={`border px-3 py-2 w-full ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-700"}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className={`border px-3 py-2 w-full md:w-1/3 ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300 text-gray-900"}`}
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.filter((r) => r !== "").map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {BulkModal ? (
        <div className={`mb-6 p-4 rounded shadow ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <label className="block font-medium mb-1" htmlFor="bulk-message">
            Message to send to all filtered users:
          </label>
          <textarea
            id="bulk-message"
            rows={3}
            value={bulkMessage}
            onChange={(e) => setBulkMessage(e.target.value)}
            className={`w-full p-2 rounded border resize-none mb-3 text-sm outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400" : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500"}`}
            placeholder="Type your bulk message here..."
          />

          <label className="block font-medium mb-1" htmlFor="bulk-message-type">
            Message Type:
          </label>
          <select
            id="bulk-message-type"
            value={bulkMessageType}
            onChange={(e) => setBulkMessageType(e.target.value)}
            className={`w-full p-2 rounded border mb-4 text-sm outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-400" : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500"}`}
          >
            <option value="normal">Normal</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
          </select>

          <label className="block font-medium mb-1">Attach Image (optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className={`w-full mb-3 text-sm ${isDarkMode ? "text-white" : "text-black"}`}
          />

          {imageFile && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="max-w-xs rounded shadow"
              />
            </div>
          )}

          <button
            disabled={sending || !bulkMessage.trim() || filteredUsers.length === 0}
            onClick={() => setShowConfirmModal(true)}
            className={`px-4 py-2 rounded text-white font-semibold transition ${sending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {sending ? "Sending..." : `Send to All (${filteredUsers.length})`}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setBulkModal(!BulkModal)}
          className={`px-4 py-2 rounded-md font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDarkMode
              ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-gray-900"
              : "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400 focus:ring-offset-white"
          }`}
        >
          Send Bulk Message
        </button>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-blue-200"}`}>
        {filteredUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            expanded={expandedUserId === user.uid}
            onToggle={() => setExpandedUserId((prev) => (prev === user.uid ? null : user.uid))}
            stats={userStats[user.id] || {}}
            visibleRoleFilter={""}
          />
        ))}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-40">
          <div className={`p-6 rounded shadow-lg max-w-sm w-full ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
            <h3 className="text-lg font-bold mb-4">Confirm Send</h3>
            <p className="mb-4">
              Send this message to <strong>{filteredUsers.length}</strong> user{filteredUsers.length !== 1 ? "s" : ""}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`px-4 py-2 rounded ${isDarkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Cancel
              </button>
              <button
                disabled={sending || !bulkMessage.trim()}
                onClick={() => {
                  setShowConfirmModal(false);
                  sendMessageToAll();
                }}
                className={`px-4 py-2 rounded text-white ${sending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserList;