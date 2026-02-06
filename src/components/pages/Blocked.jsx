import React, { useEffect, useState } from "react";
import { useDarkMode } from "../../context/DarkModeContext";
import { useUser } from "../../context/UserContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { formatDistanceToNow } from "date-fns";

const Blocked = () => {
  const phoneNumber = "7005549898";
  const whatsappMessage = encodeURIComponent("Sorry sir, I will not do again. You are sigma.");
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Query unread messages for the user (you can remove read filter if want all)
    const q = query(
      collection(db, "messages"),
      where("recipientId", "==", user.uid),
      // To get unread messages only:
      // where("read", "==", false),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div
      className={`flex flex-col items-center justify-start min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="text-8xl mb-6">💩</div>
      <h1 className="text-3xl font-bold mb-4">You are blocked</h1>
      <p className="text-center mb-6 max-w-sm">
        Sorry, your account has been blocked. If you believe this is a mistake or want to resolve the issue, please contact the admin.
      </p>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md transition mb-10"
      >
        Contact Admin on WhatsApp
      </a>

      <div className="max-w-2xl w-full">
        <h2 className="text-xl font-semibold mb-4">Your Messages</h2>

        {loading && <p>Loading messages...</p>}

        {!loading && messages.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">No messages found.</p>
        )}

        {!loading && messages.length > 0 && (
          <ul className="space-y-6">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={`p-4 rounded-lg border shadow-sm ${
                  isDarkMode
                    ? msg.read
                      ? "bg-gray-800 border-gray-700"
                      : "bg-blue-900 border-blue-600"
                    : msg.read
                    ? "bg-white border-gray-300"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                {/* Show image if available */}
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Message attachment"
                    className="mb-3 max-h-48 w-full object-contain rounded"
                    loading="lazy"
                  />
                )}

                <h3 className="font-semibold text-lg mb-1">{msg.title || "(No Title)"}</h3>

                <p className="text-xs text-gray-400 mb-2">
                  {msg.timestamp
                    ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })
                    : "Unknown time"}
                </p>

                <p className="whitespace-pre-wrap">{msg.body || "(No Content)"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Blocked;
