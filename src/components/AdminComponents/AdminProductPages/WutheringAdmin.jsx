import React, { useEffect, useState } from "react";
import { db } from "../../../configs/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { deleteItem } from "../MlUtils/deleteItem";
import { FiX } from "react-icons/fi";
import { useDarkMode } from "../../../context/DarkModeContext";

import d from "../../../assets/images/60-lunti.webp";
import dd from "../../../assets/images/60-lunti.webp";
import specials from "../../../assets/images/inter-knot-membership.webp";
import twilight from "../../../assets/images/inter-knot-membership.webp";

const groupImageMap = {
  lunti: d,
  others: specials,
};
const typeImageMap = {
  diamond: d,
  "double diamond": dd,
  weekly: specials,
  "twilight pass": twilight,
};

const WutheringAdmin = () => {
  const { isDarkMode } = useDarkMode();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeGroup, setActiveGroup] = useState("lunti");

  const [newItem, setNewItem] = useState({
    id: "",
    type: "",
    label: "",
    diamonds: "",
    rupees: "",
    resellerRupees: "",
    falseRupees: "",
    price: "",
    group: "",
    api: "",
  });

  /* ------------------- FETCH ------------------- */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "wutheringProductList"),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => parseFloat(a?.rupees || 0) - parseFloat(b?.rupees || 0));
        setItems(list);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /* ------------------- HELPERS ------------------- */
  const toggleOutOfStock = async (item) => {
    const docRef = doc(db, "wutheringProductList", item.id);
    await updateDoc(docRef, { outOfStock: !item.outOfStock });
  };

  const handleDelete = async (id) => {
    setSelectedItem(null);
    const success = await deleteItem({
      collectionName: "wutheringProductList",
      id,
      db,
    });
    if (success) setSelectedItem(null);
  };

  const handleChange = (field, value) => {
    setSelectedItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleHide = async (id, currentHide) => {
    if (!id) return;
    const docRef = doc(db, "wutheringProductList", id);
    await updateDoc(docRef, { hide: !currentHide });
  };

  const handleSave = async () => {
    setLoading(true);
    if (!selectedItem?.id) return;

    const docRef = doc(db, "wutheringProductList", selectedItem.id);
    const { id, group, type, ...otherFields } = selectedItem;

    const updatedData = {
      ...otherFields,
      group,
      type,
      price: parseFloat(otherFields.price) || 0,
    };

    try {
      await updateDoc(docRef, updatedData);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleJSONUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      if (!Array.isArray(jsonData)) {
        alert("Invalid JSON format: must be an array of products.");
        return;
      }

      setLoading(true);
      const batchPromises = jsonData.map(async (item) => {
        if (!item.id) return;
        const docRef = doc(db, "wutheringProductList", item.id);
        const {
          label = "",
          diamonds = 0,
          type = "unknown",
          rupees = 0,
          falseRupees = 0,
          resellerRupees = 0,
          price = 0,
          group = "others",
          api = "yokcash",
        } = item;

        await setDoc(docRef, {
          id: item.id,
          label,
          diamonds,
          type,
          rupees,
          falseRupees,
          resellerRupees,
          price: parseFloat(price) || 0,
          group,
          api,
        });
      });

      await Promise.all(batchPromises);
      alert("JSON imported successfully");
    } catch (err) {
      console.error("JSON upload error:", err);
      alert("Failed to upload JSON: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    setLoading(true);
    const {
      id,
      label,
      diamonds,
      type,
      rupees,
      falseRupees,
      resellerRupees,
      price,
      group,
      api,
    } = newItem;

    if (!id || !label || !type || !rupees || !group || !resellerRupees) {
      alert("Please fill all required fields");
      setLoading(false);
      return;
    }

    const docRef = doc(db, "wutheringProductList", id);
    await setDoc(docRef, {
      id,
      label,
      diamonds,
      type,
      rupees: parseFloat(rupees),
      falseRupees: parseFloat(falseRupees),
      resellerRupees: parseFloat(resellerRupees),
      price: parseFloat(price) || 0,
      group,
      api: api || "yokcash",
    });

    setNewItem({
      id: "",
      type: "",
      label: "",
      diamonds: "",
      rupees: "",
      falseRupees: "",
      resellerRupees: "",
      price: "",
      group: "",
      api: "",
    });
    setShowAddForm(false);
    setLoading(false);
  };

  /* ------------------- FILTER ------------------- */
  const filteredItems = items.filter((item) => {
    if (activeGroup === "others") return item.group !== "lunti";
    return item.group === activeGroup;
  });

  const groupLabels = {
    lunti: "Lunites",
    others: "Others",
  };

  return (
    <div
      className={`py-6 px-2 md:px-20 lg:px-40 ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      {/* ---------- FILTER TABS ---------- */}
      <div className="flex gap-4 mb-6 justify-center">
        {Object.entries(groupLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveGroup(key);
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeGroup === key
                ? isDarkMode
                  ? "bg-yellow-400 text-black"
                  : "bg-yellow-400 text-black"
                : isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Wuthering Waves Products</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-2 text-sm py-1 rounded hover:bg-blue-700"
        >
          {showAddForm ? "Close Add Form" : "Add New Product"}
        </button>
      </div>

      {/* ---------- PRODUCT LIST ---------- */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                setSelectedItem((prev) =>
                  prev?.id === item.id ? null : item
                )
              }
              className={`flex justify-between items-center p-3 rounded-2xl border shadow-md transition-all duration-200 hover:shadow-lg relative ${
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-300 bg-white"
              } ${
                selectedItem?.id === item.id
                  ? isDarkMode
                    ? "ring-2 ring-offset-2 ring-blue-500"
                    : "ring-2 ring-offset-2 ring-blue-400"
                  : ""
              }`}
            >
              {/* API badge */}
              <span
                className={`absolute -top-2 right-0 text-[10px] px-2 py-[2px] rounded-sm text-white font-semibold ${
                  item.api === "yokcash"
                    ? "bg-blue-500"
                    : item.api === "busan"
                    ? "bg-pink-400"
                    : "bg-green-500"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOutOfStock(item);
                }}
              >
                {item.api}
              </span>

              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img
                    className="w-full h-full object-contain rounded-lg"
                    src={typeImageMap[item.type?.toLowerCase()] || d}
                    alt={item.type}
                  />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-[11px] font-semibold">
                    {item.diamonds}{" "}
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
                  {/* In/Out Stock badge */}
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
                  className={`text-xs cursor-pointer px-3 py-[4px] rounded font-medium text-white ${
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

      {/* ---------- EDIT MODAL ---------- */}
      {selectedItem && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[70%] lg:w-[50%] p-6 bottom-20 border rounded-lg shadow-inner overflow-auto max-h-[80vh] z-50 transition-all duration-300 ease-in-out ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-gray-50 border-gray-300 text-gray-900"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              Edit Product ( {selectedItem.id})
            </h3>
            <button
              className="fixed right-10"
              onClick={() => setSelectedItem(null)}
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: "Label", field: "label", type: "text" },
              { label: "Diamonds", field: "diamonds", type: "text" },
              { label: "Type (small)", field: "type", type: "text" },
              { label: "Rupees", field: "rupees", type: "number" },
              { label: "Reseller Rupees", field: "resellerRupees", type: "number" },
              { label: "False Rupees", field: "falseRupees", type: "number" },
              { label: "Price", field: "price", type: "number" },
            ].map(({ label, field, type }) => (
              <div key={field} className="flex flex-col gap-1 text-left">
                <label className="font-medium text-sm">{label}</label>
                <input
                  type={type}
                  value={selectedItem[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            ))}

            {/* Group selector */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="font-medium text-sm">Group</label>
              <div className="flex items-center gap-3">
                <select
                  value={selectedItem.group}
                  onChange={(e) => handleChange("group", e.target.value)}
                  className={`border px-3 py-2 rounded text-sm w-full ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="">Select Group</option>
                  {Object.keys(groupImageMap).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
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

            {/* API (locked) */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="font-medium text-sm">API</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedItem.api || "yokcash"}
                  readOnly
                  className={`border px-3 py-2 rounded text-sm w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed ${
                    isDarkMode
                      ? "border-gray-600 text-gray-200"
                      : "border-gray-300 text-gray-900"
                  }`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (Locked)
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleDelete(selectedItem.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- ADD NEW MODAL ---------- */}
      {showAddForm && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[70%] lg:w-[50%] p-6 bottom-20 border rounded-lg shadow-inner overflow-auto max-h-[80vh] z-50 transition-all duration-300 ease-in-out ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-gray-50 border-gray-300 text-gray-900"
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
              { label: "Diamonds", field: "diamonds", type: "text" },
              { label: "Type (small)", field: "type", type: "text" },
              { label: "Rupees", field: "rupees", type: "number" },
              { label: "Reseller Rupees", field: "resellerRupees", type: "number" },
              { label: "False Rupees", field: "falseRupees", type: "number" },
              { label: "Price", field: "price", type: "number" },
            ].map(({ label, field, type }) => (
              <div key={field} className="flex flex-col gap-1 text-left">
                <label className="font-medium text-sm">{label}</label>
                <input
                  type={type}
                  value={newItem[field] || ""}
                  onChange={(e) => handleNewChange(field, e.target.value)}
                  className={`border px-3 py-2 rounded text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            ))}

            {/* Group selector */}
            <div className="flex flex-col gap-2 mt-1">
              <label className="font-medium text-sm">Group</label>
              <div className="flex items-center gap-3">
                <select
                  value={newItem.group}
                  onChange={(e) => handleNewChange("group", e.target.value)}
                  className={`border px-3 py-2 rounded text-sm w-full ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="">Select Group</option>
                  {Object.keys(groupImageMap).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                {newItem.group && (
                  <img
                    src={groupImageMap[newItem.group]}
                    alt="Group Preview"
                    className="h-10 w-10 rounded-md border"
                  />
                )}
              </div>
            </div>

            {/* API selector */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="font-medium text-sm">API</label>
              <select
                value={newItem.api || "yokcash"}
                onChange={(e) => handleNewChange("api", e.target.value)}
                className={`border px-3 py-2 rounded text-sm w-full ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="yokcash">Yokcash</option>
                <option value="busan">Busan</option>
                <option value="smile">Smile</option>
              </select>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleAddNew}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
              >
                Add Product
              </button>
            </div>

            {/* JSON upload */}
            <div className="mt-4">
              <label htmlFor="jsoninput" className="block font-medium text-sm mb-1">
                Upload from JSON
              </label>
              <input
                type="file"
                id="jsoninput"
                accept=".json"
                onChange={handleJSONUpload}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WutheringAdmin;