import React, { useEffect, useState } from "react";
import { db, storage } from "../../../configs/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { FiX } from "react-icons/fi";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useDarkMode } from "../../../context/DarkModeContext";

const SkinGiftingAdmin = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const {isDarkMode} = useDarkMode()
  const [newItem, setNewItem] = useState({
    label: "",
    rupees: "",
    falseRupees: "",
    img: null,
  });

  const fetchItems = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "skinGiftProducts"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true)
    await deleteDoc(doc(db, "skinGiftProducts", id));
    setSelectedItem(null);
    fetchItems();
    setLoading(false)
  };

  const handleEditChange = (field, value) => {
    setSelectedItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    setLoading(true)
    if (!selectedItem?.id) return;

    const docRef = doc(db, "skinGiftProducts", selectedItem.id);
    const { id, ...fieldsToUpdate } = selectedItem;
    await updateDoc(docRef, fieldsToUpdate);

    setSelectedItem(null);
    fetchItems();
    setLoading(false)

  };

  const uploadImage = async (file, docId) => {
    const imageRef = ref(storage, `skinGifting/${docId}-${Date.now()}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handleAddNew = async () => {
    setLoading(true)
    const { label, rupees, falseRupees, img } = newItem;
    if (!label || !rupees || !img) {
      alert("Please fill all required fields and upload an image");
      setLoading(false)
      return;
    }

    const newDocRef = doc(collection(db, "skinGiftProducts"));
    const imageUrl = await uploadImage(img, newDocRef.id);

    await setDoc(newDocRef, {
      label,
      rupees: parseFloat(rupees),
      falseRupees: parseFloat(falseRupees || 0),
      img: imageUrl,
    });

    setNewItem({ label: "", rupees: "", falseRupees: "", img: null });
    setShowAddForm(false);
    fetchItems();
    setLoading(false)
  };

  useEffect(() => {
    fetchItems();
  }, []);
return (
  <div className={`px-2 py-6 max-w-4xl mx-auto ${isDarkMode ? "bg-gray-900 text-gray-200" : ""}`}>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Skin Gifting Products</h2>
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="bg-blue-600 text-white px-3 py-1 rounded"
      >
        {showAddForm ? "Close Form" : "Add New"}
      </button>
    </div>

    {loading ? (
      <p>Loading...</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(prev => prev?.id === item.id ? null : item)}
            className={`border p-2 px-4 flex items-center justify-between rounded-md cursor-pointer hover:shadow ${
              selectedItem?.id === item.id
                ? "ring-2 ring-blue-500"
                : ""
            } ${isDarkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-white/90 border-gray-300"}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-15 h-15 rounded flex items-center overflow-hidden">
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-40 object-cover mb-2 rounded"
                />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div>
                <p className="text-green-500 text-sm">₹{item.rupees}</p>
                <p className="text-xs line-through text-red-500">₹{item.falseRupees}</p>
              </div>
              <p className="font-semibold">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    )}

    {selectedItem && (
      <div
        className={`fixed top-20 left-10 right-10 bottom-20 p-4 rounded-lg overflow-auto shadow-inner z-50 ${
          isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="flex justify-between">
          <h3 className="text-lg font-bold">Edit Product</h3>
          <button onClick={() => setSelectedItem(null)}>
            <FiX size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <input
            type="text"
            value={selectedItem.label}
            onChange={(e) => handleEditChange("label", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Label"
          />
          <input
            type="number"
            value={selectedItem.rupees}
            onChange={(e) => handleEditChange("rupees", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Rupees"
          />
          <input
            type="number"
            value={selectedItem.falseRupees}
            onChange={(e) => handleEditChange("falseRupees", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="False Rupees"
          />
        </div>
        <button
          disabled={loading}
          onClick={handleSaveEdit}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>
        <button
          onClick={() => handleDelete(selectedItem.id)}
          className="ml-2 mt-4 bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
      </div>
    )}

    {showAddForm && (
      <div
        className={`fixed top-20 left-10 right-10 p-4 rounded-lg shadow-lg z-50 ${
          isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold">Add New Product</h3>
          <button onClick={() => setShowAddForm(false)}>
            <FiX size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={newItem.label}
            onChange={e => setNewItem(prev => ({ ...prev, label: e.target.value }))}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Label"
          />
          <input
            type="number"
            value={newItem.rupees}
            onChange={e => setNewItem(prev => ({ ...prev, rupees: e.target.value }))}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Rupees"
          />
          <input
            type="number"
            value={newItem.falseRupees}
            onChange={e => setNewItem(prev => ({ ...prev, falseRupees: e.target.value }))}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="False Rupees"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewItem(prev => ({ ...prev, img: e.target.files[0] }))}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
          />
        </div>
        <button
          disabled={loading}
          onClick={handleAddNew}
          className={`mt-4 bg-blue-600 text-white px-4 py-2 rounded ${
            loading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {loading ? "Uploading.." : "Upload"}
        </button>
      </div>
    )}
  </div>
);

};

export default SkinGiftingAdmin;
