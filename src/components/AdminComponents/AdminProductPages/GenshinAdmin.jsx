import React, { useEffect, useState } from "react";
import { db } from "../../../configs/firebase";
import { FiX } from "react-icons/fi";
import { useDarkMode } from "../../../context/DarkModeContext";
import {
  collection,
  deleteDoc,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";

const GenshinAdmin = () => {
  const { isDarkMode } = useDarkMode();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    id: "",
    label: "",
    rupees: "",
    falseRupees: "",
    resellerRupees: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "genshinProductList"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => a?.rupees - b?.rupees);
      setItems(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleHide = async (id, currentHide) => {
    if (!id) return;

    try {
      const docRef = doc(db, "genshinProductList", id);
      await updateDoc(docRef, { hide: !currentHide });
    } catch (error) {
      console.error("Error updating hide status:", error);
      alert("Failed to update product visibility: " + error.message);
    }
  };

  const toggleOutOfStock = async (item) => {
    const docRef = doc(db, "genshinProductList", item.id);
    await updateDoc(docRef, {
      outOfStock: !item.outOfStock,
    });
  };

  const handleUploadJson = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/json") {
      alert("Please upload a valid JSON file.");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        alert("JSON must be an array of product objects.");
        return;
      }

      for (const product of data) {
        const {
          id,
          label,
          rupees,
          falseRupees = 0,
          resellerRupees,
        } = product;

        if (!id || !label || !rupees) {
          alert(`Skipping invalid product with missing required fields: ${JSON.stringify(product)}`);
          continue;
        }

        await setDoc(doc(db, "genshinProductList", id), {
          id,
          label,
          rupees: parseFloat(rupees),
          falseRupees: parseFloat(falseRupees),
          resellerRupees: parseFloat(resellerRupees) || 0,
          api: 'yokcash',
        });
      }

      alert("JSON upload successful!");
    } catch (err) {
      alert("Error reading JSON file: " + err.message);
    }

    e.target.value = null;
  };

  const handleDelete = async (id) => {
    setSelectedItem(null);
    await deleteDoc(doc(db, "genshinProductList", id));
  };

  const handleChange = (field, value) => {
    setSelectedItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedItem?.id) return;
    const docRef = doc(db, "genshinProductList", selectedItem.id);
    const { id, ...updatedFields } = selectedItem;
    await updateDoc(docRef, updatedFields);
    setSelectedItem(null);
  };

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNew = async () => {
    const { id, label, rupees, falseRupees, resellerRupees } = newItem;
    if (!id || !label || !rupees) {
      alert("Please fill all required fields");
      return;
    }
    await setDoc(doc(db, "genshinProductList", id), {
      id,
      label,
      rupees: parseFloat(rupees),
      falseRupees: parseFloat(falseRupees) || 0,
      resellerRupees: parseFloat(resellerRupees) || 0,
      api: 'yokcash',
    });
    setNewItem({
      id: "",
      label: "",
      rupees: "",
      falseRupees: "",
      resellerRupees: "",
    });
    setShowAddForm(false);
  };

  return (
    <div
      className={`px-4 py-6 max-w-5xl mx-auto ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Genshin Products</h2>
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
        >
          {showAddForm ? "Close Add Form" : "Add New Product"}
        </button>
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center italic text-gray-500">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem((prev) => (prev?.id === item.id ? null : item))}
              className={`p-4 border rounded-xl shadow cursor-pointer hover:shadow-md transition-all flex justify-between items-center ${
                isDarkMode
                  ? selectedItem?.id === item.id
                    ? "ring-2 ring-purple-500 border-gray-600 bg-gray-800"
                    : "border-gray-700 bg-gray-800"
                  : selectedItem?.id === item.id
                  ? "ring-2 ring-purple-500 border-gray-300 bg-white"
                  : "border-gray-300 bg-white"
              }`}
            >
              <div className="flex flex-col relative">
                <span className="text-[11px] font-semibold">{item.label}</span>
                <span
                  className={`absolute -top-5 left-0 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold ${
                    item.outOfStock ? "bg-red-500" : "bg-green-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOutOfStock(item);
                  }}
                >
                  {item.outOfStock ? "Out Stock" : "In Stock"}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    ₹{item.rupees} |{" "}
                    <span className="text-red-600 dark:text-red-400 text-[12px] line-through">
                      ₹{item.falseRupees}
                    </span>
                  </p>
                  {item.resellerRupees && (
                    <p className="text-xs font-medium text-gray-500">
                      Reseller: ₹{item.resellerRupees}
                    </p>
                  )}
                         <p className="text-[10px] text-white-500">
              Price: {item?.price}
            </p>

                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHide(item.id, item?.hide);
                  }}
                  className={`text-xs px-3 py-[4px] rounded font-medium text-white ${
                    item.hide ? "bg-orange-500" : "bg-gray-500"
                  }`}
                >
                  {item.hide ? "SHOW" : "HIDE"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div
          className={`fixed top-20 left-10 right-10 bottom-20 p-6 rounded-lg shadow-inner overflow-auto max-h-[80vh] z-50 border ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-gray-700"
              : "bg-gray-100 text-gray-900 border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Edit Product</h3>
            <button onClick={() => setSelectedItem(null)}>
              <FiX size={24} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "Label", key: "label", type: "text" },
              { label: "Price", key: "rupees", type: "number" },
              { label: "Reseller Price", key: "resellerRupees", type: "number" },
              { label: "Negative Price", key: "falseRupees", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} className="flex flex-col text-left gap-1">
                <label className="font-medium text-sm">{label}</label>
                <input
                  type={type}
                  value={selectedItem[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder={label}
                />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => handleDelete(selectedItem.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div
          className={`fixed top-20 left-10 right-10 p-6 rounded-lg shadow-lg overflow-auto max-h-[80vh] z-40 border ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-gray-700"
              : "bg-white text-gray-900 border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Add New Product</h3>
            <button onClick={() => setShowAddForm(false)}>
              <FiX size={24} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "ID", key: "id", type: "text" },
              { label: "Label", key: "label", type: "text" },
              { label: "Price", key: "rupees", type: "number" },
              { label: "Reseller Price", key: "resellerRupees", type: "number" },
              { label: "Negative Price", key: "falseRupees", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} className="flex text-left w-full flex-col gap-1">
                <label className="font-medium text-sm">{label}</label>
                <input
                  type={type}
                  value={newItem[key]}
                  onChange={(e) => handleNewChange(key, e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder={label}
                />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <label htmlFor="upload-json" className="block mb-2 font-medium text-sm">
              Upload JSON file to bulk add products
            </label>
            <input
              type="file"
              id="upload-json"
              accept=".json,application/json"
              onChange={handleUploadJson}
              className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-600 file:text-white
                hover:file:bg-purple-700
                ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-100 text-gray-700"
                }`}
            />
          </div>
          <div className="mt-8 text-right">
            <button
              onClick={handleAddNew}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded"
            >
              Add Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenshinAdmin;