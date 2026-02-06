import React, { useEffect, useState } from "react";
import { db } from "../../../configs/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { FiX } from "react-icons/fi";
import oneiricImg from "../../../assets/images/oneiric-shard.png";
import expressPassImg from "../../../assets/images/express-pass.png";
import defaultImg from "../../../assets/images/oneiric-shard.png"; // fallback
import { useDarkMode } from "../../../context/DarkModeContext";

// Group Images (Add your actual images)
import oneiricGroup from "../../../assets/images/oneiric-shard.png";
import expressGroup from "../../../assets/images/express-pass.png";
import bundleGroup from "../../../assets/images/express-pass.png"; // Add this image

const groupImageMap = {
  oneiric: oneiricGroup,
  express: expressGroup,
  bundle: bundleGroup,
};

const HonkaiAdmin = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { isDarkMode } = useDarkMode();
  const [activeGroup, setActiveGroup] = useState("oneiric");

  const [newItem, setNewItem] = useState({
    id: "",
    label: "",
    diamonds: "",
    rupees: "",
    falseRupees: "",
    resellerRupees: "",
    price: "",
    group: "",
    api: "yokcash",
  });

  // Real-time listener
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "honkaiProductList"), (snapshot) => {
      const products = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => parseFloat(a?.price || 0) - parseFloat(b?.price || 0));
      setItems(products);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggleOutOfStock = async (id, currentStatus) => {
    await updateDoc(doc(db, "honkaiProductList", id), {
      outOfStock: !currentStatus,
    });
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setSelectedItem(null);
    await deleteDoc(doc(db, "honkaiProductList", id));
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setSelectedItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleHide = async (id, currentHide) => {
    if (!id) return;
    try {
      const docRef = doc(db, "honkaiProductList", id);
      await updateDoc(docRef, { hide: !currentHide });
    } catch (error) {
      console.error("Error updating hide status:", error);
      alert("Failed to update visibility: " + error.message);
    }
  };

  const handleSave = async () => {
    if (!selectedItem?.id) return;
    setLoading(true);

    const docRef = doc(db, "honkaiProductList", selectedItem.id);
    const { id, ...otherFields } = selectedItem;

    const updateData = {
      ...otherFields,
      diamonds: parseFloat(otherFields.diamonds) || 0,
      rupees: parseFloat(otherFields.rupees) || 0,
      falseRupees: parseFloat(otherFields.falseRupees) || 0,
      resellerRupees: parseFloat(otherFields.resellerRupees) || 0,
      price: parseFloat(otherFields.price) || 0,
      group: otherFields.group || "",
      api: otherFields.api || "yokcash",
    };

    try {
      await updateDoc(docRef, updateData);
      setSelectedItem(null);
    } catch (error) {
      alert("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleJsonUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        alert("Invalid JSON: Must be an array.");
        return;
      }

      setLoading(true);
      const batchPromises = jsonData.map((item) => {
        const docRef = doc(db, "honkaiProductList", item.id);
        return setDoc(docRef, {
          id: item.id,
          label: item.label || "",
          diamonds: parseFloat(item.diamonds) || 0,
          rupees: parseFloat(item.rupees) || 0,
          falseRupees: parseFloat(item.falseRupees) || 0,
          resellerRupees: parseFloat(item.resellerRupees) || 0,
          price: parseFloat(item.price) || 0,
          group: item.group || "oneiric",
          api: item.api || "yokcash",
          outOfStock: !!item.outOfStock,
          hide: !!item.hide,
        }, { merge: true });
      });

      await Promise.all(batchPromises);
      alert("JSON uploaded successfully!");
    } catch (error) {
      console.error("JSON upload failed:", error);
      alert("Error uploading JSON.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    const { id, label, diamonds, rupees, group, api } = newItem;
    if (!id || !label || !rupees || !diamonds || !group) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    await setDoc(doc(db, "honkaiProductList", id), {
      id,
      label,
      diamonds: parseFloat(diamonds),
      rupees: parseFloat(rupees),
      falseRupees: parseFloat(newItem.falseRupees) || 0,
      resellerRupees: parseFloat(newItem.resellerRupees) || 0,
      price: parseFloat(newItem.price) || 0,
      group: group || "oneiric",
      api: api || "yokcash",
      outOfStock: false,
      hide: false,
    });

    setNewItem({
      id: "", label: "", diamonds: "", rupees: "", falseRupees: "",
      resellerRupees: "", price: "", group: "", api: "yokcash"
    });
    setShowAddForm(false);
    setLoading(false);
  };

  const getProductImage = (label) => {
    const lower = label.toLowerCase();
    if (lower.includes("oneiric")) return oneiricImg;
    if (lower.includes("express")) return expressPassImg;
    return defaultImg;
  };

  const filteredItems = items.filter((item) => {
    if (activeGroup === "bundle") {
      return item.group === "bundle";
    }
    return item.group === activeGroup;
  });

  const groupLabels = {
    oneiric: "Oneiric Shards",
    express: "Express Supply",
    bundle: "Bundles",
  };

  const apiColors = {
    yokcash: "bg-blue-500",
    busan: "bg-pink-400",
    smile: "bg-green-500",
  };

  return (
    <div className={`px-2 py-6 md:mx-10 lg:mx-20 mx-auto ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`}>
      {/* Group Filter Tabs */}
      <div className="flex gap-4 mb-6 justify-center flex-wrap">
        {Object.entries(groupLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveGroup(key);
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeGroup === key
                ? "bg-yellow-400 text-black"
                : isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Honkai Products</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-2 text-sm py-1 rounded hover:bg-blue-700"
        >
          {showAddForm ? "Close Add Form" : "Add New Product"}
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem((prev) => (prev?.id === item.id ? null : item))}
              className={`p-3 rounded-2xl border shadow-md transition-all duration-200 hover:shadow-lg relative cursor-pointer ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
              } ${selectedItem?.id === item.id ? "ring-2 ring-blue-500" : ""}`}
            >
              {/* API Badge */}
              <span
                className={`absolute -top-2 right-2 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold ${apiColors[item.api] || "bg-gray-500"}`}
              >
                {item.api}
              </span>

              <div className="flex items-center gap-3">
                <img
                  src={getProductImage(item.label)}
                  alt={item.label}
                  className="w-10 h-10 object-contain rounded"
                />
                <div className="flex flex-col">
                  <span
                    className={`text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold inline-block w-fit ${
                      item.outOfStock ? "bg-red-500" : "bg-green-500"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOutOfStock(item.id, item.outOfStock);
                    }}
                  >
                    {item.outOfStock ? "Out of Stock" : "In Stock"}
                  </span>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {item.diamonds} Crystals
                  </p>
                  <p className="font-semibold text-sm">{item.label}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 mt-2">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  ₹{item.rupees}{" "}
                  <span className="text-red-600 dark:text-red-400 text-[12px] line-through">
                    ₹{item.falseRupees}
                  </span>
                </p>
                {item.resellerRupees && (
                  <p className="text-xs text-gray-500">Reseller: ₹{item.resellerRupees}</p>
                )}
                <p className="text-[10px] text-gray-500">Price: {item.price}</p>

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

      {/* Edit Modal */}
      {selectedItem && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] lg:w-[50%] p-6 border rounded-lg shadow-inner overflow-auto max-h-[80vh] z-50 ${
            isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-300 text-gray-900"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Edit Product ({selectedItem.id})</h3>
            <button onClick={() => setSelectedItem(null)}>
              <FiX size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: "Label", field: "label", type: "text" },
              { label: "Crystals", field: "diamonds", type: "number" },
              { label: "Price (₹)", field: "rupees", type: "number" },
              { label: "False Price", field: "falseRupees", type: "number" },
              { label: "Reseller Price", field: "resellerRupees", type: "number" },
              { label: "Sort Price", field: "price", type: "number" },
            ].map(({ label, field, type }) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="font-medium text-sm">{label}</label>
                <input
                  type={type}
                  value={selectedItem[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"
                  }`}
                />
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm">Group</label>
              <div className="flex items-center gap-3">
                <select
                  value={selectedItem.group}
                  onChange={(e) => handleChange("group", e.target.value)}
                  className={`border px-3 py-2 rounded text-sm w-full ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"
                  }`}
                >
                  <option value="">Select Group</option>
                  {Object.keys(groupImageMap).map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                {selectedItem.group && (
                  <img
                    src={groupImageMap[selectedItem.group]}
                    alt="group"
                    className="h-10 w-10 rounded-md border"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm">API</label>
              <select
                value={selectedItem.api || "yokcash"}
                onChange={(e) => handleChange("api", e.target.value)}
                className={`border px-3 py-2 rounded text-sm w-full ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"
                }`}
              >
                <option value="yokcash">Yokcash</option>
                <option value="busan">Busan</option>
                <option value="smile">Smile</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => handleDelete(selectedItem.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Form */}
      {showAddForm && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] lg:w-[50%] p-6 border rounded-lg shadow-inner overflow-auto max-h-[80vh] z-50 ${
            isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-300 text-gray-900"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Add New Product</h3>
            <button onClick={() => setShowAddForm(false)}>
              <FiX size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: "ID", field: "id", type: "text" },
              { label: "Label", field: "label", type: "text" },
              { label: "Crystals", field: "diamonds", type: "number" },
              { label: "Price (₹)", field: "rupees", type: "number" },
              { label: "False Price", field: "falseRupees", type: "number" },
              { label: "Reseller Price", field: "resellerRupees", type: "number" },
              { label: "Sort Price", field: "price", type: 

"number" },
            ].map(({ label, field, type }) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="font-medium text-sm">{label}</label>
                <input
                  type={type}
                  value={newItem[field] || ""}
                  onChange={(e) => handleNewChange(field, e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"
                  }`}
                />
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm">Group</label>
              <div className="flex items-center gap-3">
                <select
                  value={newItem.group}
                  onChange={(e) => handleNewChange("group", e.target.value)}
                  className={`border px-3 py-2 rounded text-sm w-full ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"
                  }`}
                >
                  <option value="">Select Group</option>
                  {Object.keys(groupImageMap).map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                {newItem.group && (
                  <img
                    src={groupImageMap[newItem.group]}
                    alt="group"
                    className="h-10 w-10 rounded-md border"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm">API</label>
              <select
                value={newItem.api}
                onChange={(e) => handleNewChange("api", e.target.value)}
                className={`border px-3 py-2 rounded text-sm w-full ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"
                }`}
              >
                <option value="yokcash">Yokcash</option>
                <option value="busan">Busan</option>
                <option value="smile">Smile</option>
              </select>
            </div>

            <button
              onClick={handleAddNew}
              disabled={loading}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded disabled:opacity-50"
            >
              Add Product
            </button>

            <div className="mt-4">
              <label className="block font-medium text-sm mb-1">Upload from JSON</label>
              <input
                type="file"
                accept="application/json"
                onChange={handleJsonUpload}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HonkaiAdmin;