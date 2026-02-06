import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {getCroppedImg} from "../BrowseComponents/Collage/helper/cropImage.js"
import { db } from "../../configs/firebase.jsx";
import { addDoc, collection } from "firebase/firestore";
import { useModal } from "../../context/ModalContext.jsx";
const CLOUDINARY_UPLOAD_PRESET = "skinsassets";   // 👈 your new preset
const CLOUDINARY_CLOUD_NAME = "drqosjiqm";       // 👈 your new cloud name

const UploadSkins = ({open, onClose }) => {
          if(!open) return null;
  const [formData, setFormData] = useState({
    name: "",
    hero: "",
    family: "",
    points: "4000",
    role: "fighter",
    imageUrl: "",
  });

  const [customPoints, setCustomPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert, ModalComponent } = useModal();

  // Image cropping
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // File → DataURL
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };
  // Inside UploadSkins component

// Add this helper to generate random names
const randomString = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Bulk folder upload handler
const handleFolderUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  setLoading(true);

  try {
    for (const file of files) {
      const imageDataUrl = await readFile(file);

      // Cropper skipped, directly upload the original image
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.append("folder", "skins")

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: form }
      );
      const data = await res.json();

      // Firestore payload with default values
      const payload = {
        name: "Skin_" + randomString(),
        hero: "Hero_" + randomString(),
        family: "",             // optional, empty by default
        points: "4000",
        role: "fighter",        // default role
        type: "legend",
        imageUrl: data.secure_url,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "skins"), payload);
    }

    showAlert(`${files.length} skins uploaded successfully!`);
    onClose();
  } catch (err) {
    console.error("Bulk upload failed:", err);
    showAlert("Bulk upload failed. Try again.");
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

  // Upload cropped image to Cloudinary
  const uploadCroppedImage = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const form = new FormData();
      form.append("file", croppedImageBlob);
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

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

  // Save to Firestore
  const handleSubmit = async () => {
    if (!formData.imageUrl || !formData.name) {
      showAlert("Please fill all required fields and upload an image.");
      return;
    }

    const payload = {
      name: formData.name,
      hero: formData.hero,
      family: formData.family || "",
      points: customPoints || formData.points,
      role: formData.role,
      type: "skin",
      imageUrl: formData.imageUrl,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "skins"), payload);
      onClose();
    } catch (err) {
      console.error("Firestore Save Error:", err);
      showAlert("Failed to save to database.");
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-96 text-black max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-bold mb-4">Upload Skin</h2>

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
            {/* Name */}
            <input
              type="text"
              placeholder="Skin Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="border p-2 w-full mb-2"
            />

            {/* Hero */}
            <input
              type="text"
              placeholder="Hero Name"
              value={formData.hero}
              onChange={(e) => setFormData((prev) => ({ ...prev, hero: e.target.value }))}
              className="border p-2 w-full mb-2"
            />

            {/* Family dropdown */}
            <select
              value={formData.family || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, family: e.target.value }))}
              className="border p-2 w-full mb-2"
            >
              <option value="">Select Family</option>
              {[
  "11.11",
  "515",
  "Abyss",
  "All Star",
  "Anniversary",
  "AOT",
  "Aspirant",
  "Atomic pop",
  "Blazing",
  "Champions",
  "Chrismas",
  "Clouds",
  "Collector",
  "Covenant",
  "Create",
  "Dawning",
  "Dino",
  "Dragon tamer",
  "Ducati",
  "Elite",
  "Epic",
  "Exorcist",
  "Finals MVP",
  "Golden Month",
  "Golden Starlight",
  "Halloween",
  "HxH",
  "JJK",
  "Kishin",
  "KOF",
  "Kung Fu Panda",
  "Legends",
  "Lightborn",
  "Limited skins",
  "Luckybox",
  "Lunarfest",
  "M Series",
  "M World",
  "MCGG skins",
  "Meow",
  "Mist Benders",
  "MPL Skins",
  "MSC Skins",
  "Myth Skins",
  "Naruto",
  "Neobeast",
  "Neymar",
  "Normal Skins",
  "Pacquiao Licensed Skin",
  "Prime",
  "Rising",
  "S.A.B.E.R",
  "Saint Saiya",
  "Sanrio",
  "Season Skins",
  "Soul Vessel",
  "Sparkle",
  "Special",
  "Star wars",
  "Starlight Skins",
  "Stun",
  "Summer",
  "Transformer",
  "Valentines",
  "Venom",
  "Zenith",
  "Zodiac",
]
.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>

            {/* Role dropdown */}
            <select
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              className="border p-2 w-full mb-2"
            >
              {["fighter", "mage", "assassin", "tank", "support", "marksman"].map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>

            {/* Points dropdown */}
            <div className="flex gap-2 mb-2">
              <select
                value={formData.points}
                onChange={(e) => setFormData((prev) => ({ ...prev, points: e.target.value }))}
                className="border p-2 flex-1"
              >
                {["4000", "3000", "2000", "1000", "400", "200", "40"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
              {formData.points === "custom" && (
                <input
                  type="number"
                  placeholder="Custom Points"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  className="border p-2 w-24"
                />
              )}
            </div>

            {/* File input */}
            <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2" />

            {/* Preview */}
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded mb-2" />
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-400 rounded text-white">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 rounded text-white">
                Save
              </button>
            </div>
          </>
        )}
      </div>
      {/* Folder Upload Button */}
<div className="mb-2">
  <label className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer">
    Upload Folder
    <input
      type="file"
      webkitdirectory="true"
      directory="true"
      multiple
      onChange={handleFolderUpload}
      className="hidden"
      accept="image/*"
    />
  </label>
</div>

      {ModalComponent}
    </div>
  );
};

export default UploadSkins;
