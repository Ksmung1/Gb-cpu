import React, { useEffect, useState } from "react";
import { db } from "../../../configs/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { FiX } from "react-icons/fi";
import { charismaImageMap } from "../../RechargeComponents/RechargeUtils/productList";
import { useDarkMode } from "../../../context/DarkModeContext";

const CharismaAdmin = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const {isDarkMode} = useDarkMode()
  const [newItem, setNewItem] = useState({
    id: "",
    label: "",
    rupees: "",
    falseRupees: "",
    img: "",
  });

  const fetchItems = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "charismaProducts"));
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(products);
    setLoading(false);
  };

  const handleDelete = async (id) => {
        setLoading(true);

    setSelectedItem(null);
    await deleteDoc(doc(db, "charismaProducts", id));
    fetchItems();
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setSelectedItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
  
    if (!selectedItem?.id) return;
      setLoading(true);
    const docRef = doc(db, "charismaProducts", selectedItem.id);
    const { id, ...updatedFields } = selectedItem;
    await updateDoc(docRef, updatedFields);
    fetchItems();
    setSelectedItem(null);
      setLoading(false);
  };

  const handleNewChange = (field, value) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNew = async () => {
    const { id, label, rupees, falseRupees, img } = newItem;
    if (!id || !label || !rupees || !img) {
      alert("Please fill all required fields");
      return;
    }
      setLoading(true);
    await setDoc(doc(db, "charismaProducts", id), {
      id,
      label,
      rupees: parseFloat(rupees),
      falseRupees: parseFloat(falseRupees),
      img,
    });
    setNewItem({ id: "", label: "", rupees: "", falseRupees: "", img: "" });
    fetchItems();
    setShowAddForm(false);
      setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

const handleJsonUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const content = JSON.parse(e.target.result);

      if (!Array.isArray(content)) {
        alert("Invalid JSON format: Must be an array of products.");
        return;
      }

      setLoading(true);

      const batchPromises = content.map(async (item, index) => {
        let { id, label, rupees, falseRupees, img } = item;

        // Convert numeric ID to string
        if (typeof id !== "string") id = String(id);

        if (!id || !label || !rupees || !img) {
          console.warn(`Skipping item at index ${index}: missing required fields`);
          return null;
        }

        const productData = {
          id,
          label,
          rupees: parseFloat(rupees),
          falseRupees: parseFloat(falseRupees || 0),
          img,
        };

        return setDoc(doc(db, "charismaProducts", id), productData);
      });

      await Promise.all(batchPromises);

      fetchItems();
      alert("Products uploaded successfully.");
    } catch (err) {
      console.error("Error parsing JSON:", err);
      alert("Failed to read JSON file.");
    } finally {
      setLoading(false);
    }
  };

  reader.readAsText(file);
};



return (
  <div className={`p-2 max-w-4xl mx-auto ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`}>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Charisma Products</h2>
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        {showAddForm ? "Close Add Form" : "Add New Product"}
      </button>
      <div className="flex items-center gap-2">
  <button
    onClick={() => document.getElementById("jsonUploadInput").click()}
    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
  >
    Upload JSON
  </button>

  <input
    id="jsonUploadInput"
    type="file"
    accept=".json"
    onChange={handleJsonUpload}
    className="hidden"
  />
</div>

    </div>

    {loading ? (
      <p>Loading...</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(prev => prev?.id === item.id ? null : item)}
            className={`p-4 border rounded-xl shadow cursor-pointer transition-all ${
              selectedItem?.id === item.id
                ? "ring-2 ring-blue-500"
                : isDarkMode
                ? "bg-gray-800 border-gray-700 hover:shadow-md"
                : "bg-white hover:shadow-md"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm">₹{item.rupees}</p>
                <p className="text-xs line-through text-red-500">₹{item.falseRupees}</p>
              </div>
              {charismaImageMap[item.img] && (
                <img src={charismaImageMap[item.img]} alt="preview" className="w-12 h-12 rounded-lg" loading="lazy" />
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {selectedItem && (
      <div
        className={`fixed top-20 left-10 right-10 bottom-20 p-4 rounded-lg overflow-auto shadow-inner ${
          isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="flex justify-between">
          <h3 className="text-lg font-bold">Edit Product</h3>
          <button onClick={() => setSelectedItem(null)}><FiX size={24} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <label>Label</label>
          <input
            type="text"
            value={selectedItem.label}
            onChange={e => handleChange("label", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Label"
          />
          <label>Price</label>

          <input
            type="number"
            value={selectedItem.rupees}
            onChange={e => handleChange("rupees", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Rupees"
          />
          <label>Negative Price</label>

          <input
            type="number"
            value={selectedItem.falseRupees}
            onChange={e => handleChange("falseRupees", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="False Rupees"
          />
          <label>Image key (label to camel case)</label>
          <input
            type="text"
            value={selectedItem.img}
            onChange={e => handleChange("img", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Image Key"
          />
          {charismaImageMap[selectedItem.img] && (
            <img src={charismaImageMap[selectedItem.img]} alt="Preview" className="w-20 h-20 rounded border mt-2" />
          )}
        </div>
        <button
          disabled={loading}
          onClick={handleSave}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          {loading ? "Loading..." : "Save"}
        </button>
        <button
          disabled={loading}
          onClick={() => handleDelete(selectedItem.id)}
          className="ml-2 mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    )}

    {showAddForm && (
      <div
        className={`fixed top-20 left-10 right-10 p-4 border rounded-lg shadow-lg overflow-auto max-h-[80vh] ${
          isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300"
        }`}
      >
        <div className="flex justify-between">
          <h3 className="text-lg font-bold">Add New Product</h3>
          <button onClick={() => setShowAddForm(false)}><FiX size={24} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <label>ID</label>

          <input
            type="text"
            value={newItem.id}
            onChange={e => handleNewChange("id", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="ID"
          />
          <label>Label</label>

          <input
            type="text"
            value={newItem.label}
            onChange={e => handleNewChange("label", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Label"
          />
          <label>Price</label>

          <input
            type="number"
            value={newItem.rupees}
            onChange={e => handleNewChange("rupees", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Rupees"
          />
          <label>Negative Price</label>

          <input
            type="number"
            value={newItem.falseRupees}
            onChange={e => handleNewChange("falseRupees", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="False Rupees"
          />
          <label>Image Key (label to camel case)</label>

          <input
            type="text"
            value={newItem.img}
            onChange={e => handleNewChange("img", e.target.value)}
            className={`border px-3 py-2 rounded ${
              isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
            }`}
            placeholder="Image Key"
          />
          
          {charismaImageMap[newItem.img] && (
            <img src={charismaImageMap[newItem.img]} alt="Preview" className="w-20 h-20 rounded border mt-2" />
          )}
        </div>
        <button
          disabled={loading}
          onClick={handleAddNew}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Loading..." : "Add Product"}
        </button>
      </div>
    )}
  </div>
);

};

export default CharismaAdmin;
