import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../../configs/firebase";
import small from "../../../assets/images/small-packs.png"
import { useDarkMode } from "../../../context/DarkModeContext";
const imgMap = {
  small: small,
  medium: "/images/medium.png",
  large: "/images/large.png"
};

const MGlobalAdmin = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("Small packs");
  const [editItem, setEditItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    label: "",
    id: "",
    diamonds: "",
    rupees: "",
    falseRupees: "",
    img: "",
    resellerRupees: "",
    packSize: "",
    outOfStock: false,
    type: "",
    api: ""
  });
  const {isDarkMode} = useDarkMode()
  const categories = [ "Small packs", "Medium packs", "Large packs"];

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
  
  
      const batchPromises = jsonData.map(async (item) => {
        if (!item.id) return;
  
        const docRef = doc(db, "mGlobalProductList", item.id);
        const {
          label = "",
          diamonds = 0,
          type = "unknown",
          rupees = 0,
          falseRupees = 0,
          resellerRupees = 0,
          group = "specials",
          api = 'yokcash'
        } = item;
        
        await setDoc(docRef, {
          id: item.id,
          label,
          diamonds,
          type,
          rupees,
          falseRupees,
          resellerRupees,
          group,
          api,
          packSize:"Small packs",
          img: 'small'
        });
      });
  
      await Promise.all(batchPromises);
      alert("JSON imported successfully ✅");
    } catch (err) {
      console.error("JSON upload error:", err);
      alert("Failed to upload JSON: " + err.message);
    } finally {
    }
  };
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "mGlobalProductList"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a,b)=>a?.price-b?.price);
      setProducts(list);
    });

    return () => unsub();
  }, []);

const handleHide = async (id, currentHide) => {
  if (!id) return;

  try {
    const docRef = doc(db, "mGlobalProductList", id);
    await updateDoc(docRef, { hide: !currentHide }); // Toggle value
  } catch (error) {
    console.error("Error updating hide status:", error);
    alert("Failed to update product visibility: " + error.message);
  }
};

  const toggleStockStatus = async (item) => {
    const ref = doc(db, "mGlobalProductList", item.id);
    await updateDoc(ref, { outOfStock: !item.outOfStock });
  };

  const handleOpenModal = (item) => {
    setForm(item);
    setEditItem(item);
    setShowModal(true);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");
    if (!confirmDelete || !editItem?.id) return;

    try {
      await deleteDoc(doc(db, "mGlobalProductList", editItem.id));
      setShowModal(false);
    } catch (error) {
      alert("Failed to delete the item.");
    }
  };

const handleSave = async () => {
  const { id, label, diamonds, rupees, falseRupees, img, packSize, type, api } = form;

  // if (!id || !label || !diamonds || !rupees || !falseRupees  || !packSize || !type || !api) {
  //   alert("Incomplete");
  //   return;
  // }

  const dataToSave = { ...form, outOfStock: form.outOfStock === "true", api: api || "yokcash" };

  const ref = doc(db, "mGlobalProductList", id);
  editItem ? await updateDoc(ref, dataToSave) : await setDoc(ref, dataToSave);

  setShowModal(false);
};


  const filtered = filter === "All" ? products : products.filter((p) => p.packSize === filter);

return (
  <div className={`px-2 py-6 ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`}>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold">📦 Manage MGlobal Products</h2>

      <div>
        <label
          htmlFor="jsoninput"
          className={`cursor-pointer ${isDarkMode ? "text-blue-400" : "text-blue-600 underline"}`}
        >
          JSON upload
        </label>
        <input
          type="file"
          id="jsoninput"
          accept=".json"
          onChange={handleJSONUpload}
          className="mt-2 hidden"
        />
      </div>

      <button
        onClick={() => {
          setForm({
            label: "",
            id: "",
            diamonds: "",
            rupees: "",
            falseRupees: "",
            img: "",
            resellerRupees: "",
            packSize: "",
            outOfStock: false,
            type: "",
          });
          setEditItem(null);
          setShowModal(true);
        }}
        className={`px-3 py-1 rounded shadow ${
          isDarkMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-500 text-white hover:bg-green-600"
        }`}
      >
        + Add
      </button>
    </div>

    {/* Filter Buttons */}
    <div className="flex justify-between mb-4">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setFilter(cat)}
          className={`px-2 py-1 rounded-md text-sm border ${
            filter === cat
              ? "bg-yellow-400 text-black"
              : isDarkMode
              ? "bg-gray-800 text-gray-300 border-gray-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>

    {/* Product List */}
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {filtered.map((item) => (
    <div
      key={item.id}
      onClick={() => handleOpenModal(item)}
      className={`cursor-pointer border p-3 rounded-xl shadow hover:shadow-md flex justify-between items-center relative ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
      }`}
    >
      {/* Left Section: Image + Info */}
      <div className="flex gap-3 items-center">
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src={imgMap[item.img] || item.img}
            alt={item.label}
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        <div className="flex flex-col relative">
          <span className="text-[11px] font-semibold">
            {item.diamonds} {item.packSize || ""}
          </span>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {item.label}
          </p>

          {/* Stock badge absolute top-left */}
          <span
            className={`absolute -top-5 left-0 text-[10px] px-1 py-[1px] w-fit rounded-sm text-white font-semibold cursor-pointer whitespace-nowrap ${
              item.outOfStock ? "bg-red-500" : "bg-green-500"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleStockStatus(item);
            }}
          >
            {item.outOfStock ? "Out of Stock" : "In Stock"}
          </span>

        </div>
      </div>

      {/* Right Section: Price and Hide Button */}
      <div className="flex flex-col items-end gap-1">
        <div className="text-right">
          <p className="text-green-600 font-bold">₹{item.rupees} | <span className={`text-[12px] line-through ${isDarkMode ? "text-red-400" : "text-red-600"}`}>₹{item.falseRupees}</span></p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>
            Resellet: ₹{item.resellerRupees}
          </p>
   <p className="text-[10px] text-white-500">
              Price: {item?.price}
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


    {/* Modal */}
    {showModal && (
   <div className="fixed inset-0 bg-black bg-opacity-40 flex  justify-center z-50">
  <div
    className={`p-6 rounded-2xl shadow-lg w-[90%] max-w-md space-y-4 overflow-scroll ${
      isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
    }`}
  >
    <h3 className="text-xl font-bold text-center">
      {editItem ? "Edit Product" : "Add Product"}
    </h3>

    {/* Form Fields */}
    <div className="space-y-3">
      {[
        { label: "Label", key: "label" },
        { label: "ID", key: "id" },
        { label: "Diamonds", key: "diamonds" },
        { label: "Rupees", key: "rupees" },
        { label: "False Rupees", key: "falseRupees" },
        { label: "Image Type / URL", key: "img" },
        { label: "Reseller Rupees", key: "resellerRupees" },
        { label: "Pack Size", key: "packSize" },
        { label: "Type", key: "type" },
      ].map(({ label, key }) => (
        <div key={key} className="flex flex-col items-start gap-1">
          <label htmlFor={key} className="text-sm font-medium">
            {label}
          </label>
          <input
            id={key}
            type="text"
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            placeholder={`Enter ${label}`}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
      ))}
    </div>
    {/* API Dropdown */}
<div className="flex flex-col items-start gap-1">
  <label className="text-sm font-medium">API</label>
  <select
    value={form.api || "yokcash"}
    onChange={(e) => setForm({ ...form, api: e.target.value })}
    className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      isDarkMode
        ? "bg-gray-700 border-gray-600 text-gray-100"
        : "bg-white border-gray-300 text-gray-900"
    }`}
  >
    <option value="yokcash">Yokcash</option>
    <option value="busan">Busan</option>
  </select>
</div>


    {/* Action Buttons */}
    <div className="flex justify-between pt-4 items-center">
      {editItem && (
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
          onClick={handleDelete}
        >
          Delete
        </button>
      )}

      <div className="ml-auto flex gap-2">
        <button
          className={`px-4 py-2 rounded-md text-sm ${
            isDarkMode
              ? "bg-gray-600 text-white hover:bg-gray-500"
              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
          }`}
          onClick={() => setShowModal(false)}
        >
          Cancel
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          onClick={handleSave}
        >
          {editItem ? "Update" : "Add"}
        </button>
      </div>
    </div>
  </div>
</div>

    )}
  </div>
);

};

export default MGlobalAdmin;
