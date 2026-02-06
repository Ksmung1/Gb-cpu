import React, { useState, useEffect } from "react";
import { db,storage } from "../../configs/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useDarkMode } from "../../context/DarkModeContext";

const AdminBanner = () => {
  const [currentBanner, setBannerUrl] = useState(null);
            
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const {isDarkMode} = useDarkMode()

useEffect(() => {
          const fetchBanner = async () => {
          const docRef = doc(db, "config", "siteStatus");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
          const data = docSnap.data();
          setBannerUrl(data.siteBanner); // Ensure your Firestore has this field
          } else {
           console.error("siteStatus doc does not exist");
          }
          };
          
          fetchBanner();
}, []);
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const uploadBanner = async () => {
    if (!file) return alert("Select a banner image first!");

    const storageRef = ref(storage, `siteBanners/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await setDoc(doc(db, "config", "siteStatus"), {
          siteBanner: downloadURL,
        }, { merge: true });
        alert("Banner updated successfully!");
        setUploading(false);
        setFile(null);
        setPreview(null);
      }
    );
  };

return (
  <div
    className={`p-6 rounded-xl shadow-md max-w-xl mx-auto mt-10 ${
      isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
    }`}
  >
    <h2 className="text-xl font-semibold mb-4">Change Site Banner</h2>

    <div>
      <p>Current Banner</p>
      <div
        className={`h-55 mb-10 w-full items-center flex object-cover overflow-hidden rounded-lg border p-1 shadow ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <img
          className="w-full h-full rounded-lg"
          src={currentBanner}
          alt="Current Banner"
        />
      </div>
    </div>

    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="mb-4 hidden"
      id="banner"
    />

    <label
      htmlFor="banner"
      className={`p-2 rounded-md font-semibold mr-10 cursor-pointer transition ${
        isDarkMode
          ? "bg-gray-700 text-white hover:bg-gray-600"
          : "bg-gray-300 text-black hover:bg-gray-400"
      }`}
    >
      Choose file
    </label>

    {preview && (
      <div className="mb-4">
        <img
          src={preview}
          alt="Preview"
          className="w-full max-h-64 object-cover rounded-lg border"
        />
      </div>
    )}

    <button
      onClick={uploadBanner}
      disabled={uploading}
      className={`px-5 py-2 rounded transition font-semibold ${
        uploading
          ? "cursor-not-allowed opacity-70"
          : "hover:opacity-90"
      } ${
        isDarkMode
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {uploading ? `Uploading ${uploadProgress}%...` : "Upload Banner"}
    </button>
  </div>
);

};

export default AdminBanner;
