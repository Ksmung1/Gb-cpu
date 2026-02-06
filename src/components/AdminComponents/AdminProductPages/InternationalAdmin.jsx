import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../configs/firebase";
import { useDarkMode } from "../../../context/DarkModeContext";

const InternationalAdmin = () => {
  const [products, setProducts] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  const countryList = [...new Set(products.map((p) => p.country || "Other"))];

  const [form, setForm] = useState({
    label: "",
    id: "",
    diamonds: "",
    country: "",
    rupees: "",
    falseRupees: "",
    hide: false,
    api: "",
    resellerRupees: "",
  });

  const { isDarkMode } = useDarkMode();

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

        const docRef = doc(db, "internationalProductList", item.id);
        const {
          label = "",
          id = "",
          diamonds = "",
          country = "",
          rupees = "",
          falseRupees = "",
          hide = false,
          api = "",
          resellerRupees = "",
        } = item;

        await setDoc(docRef, {
          id,
          label,
          diamonds,
          rupees,
          country,
          falseRupees,
          api,
          resellerRupees,
          hide,
        });
      });

      await Promise.all(batchPromises);
      alert("JSON imported successfully ✅");
    } catch (err) {
      console.error("JSON upload error:", err);
      alert("Failed to upload JSON: " + err.message);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "internationalProductList"), (snapshot) => {
      const list = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => (a.price || 0) - (b.price || 0));
      setProducts(list);
      // Only set selectedCountry if it hasn't been set yet
      if (!selectedCountry && list.length > 0) {
        setSelectedCountry(list[0].country || "Other");
      }
    });

    return () => unsub();
  }, [selectedCountry]);

  const handleHide = async (id, currentHide) => {
    try {
      const docRef = doc(db, "internationalProductList", id);
      await updateDoc(docRef, { hide: !currentHide });
    } catch (error) {
      alert("Error updating hide status");
    }
  };

  const handleToggleOutOfStock = async (id, currentStatus) => {
    try {
      const docRef = doc(db, "internationalProductList", id);
      await updateDoc(docRef, { outOfStock: !currentStatus });
    } catch (error) {
      alert("Error updating outOfStock status");
    }
  };

  const handleDelete = async () => {
    if (!editItem?.id) return;
    const confirmDelete = window.confirm("Delete this item?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "internationalProductList", editItem.id));
      setShowModal(false);
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const handleSave = async () => {
    const { id, label, diamonds, country, rupees, falseRupees, api, resellerRupees } = form;
    if (!id || !label || !diamonds || !country || !rupees) {
      alert("Incomplete form");
      return;
    }

    const ref = doc(db, "internationalProductList", id);
    editItem ? await updateDoc(ref, form) : await setDoc(ref, form);
    setShowModal(false);
  };

  return (
    <div className={`px-2 py-6 ${isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🌍 Manage International Products</h2>

        <div>
          <label htmlFor="jsoninput" className="cursor-pointer underline text-blue-500">
            Upload JSON
          </label>
          <input type="file" id="jsoninput" accept=".json" onChange={handleJSONUpload} className="hidden" />
        </div>

        <button
          onClick={() => {
            setForm({
              label: "",
              id: "",
              diamonds: "",
              country: "",
              rupees: "",
              falseRupees: "",
              hide: false,
              api: "yokcash", // Set default to yokcash
              resellerRupees: "",
            });
            setEditItem(null);
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          + Add
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {countryList.map((country) => (
          <button
            key={country}
            onClick={() => setSelectedCountry(country)}
            className={`px-3 py-1 rounded border text-sm ${
              selectedCountry === country
                ? "bg-blue-500 text-white"
                : isDarkMode
                ? "bg-gray-700 text-gray-200 border-gray-600"
                : "bg-gray-200 text-gray-800 border-gray-300"
            }`}
          >
            {country}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products
          .filter((item) => item.country === selectedCountry)
          .map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setEditItem(item);
                setForm(item);
                setShowModal(true);
              }}
              className={`flex items-center justify-between gap-3 border p-3 rounded shadow hover:shadow-md cursor-pointer ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              }`}
            >
              {/* LEFT: Label + Diamonds */}
              <div className="flex-1">
                <h4 className="font-bold text-sm">{item.label}</h4>
                <p className="text-xs text-gray-500">💎 {item.diamonds}</p>
              </div>

              {/* CENTER: Hide / Out of Stock */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHide(item.id, item.hide);
                  }}
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    item.hide
                      ? "bg-orange-500 text-white"
                      : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {item.hide ? "SHOW" : "HIDE"}
                </button>

                <button
                  title={item.outOfStock ? "Mark as In Stock" : "Mark as Out of Stock"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleOutOfStock(item.id, item.outOfStock);
                  }}
                  className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 ${
                    item.outOfStock
                      ? "bg-red-600 text-white"
                      : "bg-green-400 text-white"
                  }`}
                >
                  <span className="text-[10px]">{item.outOfStock ? "Out of Stock" : "In Stock"}</span>
                </button>
              </div>

              {/* RIGHT: Pricing */}
              <div className="text-right text-xs">
                <p className="font-bold text-xs text-green-600">₹{item.rupees} | <span className="text-red-600">₹{item.falseRupees}</span></p>
                <p className="text-xs text-gray-400">Price: {item.price}</p>
                <p className="text-xs text-blue-500">Reseller: ₹{item.resellerRupees}</p>
              </div>
            </div>
          ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-md shadow-md w-[90%] max-w-md space-y-3 ${
              isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"
            }`}
          >
            <h3 className="text-lg font-semibold">{editItem ? "Edit" : "Add"} Product</h3>
            {["label", "id", "diamonds", "country", "rupees", "falseRupees", "resellerRupees"].map((key) => (
              <div key={key} className="flex flex-col text-left">
                <label className="block text-sm font-medium">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())}
                </label>
                <input
                  className="w-full border px-3 py-1 rounded text-sm"
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}

            {/* API Dropdown */}
            <div className="flex flex-col text-left">
              <label className="block text-sm font-medium">API</label>
              <select
                value={form.api || "yokcash"}
                onChange={(e) => setForm({ ...form, api: e.target.value })}
                className="w-full border bg-gray-800 px-3 py-1 rounded text-white text-sm"
              >
                <option value="yokcash">Yokcash</option>
                <option value="smile">Smile</option>
              </select>
            </div>

            <div className="flex justify-between pt-3">
              {editItem && (
                <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleDelete}>
                  Delete
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button className="px-3 py-1 rounded bg-gray-400 text-white" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleSave}>
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

export default InternationalAdmin;