import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";
import { formatDistanceToNow } from "date-fns";
import { useDarkMode } from "../../context/DarkModeContext";
import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMsg, setExpandedMsg] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate()

    if (!user) {return (
          <div className={`max-w-2xl h-[90vh] mx-auto p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
                    You do not have any messages. <p onClick={()=>navigate('/login')}>Log in.</p>
          </div>    )};

  useEffect(() => {

    const q = query(collection(db, "messages"), where("recipientId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());

      setMessages(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

const getEmojiForType = (type) => {
  switch (type) {
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
    case "normal":
    default:
      return "📬";
  }
};
  const handleExpand = async (msg) => {
    setExpandedMsg(msg);

    if (!msg.read) {
      try {
        await updateDoc(doc(db, "messages", msg.id), { read: true });
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    }
  };

  const handleCloseModal = () => setExpandedMsg(null);

  const deleteAll = async () => {
    const readableMsgs = messages.filter((m) => m.read);
    const promises = readableMsgs.map((msg) => deleteDoc(doc(db, "messages", msg.id)));
    await Promise.all(promises);
    setShowDeleteModal(false);
  };

  if (loading)
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading messages...</div>;
return (
  <div className={`max-w-2xl h-[90vh] mx-auto p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-xl font-bold">Messages</h1>
      {messages.length > 0 && (
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-sm px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Delete All Read
        </button>
      )}
    </div>

    {messages.length === 0 ? (
      <p className="text-gray-500 dark:text-gray-400">No messages found.</p>
    ) : (
      <ul className="space-y-2">
        {messages.map((msg) => (
          <li
            key={msg.id}
            onClick={() => handleExpand(msg)}
            className={`p-3 rounded-lg border cursor-pointer transition shadow-sm ${
              isDarkMode
                ? msg.read
                  ? "bg-gray-900 border-gray-700"
                  : "bg-blue-900 border-blue-600"
                : msg.read
                ? "bg-white border-gray-300"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-medium">{msg.title || "(No Title)"}</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : "Unknown"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    )}

   <Dialog open={!!expandedMsg} onClose={handleCloseModal} className="fixed z-30 inset-0 overflow-y-auto">
  <div className="flex items-center justify-center min-h-screen px-4">
    <Dialog.Panel
      className={`w-full max-w-md p-6 rounded-xl shadow-xl border ${
        isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
      }`}
    >
<Dialog.Title className="text-lg capitalize font-bold mb-3">
  {getEmojiForType(expandedMsg?.type)} {expandedMsg?.title || "(No Title)"}
</Dialog.Title>


      <div className="text-sm mb-4 space-y-1">
        <p>
          <strong>To:</strong> {expandedMsg?.recipientName || "You"}
        </p>
        <p className="text-xs text-gray-400">
          {expandedMsg?.timestamp
            ? formatDistanceToNow(expandedMsg.timestamp.toDate(), { addSuffix: true })
            : "Unknown time"}
        </p>
      </div>

          {expandedMsg?.imageUrl && (
          <img
          src={expandedMsg.imageUrl}
          alt="Message Attachment"
          className="mb-4 max-w-full rounded shadow"
          />
          )}
          
      <div className="text-base mb-4 whitespace-pre-wrap leading-relaxed">
        {expandedMsg?.body || "(No Content)"}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCloseModal}
          className={`mt-2 px-4 py-1 rounded text-sm ${
            isDarkMode
              ? "bg-gray-600 hover:bg-gray-700 text-white"
              : "bg-gray-300 hover:bg-gray-400 text-black"
          }`}
        >
          Close
        </button>
      </div>
    </Dialog.Panel>
  </div>
</Dialog>


    {/* Delete Confirmation Modal */}
    <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="fixed z-40 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel
          className={`max-w-sm w-full rounded-lg p-6 shadow-lg ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          }`}
        >
          <Dialog.Title className="font-bold text-lg mb-2">Confirm Deletion</Dialog.Title>
          <p className="mb-4 text-sm">Are you sure you want to delete all <strong>read</strong> messages?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className={`px-4 py-1 rounded text-sm ${
                isDarkMode
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-black"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={deleteAll}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  </div>
);
};

export default Messages;
