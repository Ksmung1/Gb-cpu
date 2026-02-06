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

const groupImages = {
  d,
  dd,
  specials: weekly,
};

const groupLabels = {
  d: "diamond",
  dd: "double diamond",
  specials: "weekly",
};

const apiOptions = ['busan', 'yokcash', 'smile'];

const MagicChessAdmin = () => {
  const { isDarkMode } = useDarkMode();

  const [items, setItems] = useState([]);
  const [activeGroup, setActiveGroup] = useState("d");
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
    price: "", // Added new price field
    group: "",
    img: "",
    api: "yokcash",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "magicChessProductList"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => parseFloat(a?.price || 0) - parseFloat(b?.price || 0));
      setItems(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleHide = async (id, currentHide) => {
    if (!id) return;

    try {
      const docRef = doc(db, "magicChessProductList", id);
      await updateDoc(docRef, { hide: !currentHide });
    } catch (error) {
      console.error("Error updating hide status:", error);
      alert("Failed to update product visibility: " + error.message);
    }
  };

  const toggleOutOfStock = async (item) => {
    const docRef = doc(db, "magicChessProductList", item.id);
    await updateDoc(docRef, {
      outOfStock: !item.outOfStock,
    });
  };

  const filteredItems = items.filter((item) => item.group === activeGroup);

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
          api,
          diamonds = 0,
          label,
          rupees,
          falseRupees = 0,
          resellerRupees,
          price = 0, // Added price field
          group,
        } = product;

        if (!id || !label || !rupees || !group) {
          alert(`Skipping invalid product with missing required fields: ${JSON.stringify(product)}`);
          continue;
        }

        if (!apiOptions.includes(api)) {
          alert(`Skipping product with invalid API value: ${api}`);
          continue;
        }

        await setDoc(doc(db, "magicChessProductList", id), {
          id,
          label,
          diamonds: parseFloat(diamonds),
          rupees: parseFloat(rupees),
          falseRupees: parseFloat(falseRupees),
          resellerRupees: parseFloat(resellerRupees) || 0,
          price: parseFloat(price) || 0, // Added price field
          group,
          api,
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
    await deleteDoc(doc(db, "magicChessProductList", id));
  };

  const handleChange = (field, value) => {
    setSelectedItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedItem?.id) return;
    const docRef = doc(db, "magicChessProductList", selectedItem.id);
    const { id, ...updatedFields } = selectedItem;
    await updateDoc(docRef, updatedFields);
    setSelectedItem(null);
  };

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNew = async () => {
    const { id, label, rupees, falseRupees, resellerRupees, price, group, img, diamonds, api } = newItem;
    if (!id || !label || !rupees || !group || !api) {
      alert("Please fill all required fields");
      return;
    }
    await setDoc(doc(db, "magicChessProductList", id), {
      id,
      label,
      diamonds: parseFloat(diamonds) || 0,
      resellerRupees: parseFloat(resellerRupees) || 0,
      rupees: parseFloat(rupees),
      falseRupees: parseFloat(falseRupees) || 0,
      price: parseFloat(price) || 0, // Added price field
      group,
      img,
      api,
    });
    setNewItem({
      id: "",
      label: "",
      diamonds: "",
      rupees: "",
      resellerRupees: "",
      falseRupees: "",
      price: "", // Added price field
      group: "",
      img: "",
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
      {/* Filter Tabs */}
      <div className="flex justify-center gap-4 mb-6">
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

      {/* Header and Add New Toggle */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{groupLabels[activeGroup]} Products</h2>
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
        >
          {showAddForm ? "Close Add Form" : "Add New Product"}
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-center italic text-gray-500">No products in this group.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
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
                    src={groupImages[item.group?.toLowerCase()] || d}
                    alt={item.type}
                  />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-[11px] font-semibold">
                    {item.diamonds || ""}{" "}
                    {item.type === "weekly"
                      ? "Weekly Pass"
                      : item.type === "twilight pass"
                      ? "Twilight Pass"
                      : "Diamonds"}
                  </span>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </p>
                  {/* Stock badge */}
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
                  <p className="text-[10px] text-gray-500">
                    Price: {item.price}
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
              <span
                className={`absolute -top-2 right-0 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold ${
                  item.api === "yokcash" ? "bg-blue-500" : item.api === "busan" ? "bg-pink-400" : "bg-green-500"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOutOfStock(item);
                }}
              >
                {item.api}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
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
              { label: "Diamonds", key: "diamonds", type: "number" },
              { label: "Price (Rupees)", key: "rupees", type: "number" },
              { label: "Reseller Price", key: "resellerRupees", type: "number" },
              { label: "Negative Price", key: "falseRupees", type: "number" },
              { label: "Price", key: "price", type: "number" }, // Added price field
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

            {/* Group Selector */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-sm">Group</label>
              <select
                value={selectedItem.group}
                onChange={(e) => handleChange("group", e.target.value)}
                className={`border px-3 py-2 rounded text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Select Group</option>
                {Object.keys(groupImages).map((key) => (
                  <option key={key} value={key}>
                    {groupLabels[key]}
                  </option>
                ))}
              </select>
            </div>

            {/* API Selector */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-sm">API</label>
              <select
                value={selectedItem.api}
                onChange={(e) => handleChange("api", e.target.value)}
                className={`border px-3 py-2 rounded text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Select API</option>
                {apiOptions.map((api) => (
                  <option key={api} value={api}>
                    {api}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="font-medium text-sm block mb-2">
              Select Image (just for display, doesn’t affect group)
            </label>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(groupImages).map(([key, url]) => (
                <img
                  key={key}
                  src={url}
                  alt={key}
                  className={`w-16 h-16 rounded-lg border-2 cursor-pointer ${
                    selectedItem.img === url
                      ? "border-purple-600 ring-2 ring-purple-300"
                      : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleChange("img", url)}
                />
              ))}
            </div>
            {selectedItem.img && (
              <img
                src={selectedItem.img}
                alt="Selected Preview"
                className="w-20 h-20 mt-4 rounded border"
              />
            )}
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

      {/* Add New Product Form */}
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
              { label: "Diamonds", key: "diamonds", type: "number" },
              { label: "Price (Rupees)", key: "rupees", type: "number" },
              { label: "Reseller Price", key: "resellerRupees", type: "number" },
              { label: "Negative Price", key: "falseRupees", type: "number" },
              { label: "Price", key: "price", type: "number" }, // Added price field
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

            {/* Group Selector */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-sm">Group</label>
              <select
                value={newItem.group}
                onChange={(e) => handleNewChange("group", e.target.value)}
                className={`border px-3 py-2 rounded text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Select Group</option>
                {Object.keys(groupImages).map((key) => (
                  <option key={key} value={key}>
                    {groupLabels[key]}
                  </option>
                ))}
              </select>
            </div>

            {/* API Selector */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-sm">API</label>
              <select
                value={newItem.api}
                onChange={(e) => handleNewChange("api", e.target.value)}
                className={`border px-3 py-2 rounded text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Select API</option>
                {apiOptions.map((api) => (
                  <option key={api} value={api}>
                    {api}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="font-medium text-sm block mb-2">Select Image</label>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(groupImages).map(([key, url]) => (
                <img
                  key={key}
                  src={url}
                  alt={key}
                  className={`w-16 h-16 rounded-lg border-2 cursor-pointer ${
                    newItem.img === url
                      ? "border-purple-600 ring-2 ring-purple-300"
                      : isDarkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleNewChange("img", url)}
                />
              ))}
            </div>
            {newItem.img && (
              <img
                src={newItem.img}
                alt="Selected Preview"
                className="w-20 h-20 mt-4 rounded border"
              />
            )}
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

export default MagicChessAdmin;