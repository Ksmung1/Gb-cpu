// src/components/pages/UserProfile.js
import React, { useState, useEffect, useRef } from "react";
import backgroundDoodle from "../../assets/images/background-doodle2.avif";
import profileDoodle from "../../assets/images/doodles2.avif";
import { useUser } from "../../context/UserContext";
import { FaUserShield, FaHandshake, FaRegEdit, FaCrown, FaLock } from "react-icons/fa";
import { HiOutlineUser } from "react-icons/hi";
import { BsCopy, BsStars } from "react-icons/bs";
import { doc, updateDoc, serverTimestamp, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useDarkMode } from "../../context/DarkModeContext";
import Cropper from "react-easy-crop";

const CLOUDINARY_CLOUD_NAME = "drqosjiqm";
const UPLOAD_PRESET = "gamebar-profiles";

const COOLDOWN_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const countryCodes = [
  { code: "+63", name: "Philippines" },
  { code: "+62", name: "Indonesia" },
  { code: "+91", name: "India" },
  { code: "+60", name: "Malaysia" },
  { code: "+65", name: "Singapore" },
  { code: "+66", name: "Thailand" },
  { code: "+84", name: "Vietnam" },
  { code: "+1", name: "USA" },
  { code: "+44", name: "UK" },
  { code: "+55", name: "Brazil" },
];

const UserProfile = () => {
  const { user, setUser } = useUser();
  const { isDarkMode } = useDarkMode();

  const [showEditModal, setShowEditModal] = useState(false);
  const [tempUsername, setTempUsername] = useState(user?.username || "");
  const [tempBio, setTempBio] = useState(user?.bio || "");
  const [tempAvatar, setTempAvatar] = useState(user?.photoURL || profileDoodle);
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);
  const [showDays, setShowDays] = useState(false)
  const [editPhone, setEditPhone] = useState(!user?.phone);
  const [fullPhone, setFullPhone] = useState(user?.phone || "");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");

  // Cropper
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // === SINGLE GLOBAL COOLDOWN ===
  const lastProfileChange = user?.lastProfileChange?.toDate?.() || null;
  const now = Date.now();
  const isPrivileged = ["vip"].includes(user?.role || "");

  const canEditProfile = isPrivileged || !lastProfileChange || (now - lastProfileChange.getTime()) / MS_PER_DAY >= COOLDOWN_DAYS;
  const daysLeft = lastProfileChange
    ? Math.max(0, COOLDOWN_DAYS - Math.floor((now - lastProfileChange.getTime()) / MS_PER_DAY))
    : 0;

  const phoneLocked = !!user?.phone;

  // Save profile + set global cooldown
  const handleSaveProfile = async () => {
    const updates = {};
    if (tempUsername.trim() !== (user.username || "")) updates.username = tempUsername.trim();
    if (tempBio.trim() !== (user.bio || "")) updates.bio = tempBio.trim();
    if (tempAvatar !== (user.photoURL || profileDoodle)) updates.photoURL = tempAvatar;

    if (Object.keys(updates).length === 0) {
      setShowEditModal(false);
      return;
    }

    if (!isPrivileged) {
      updates.lastProfileChange = serverTimestamp();
    }

    await updateDoc(doc(db, "users", user.uid), updates);
    setUser(prev => ({ ...prev, ...updates }));
    setShowEditModal(false);
    setShowConfirmWarning(false);
  };

  const handleSavePhone = async () => {
    if (!phone.trim()) return;
    const combined = `${countryCode}${phone}`;
    await updateDoc(doc(db, "users", user.uid), { phone: combined });
    setFullPhone(combined);
    setUser(prev => ({ ...prev, phone: combined }));
    setEditPhone(false);
  };

  // Phone parsing
  useEffect(() => {
    if (editPhone && fullPhone) {
      const matched = countryCodes.find(c => fullPhone.startsWith(c.code));
      if (matched) {
        setCountryCode(matched.code);
        setPhone(fullPhone.slice(matched.code.length));
      }
    }
  }, [editPhone, fullPhone]);
  const uid = user?.uid

useEffect(() => {
  if (!uid) return;

  const userRef = doc(db, "users", uid);
  const orderRef = collection(db, "users", uid, "orders");

  const unsubscribe = onSnapshot(orderRef, async (snapshot) => {
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const total = docs.length;

    // completed AND not VIP/PRIME/PAY (based on order.id prefix)
    const completedNotVipPrimePay = docs.filter((order) => {
      const isCompleted = order.status === "completed";
      const isSpecial =
        order.id.startsWith("VIP") ||
        order.id.startsWith("PAY") ||
        order.id.startsWith("PRIME");

      return isCompleted && !isSpecial;
    }).length;

    // total cost of all COMPLETED orders (any type)
    const totalEarned = docs.reduce((sum, order) => {
      const isCompleted = order.status === "completed";
      const cost = typeof order.cost === "number" ? order.cost : 0; // change `cost` to your field name

      return isCompleted ? sum + cost : sum;
    }, 0);

    const success = total > 0 ? (completedNotVipPrimePay / total) * 100 : 0;
    const successRate = Math.round(success)

    await updateDoc(userRef, {
      "stats.totalOrders": total,
      "stats.totalEarned": totalEarned,
      "stats.successRate": successRate,
    });
  });

  return () => unsubscribe();
}, [uid, db]);

  // Cropper upload
  const uploadCropped = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setUploading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = imageSrc;
      await new Promise(r => img.onload = r);

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0, 0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.95));
      const form = new FormData();
      form.append("file", blob);
      form.append("upload_preset", UPLOAD_PRESET);
      form.append("folder", "profiles");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error();

      setTempAvatar(data.secure_url);
      setImageSrc(null);
    } catch (e) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <div className="text-center py-10">Loading…</div>;
  const isPrime = user?.role === "prime";

  return (
    <div className={`relative flex flex-col items-center w-full p-4 md:px-20 lg:px-40 min-h-screen ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}>
      {/* Background */}
      <div className="h-48 w-full overflow-hidden flex justify-center rounded-b-3xl shadow-lg">
        <img src={backgroundDoodle} alt="Background" className="w-full object-cover" />
      </div>

      {/* Avatar */}
      <div className={`relative w-28 h-28 rounded-xl flex justify-center items-center mt-[-3rem] ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"} border shadow-lg ${isPrime ? "p-1" : ""}`}>
        {isPrime && <div className="absolute inset-0 rounded-xl border-4 border-yellow-400 shadow-lg animate-pulse"></div>}
        <img src={user.photoURL || profileDoodle} alt="Avatar" className="w-full h-full object-cover rounded-lg z-10" />

        {/* Edit Button or Lock + Tooltip */}
        {canEditProfile ? (
          <button
            onClick={() => setShowEditModal(true)}
            className={`absolute -top-2 -right-2 p-2 rounded-full shadow-lg z-20 transition-all hover:scale-110 ${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
          >
            <FaRegEdit className="text-lg" />
          </button>
        ) : (
          <div className=" group">
            <div onClick={()=>setShowDays(true)} className="absolute -top-2 -right-2 p-2 rounded-full bg-red-600 text-white shadow-lg z-20 cursor-default">
              <FaLock className="text-lg" />
            </div>
          </div>
        )}
      </div>
     {showDays && (
          <div className=" bg-red-600 text-white text-xs px-4 py-2 rounded-lg shadow-2xl whitespace-nowrap z-50 transition-opacity pointer-events-none">
              Profile locked • {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
            </div>
     )}
        

      {/* Username */}
      <div className="mt-8 text-center">
        <h1 className="font-bold text-2xl flex items-center gap-2 justify-center">
          {user.username || "Set Username"}
          {user?.role === "admin" ? <FaUserShield className="text-red-500" /> :
           user?.role === "prime" ? <><FaCrown className="text-yellow-400" /><span className="text-xs text-yellow-400 font-bold">PRIME</span></> :
           user?.role === "vip" ? <BsStars className="text-yellow-400" /> :
           user?.role === "reseller" ? <FaHandshake className="text-yellow-500" /> :
           <HiOutlineUser className="text-blue-600" />}
        </h1>
        <div onClick={() => navigator.clipboard.writeText(user.uid)} className="cursor-pointer flex items-center justify-center gap-1 text-xs text-blue-500 hover:underline mt-2">
          <strong>UID:</strong> {user.uid.slice(0, 12)}... <BsCopy />
        </div>
      </div>

      {/* Bio */}
      <div className="mt-6 w-full max-w-md text-center">
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{user.bio || "No bio available."}</p>
      </div>

      {/* Phone */}
      <div className="mt-4 text-center">
        {editPhone ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <select className={`px-3 py-2 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`} value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                {countryCodes.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
              <input type="text" className={`px-3 py-2 rounded-lg border w-40 text-center ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="Phone" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditPhone(false)} className="px-4 py-2 bg-red-600 text-white rounded">Cancel</button>
              <button onClick={handleSavePhone} disabled={!phone.trim()} className={`px-4 py-2 rounded ${!phone.trim() ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"} text-white`}>Save Forever</button>
            </div>
            <p className="text-xs text-yellow-500 font-bold">This cannot be changed later!</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{fullPhone || "No phone number"}</p>
            {phoneLocked ? <FaLock className="text-green-500" /> : <FaRegEdit className="cursor-pointer" onClick={() => setEditPhone(true)} />}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mt-8 w-full max-w-lg">
        {[
          { label: "Total Orders", value: user?.stats?.totalOrders || 0 },
          { label: "Total Spent", value: `₹${user?.stats?.totalEarned || 0}` },
          { label: "Success Rate", value: `${user?.stats?.successRate || 0}%` },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-lg text-center border shadow ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-300"}`}>
            <p className="font-bold text-lg">{s.value}</p>
            <p className="text-xs opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className={`w-full max-w-lg p-6 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center mb-6">Edit Profile</h2>

            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Choose Avatar</p>
              <div className="grid grid-cols-4 gap-3">
                {[profileDoodle, "https://i.pravatar.cc/150?img=1", "https://i.pravatar.cc/150?img=2", "https://i.pravatar.cc/150?img=3", "https://i.pravatar.cc/150?img=4", "https://i.pravatar.cc/150?img=5"].map(url => (
                  <img key={url} src={url} onClick={() => setTempAvatar(url)} className={`w-16 h-16 rounded-full border-4 cursor-pointer transition ${tempAvatar === url ? "border-green-500" : "border-gray-500"}`} alt="avatar" />
                ))}
                {(user.role === "admin" || user.role === "prime") && (
                  <div onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-full border-4 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-green-500 text-4xl">+</div>
                )}
              </div>
            </div>

            <input value={tempUsername} onChange={e => setTempUsername(e.target.value)} maxLength={15} placeholder="Username" className={`w-full px-4 py-3 rounded-lg border mb-4 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`} />
            <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} rows={3} maxLength={200} placeholder="Bio" className={`w-full px-4 py-3 rounded-lg border resize-none ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`} />

            {showConfirmWarning && (
              <div className="mt-6 p-4 border border-red-600 rounded-lg text-center">
                <p className="font-bold text-red-400 text-lg">30-Day Lock Warning</p>
                <p className="text-sm mt-2">After saving, your profile will be locked for 30 days.</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-600 text-white rounded-lg">Cancel</button>
              <button
                onClick={() => showConfirmWarning ? handleSaveProfile() : setShowConfirmWarning(true)}
                disabled={!tempUsername.trim()}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-500"
              >
                {showConfirmWarning ? "Confirm" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-lg h-96 bg-gray-900 rounded-xl overflow-hidden">
            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)} />
            <div className="absolute bottom-0 left-0 right-0 flex justify-between p-4 bg-gradient-to-t from-black/80">
              <button onClick={() => setImageSrc(null)} className="px-6 py-2 bg-red-600 text-white rounded-lg">Cancel</button>
              <button onClick={uploadCropped} disabled={uploading} className="px-6 py-2 bg-green-600 text-white rounded-lg">
                {uploading ? "Uploading..." : "Use Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setImageSrc(reader.result);
          reader.readAsDataURL(file);
        }
      }} className="hidden" />
    </div>
  );
};

export default UserProfile;