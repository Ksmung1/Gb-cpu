// src/components/blogs/AddBlogForm.jsx
import React, { useState, useCallback } from "react";
import { useDarkMode } from "../../context/DarkModeContext";
import Cropper from "react-easy-crop";
import { FiUpload, FiCrop, FiCheck, FiX, FiSquare, FiSmartphone, FiMonitor } from "react-icons/fi";

const ASPECT_RATIOS = [
  { label: "Square", icon: FiSquare, value: 1 },
  { label: "Portrait", icon: FiSmartphone, value: 4 / 5 },
  { label: "Landscape", icon: FiMonitor, value: 16 / 9 },
  { label: "Free", icon: FiCrop, value: null },
];

const AddBlogForm = ({ onClose, addPost }) => {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null); // base64
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(1); // default: square
  const [uploading, setUploading] = useState(false);
  const { isDarkMode } = useDarkMode();

  // Step 1: File → base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setCropping(true);
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Crop complete
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Step 3: Crop using canvas (inline)
  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(URL.createObjectURL(blob));
      }, "image/jpeg", 0.95);
    });
  };

  // Step 4: Done cropping
  const handleCropDone = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      setImage(croppedImage);
      setCropping(false);
    } catch (err) {
      alert("Cropping failed");
    }
  };

  // Step 5: Upload to Cloudinary
  const uploadToCloudinary = async (dataUrl) => {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "gamebar-blogs");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dxovlosdf/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");
    return data.secure_url;
  };

  // Final Submit
  const handleSubmit = async () => {
    if (!caption || !image) return;
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(image);
      await addPost(caption, imageUrl);
      onClose();
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Main Form */}
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div
          className={`${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          } rounded-xl p-6 max-w-md w-full shadow-2xl`}
        >
          <h3 className="text-xl font-bold mb-4">Create Post</h3>

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            className={`w-full p-3 border rounded-lg mb-3 resize-none ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            rows="3"
          />

          {/* Upload */}
          {!image && (
            <label className="block">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDarkMode
                    ? "border-gray-600 hover:border-gray-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <FiUpload className="mx-auto text-3xl mb-2" />
                <p className="text-sm">Click to upload</p>
              </div>
            </label>
          )}

          {/* Final Preview */}
          {image && !cropping && (
            <div className="mb-3">
              <img
                src={image}
                alt="final"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setCropping(true)}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <FiCrop /> Re-crop
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {uploading ? "Uploading..." : <><FiCheck /> Post</>}
                </button>
              </div>
            </div>
          )}

          {/* Cancel */}
          <button
            onClick={onClose}
            className={`mt-3 w-full py-2 rounded-lg transition-all ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Cropper Modal */}
      {cropping && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col p-4">
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden mb-4">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setAspect(ratio.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  aspect === ratio.value
                    ? "bg-blue-600 text-white"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                <ratio.icon className="w-4 h-4" />
                {ratio.label}
              </button>
            ))}
          </div>

          {/* Zoom + Controls */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={handleCropDone}
              className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <FiCheck /> Done
            </button>
            <button
              onClick={() => {
                setCropping(false);
                setImage(null);
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"
            >
              <FiX /> Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddBlogForm;