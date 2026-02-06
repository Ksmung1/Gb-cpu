import React, { useEffect, useState } from "react";
import { db } from "../../../configs/firebase";
import d from "../../../assets/images/diamond.webp";
import dd from "../../../assets/images/dd.avif";
import weekly from "../../../assets/images/weekly-mc.png";
import {
  collection,
  deleteDoc,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { FiX } from "react-icons/fi";
import { useDarkMode } from "../../../context/DarkModeContext";

const fallbackImages = {
  d,
  dd,
  specials: weekly,
};

const apiOptions = ['busan', 'yokcash', 'smile'];

const MLCustomAdmin = () => {
  const { isDarkMode } = useDarkMode();

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    id: "",
    label: "",
    rupees: "",
    diamonds: "",
    falseRupees: "",
    resellerRupees: "",
    price: "",
    group: "",
    img: d,
    api: "yokcash",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "mlCustomProductList"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => parseFloat(a?.price || 0) - parseFloat(b?.price || 0));
      setItems(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggleOutOfStock = async (item) => {
    const docRef = doc(db, "mlCustomProductList", item.id);
    await updateDoc(docRef, { outOfStock: !item.outOfStock });
  };

  const handleHide = async (id, currentHide) => {
    if (!id) return;
    try {
      const docRef = doc(db, "mlCustomProductList", id);
      await updateDoc(docRef, { hide: !currentHide });
    } catch (error) {
      console.error("Error updating hide status:", error);
      alert("Failed to update: " + error.message);
    }
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
          api = "yokcash",
          diamonds = 0,
          label,
          rupees,
          falseRupees = 0,
          resellerRupees = 0,
          price = 0,
          group = "",
          img = d,
        } = product;

        if (!id || !label || !rupees || !group) {
          alert(`Skipping: missing id, label, rupees, or group`);
          continue;
        }

        if (!apiOptions.includes(api)) {
          alert(`Invalid API: ${api}`);
          continue;
        }

        await setDoc(doc(db, "mlCustomProductList", id), {
          id,
          label,
          diamonds: parseFloat(diamonds),
          rupees: parseFloat(rupees),
          falseRupees: parseFloat(falseRupees),
          resellerRupees: parseFloat(resellerRupees),
          price: parseFloat(price),
          group,
          img,
          api,
          outOfStock: false,
          hide: false,
        });
      }

      alert("JSON uploaded successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    }

    e.target.value = null;
  };

  const handleDelete = async (id) => {
    setSelectedItem(null);
    await deleteDoc(doc(db, "mlCustomProductList", id));
  };

  const handleChange = (field, value) => {
    setSelectedItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedItem?.id) return;
    const docRef = doc(db, "mlCustomProductList", selectedItem.id);
    const { id, ...updatedFields } = selectedItem;
    await updateDoc(docRef, updatedFields);
    setSelectedItem(null);
  };

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNew = async () => {
    const { id, label, rupees, group, api } = newItem;
    if (!id || !label || !rupees || !group || !api) {
      alert("Please fill ID, Label, Price, Group, and API");
      return;
    }

    await setDoc(doc(db, "mlCustomProductList", id), {
      ...newItem,
      diamonds: parseFloat(newItem.diamonds) || 0,
      rupees: parseFloat(newItem.rupees),
      falseRupees: parseFloat(newItem.falseRupees) || 0,
      resellerRupees: parseFloat(newItem.resellerRupees) || 0,
      price: parseFloat(newItem.price) || 0,
      outOfStock: false,
      hide: false,
    });

    setNewItem({
      id: "",
      label: "",
      rupees: "",
      diamonds: "",
      falseRupees: "",
      resellerRupees: "",
      price: "",
      group: "",
      img: d,
      api: "yokcash",
    });
    setShowAddForm(false);
  };

  return (
    <div
      className={`px-4 py-6 max-w-5xl mx-auto ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Products</h2>
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          {showAddForm ? "Close" : "Add New Product"}
        </button>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center italic text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem((prev) => (prev?.id === item.id ? null : item))}
              className={`p-4 border rounded-xl shadow cursor-pointer hover:shadow-md transition-all flex justify-between items-center relative ${
                isDarkMode
                  ? selectedItem?.id === item.id
                    ? "ring-2 ring-purple-500 border-gray-600 bg-gray-800"
                    : "border-gray-700 bg-gray-800"
                  : selectedItem?.id === item.id
                  ? "ring-2 ring-purple-500 border-gray-300 bg-white"
                  : "border-gray-300 bg-white"
              }`}
            >
              <div className="flex gap-3">
                <div className="w-13 h-10 flex items-center">
                  <img
                    className="w-full h-full object-cover rounded-lg"
                    src={item.img || fallbackImages[item.group] || d}
                    alt={item.label}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold">
                    {item.diamonds ? `${item.diamonds} Diamonds` : item.label.includes("Weekly") ? "Weekly Pass" : item.label}
                  </span>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-purple-600 font-medium">{item.group}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  ₹{item.rupees}{" "}
                  {item.falseRupees > 0 && (
                    <span className="text-red-600 dark:text-red-400 text-[12px] line-through">
                      ₹{item.falseRupees}
                    </span>
                  )}
                </p>
                {item.resellerRupees > 0 && (
                  <p className="text-xs text-gray-500">Reseller: ₹{item.resellerRupees}</p>
                )}
                <p className="text-[10px] text-gray-500">Price: {item.price}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHide(item.id, item.hide);
                  }}
                  className={`text-xs px-3 py-[4px] rounded font-medium text-white ${
                    item.hide ? "bg-orange-500" : "bg-gray-500"
                  }`}
                >
                  {item.hide ? "SHOW" : "HIDE"}
                </button>
              </div>

              {/* Stock Badge */}
              <span
                className={`absolute -top-5 left-0 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold cursor-pointer ${
                  item.outOfStock ? "bg-red-500" : "bg-green-500"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOutOfStock(item);
                }}
              >
                {item.outOfStock ? "Out of Stock" : "In Stock"}
              </span>

              {/* API Badge */}
              <span
                className={`absolute -top-2 right-0 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold ${
                  item.api === "yokcash" ? "bg-blue-500" : item.api === "busan" ? "bg-pink-400" : "bg-green-500"
                }`}
              >
                {item.api}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl p-6 rounded-lg shadow-xl max-h-[85vh] overflow-auto ${
              isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Product</h3>
              <button onClick={() => setSelectedItem(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Label", key: "label", type: "text" },
                { label: "Diamonds", key: "diamonds", type: "number" },
                { label: "Price (Rupees)", key: "rupees", type: "number" },
                { label: "False Price", key: "falseRupees", type: "number" },
                { label: "Reseller Price", key: "resellerRupees", type: "number" },
                { label: "Sort Price", key: "price", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key} className="flex flex-col">
                  <label className="font-medium text-sm">{label}</label>
                  <input
                    type={type}
                    value={selectedItem[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={`border px-3 py-2 rounded text-sm ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-200"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              ))}

              {/* Group as Text Input */}
              <div className="flex flex-col">
                <label className="font-medium text-sm">Group</label>
                <input
                  type="text"
                  value={selectedItem.group || ""}
                  onChange={(e) => handleChange("group", e.target.value)}
                  placeholder="e.g. d, dd, specials"
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium text-sm">API</label>
                <select
                  value={selectedItem.api || "yokcash"}
                  onChange={(e) => handleChange("api", e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  {apiOptions.map((api) => (
                    <option key={api} value={api}>{api}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
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
        </div>
      )}

      {/* Add New Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div
            className={`w-full max-w-2xl p-6 rounded-lg shadow-xl max-h-[85vh] overflow-auto ${
              isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add New Product</h3>
              <button onClick={() => setShowAddForm(false)}>
                <FiX size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "ID", key: "id", type: "text" },
                { label: "Label", key: "label", type: "text" },
                { label: "Diamonds", key: "diamonds", type: "number" },
                { label: "Price (Rupees)", key: "rupees", type: "number" },
                { label: "False Price", key: "falseRupees", type: "number" },
                { label: "Reseller Price", key: "resellerRupees", type: "number" },
                { label: "Sort Price", key: "price", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key} className="flex flex-col">
                  <label className="font-medium text-sm">{label}</label>
                  <input
                    type={type}
                    value={newItem[key] || ""}
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

              {/* Group as Text Input */}
              <div className="flex flex-col">
                <label className="font-medium text-sm">Group *</label>
                <input
                  type="text"
                  value={newItem.group || ""}
                  onChange={(e) => handleNewChange("group", e.target.value)}
                  placeholder="e.g. d, dd, specials"
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium text-sm">API *</label>
                <select
                  value={newItem.api}
                  onChange={(e) => handleNewChange("api", e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  {apiOptions.map((api) => (
                    <option key={api} value={api}>{api}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block mb-2 font-medium text-sm">Upload JSON (Bulk Add)</label>
              <input
                type="file"
                accept=".json"
                onChange={handleUploadJson}
                className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 ${
                  isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"
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
        </div>
      )}
    </div>
  );
};

export default MLCustomAdmin;