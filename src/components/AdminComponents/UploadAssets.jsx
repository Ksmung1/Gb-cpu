import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../BrowseComponents/Collage/helper/cropImage";
import { db } from "../../configs/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useModal } from "../../context/ModalContext";
const CLOUDINARY_UPLOAD_PRESET = "skinsassets";   // 👈 your new preset
const CLOUDINARY_CLOUD_NAME = "drqosjiqm";     

const UploadAssets = ({ open,onClose }) => {
                    if(!open) return null;

  const [formData, setFormData] = useState({
    name: "",
    assetType: "emote",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const { showAlert, ModalComponent } = useModal();

  // Image cropping states
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // File input → cropper
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };

  // Upload cropped image
  const uploadCroppedImage = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const form = new FormData();
      form.append("file", croppedImageBlob);
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.append("folder", "assets")


      setLoading(true);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: form }
      );

      const data = await res.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.secure_url }));
      setImageSrc(null);
    } catch (error) {
      console.error("Upload failed:", error);
      showAlert("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  function readFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.readAsDataURL(file);
    });
  }

  // Save to Firestore
  const handleSubmit = async () => {
    if (!formData.imageUrl || !formData.name) {
      showAlert("Please fill all required fields and upload an image.");
      return;
    }

    const payload = {
      name: formData.name,
      assetType: formData.assetType,
      type: "asset",
      imageUrl: formData.imageUrl,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "assets"), payload);
      onClose();
    } catch (err) {
      console.error("Firestore Save Error:", err);
      showAlert("Failed to save to database.");
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-96 text-black max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-bold mb-4">Upload Asset</h2>

        {imageSrc ? (
          <>
            <div className="relative w-full h-64 bg-gray-200">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={uploadCroppedImage}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Cropped"}
              </button>
              <button
                onClick={() => setImageSrc(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Common fields for Asset */}
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="border p-2 w-full mb-2"
            />

            <select
              value={formData.assetType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assetType: e.target.value }))
              }
              className="border p-2 w-full mb-2"
            >
              {["emote", "recall", "notification", "chatbox", "elimination"].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                )
              )}
            </select>

            {/* File input */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-2"
            />

            {/* Preview */}
            {formData.imageUrl && (
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-full h-40 object-cover rounded mb-2"
              />
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-400 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 rounded text-white"
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
      {ModalComponent}
    </div>
  );
};

export default UploadAssets;
