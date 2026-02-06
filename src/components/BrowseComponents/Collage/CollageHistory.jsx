import React, { useEffect, useState } from "react";
import { Download, Trash2, Camera, Clock } from "lucide-react";
import { auth,db } from "../../../configs/firebase";
import { doc, onSnapshot, updateDoc, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import useModal from "../../../context/useModal";
const CollageHistory = () => {
  const navigate = useNavigate();
  const { showAlert, showConfirm, ModalComponent } = useModal();

  const [collageUrls, setCollageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setCollageUrls([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);
useEffect(() => {
  if (!user) return;
  setLoading(true);

  const userDocRef = doc(db, "users", user.uid);

  const unsubscribe = onSnapshot(
    userDocRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let urls = Array.isArray(data.savedCollageUrls) ? data.savedCollageUrls : [];

        // Keep only the latest 5
        if (urls.length > 5) {
          const latest5 = urls.slice(-5); // last 5
          const oldUrls = urls.slice(0, -5); // older ones

          try {
            await updateDoc(userDocRef, { savedCollageUrls: latest5 });
            // optional: you can also delete old images from storage if needed
          } catch (err) {
            console.error("Failed to trim old collages:", err);
          }

          urls = latest5;
        }

        setCollageUrls(urls.slice().reverse());
      } else {
        setCollageUrls([]);
      }
      setLoading(false);
    },
    (err) => {
      console.error("Error fetching collages:", err);
      showAlert("Failed to load collage history.");
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, [user]);

  const handleDownload = async (url) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "mlbb-collage.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleDelete = async (url) => {
    const confirmDelete = await showConfirm("Are you sure you want to delete this collage?");
    if (!confirmDelete) return;

    if (!user) {
      showAlert("Please log in to delete collages.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { savedCollageUrls: arrayRemove(url) });
    } catch (err) {
      console.error("Delete failed:", err);
      showAlert("Failed to delete collage.");
    }
  };

  // ---------- UI States ----------

  if (loading) {
    return (
      <div className="min-h-screen  mx-auto bg-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full w-16 h-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg font-medium">Loading your collage history...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen mx-auto bg-blue-950 flex items-center justify-center px-4">
        <div className="text-center  bg-blue-900 shadow-lg rounded-2xl p-8 border border-blue-800">
          <Camera className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Please Log In</h3>
          <p className="text-gray-400 mb-4">You need to log in to see your collages.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow-md transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (collageUrls.length === 0) {
    return (
      <div className="min-h-screen  mx-auto bg-blue-950 flex items-center justify-center px-4">
        <div className="text-center  bg-blue-900 shadow-lg rounded-xl p-8 border border-blue-800">
          <Camera className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No Collages Saved</h3>
          <p className="text-gray-400">Start creating some collages and they will show up here!</p>
        </div>
      </div>
    );
  }

  // ---------- Main Render ----------
  return (
    <div className="min-h-screen py-8 mx-auto px-2">
      <div className="mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-white">Your Collage History</h1>
          </div>
          <p className="text-gray-300 text-lg">
            {collageUrls.length} collage{collageUrls.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {collageUrls.map((url, idx) => (
            <div
              key={url}
              className="group rounded-md border border-gray-900 shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              {/* Image */}
              <div className="relative overflow-hidden w-full">
                <img
                  src={url}
                  alt={`Collage ${idx + 1}`}
                  className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => handleDownload(url)}
                    className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(url)}
                    className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200 ml-3"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 font-medium">Collage #{collageUrls.length - idx}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(url)}
                      className="bg-green-600/20 hover:bg-green-600 text-green-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(url)}
                      className="bg-red-600/20 hover:bg-red-600 text-red-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {ModalComponent}
    </div>
  );
};

export default CollageHistory;
