import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useAlert } from "../../context/AlertContext";
import { useUser } from "../../context/UserContext";

const ApiProducts = () => {
  const { user } = useUser();
  const [batchValue, setBatchValue] = useState();
  const isAdmin = user?.role === "admin" || false;
  const [products, setProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  const { showAlert } = useAlert();
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // --- Add Product modal state ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    id: "",
    label: "",
    price: "",
    product: "",
    status: "active",
    sp: "",
  });

  // ---------------- Listen to Firestore collection ----------------
  useEffect(() => {
    setLoadingProducts(true);
    setError("");

    const colRef = collection(db, "apiProductList");

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const rawList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        const finalList = rawList.sort((a, b) => {
          // 1) sort by product name so same products stay together
          const prodA = a.product?.toString() || ""; // <-- use your real field: product / game / productName etc.
          const prodB = b.product?.toString() || "";

          const byProduct = prodA.localeCompare(prodB);
          if (byProduct !== 0) return byProduct;

          // 2) if same product, sort by numeric price
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return priceA - priceB; // ascending
        });

        setProducts(finalList);
        setLoadingProducts(false);
      },
      (err) => {
        console.error(err);
        setError(err.message || "Failed to fetch products");
        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ---------------- Handle field edits ----------------
  const handleEdit = (id, field, value) => {
    if (!isAdmin) return; // safety
    setEditedProducts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // ---------------- Save all changes ----------------
  const saveChanges = async () => {
    if (!isAdmin) return;
    if (Object.keys(editedProducts).length === 0) return;

    setSaving(true);

    try {
      const colRef = collection(db, "apiProductList");

      const updates = Object.entries(editedProducts).map(
        async ([id, updatedFields]) => {
          const docRef = doc(colRef, id);
          await setDoc(docRef, updatedFields, { merge: true });
        }
      );

      await Promise.all(updates);

      setEditedProducts({});
      showAlert("Changes saved successfully!");
    } catch (err) {
      console.error(err);
      showAlert("Error saving changes: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------- Delete a product ----------------
  const handleDelete = async (id) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmed) return;

    try {
      const colRef = collection(db, "apiProductList");
      const docRef = doc(colRef, id);
      await deleteDoc(docRef);
      showAlert("Product deleted successfully");
    } catch (err) {
      console.error(err);
      showAlert("Error deleting product: " + err.message);
    }
  };

  // ---------------- Add product modal handlers ----------------
  const openAddModal = () => {
    if (!isAdmin) return;
    setNewProduct({
      id: "",
      label: "",
      price: "",
      product: "",
      status: "active",
      sp: "",
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (adding) return;
    setShowAddModal(false);
  };

  const handleNewProductChange = (field, value) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const { id, label, price, product, status, sp } = newProduct;

    if (!id || !label || !price || !product || !status || !sp) {
      showAlert("Please fill all fields");
      return;
    }

    setAdding(true);
    try {
      const colRef = collection(db, "apiProductList");
      const docRef = doc(colRef, String(id));

      await setDoc(
        docRef,
        {
          id: String(id),
          label,
          price: Number(price),
          product,
          status,
          sp,
        },
        { merge: true }
      );

      showAlert("Product added/updated successfully");
      setShowAddModal(false);
      setNewProduct({
        id: "",
        label: "",
        sp: "",
        price: "",
        product: "",
        status: "active",
      });
    } catch (err) {
      console.error(err);
      showAlert("Error adding product: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  // ---------------- JSON upload handler ----------------
  const handleJsonUpload = async (event) => {
    if (!isAdmin) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage("");
    setError("");

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        const parsed = JSON.parse(text);
        const productsArray = Array.isArray(parsed) ? parsed : [parsed];

        const invalid = productsArray.some(
          (p) =>
            !p.id || !p.label || !p.price || !p.product || !p.status || !p.sp
        );

        if (invalid) {
          setUploadMessage(
            "Invalid JSON format. Each product must have id, label, price, product, status, sp."
          );
          return;
        }

        setUploading(true);

        const colRef = collection(db, "apiProductList");

        const writes = productsArray.map(async (p) => {
          const docRef = doc(colRef, String(p.id));
          await setDoc(
            docRef,
            {
              id: p.id,
              label: p.label,
              price: Number(p.price),
              product: p.product,
              status: p.status,
              sp: p.sp,
            },
            { merge: true }
          );
        });

        await Promise.all(writes);

        setUploadMessage("JSON uploaded successfully!");
      } catch (err) {
        console.error(err);
        setUploadMessage(err.message || "Failed to upload JSON");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsText(file);
  };
  const updateMobileLegendsPrices = async (multiplier) => {
    try {
      const colRef = collection(db, "apiProductList");

      // Only fetch Mobile Legends
      const q = query(colRef, where("product", "==", "Mobile Legends"));
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const oldPrice = Number(data.sp); // multiply the SP
        const newPrice = Math.round(oldPrice * multiplier);

        const docRef = doc(db, "apiProductList", docSnap.id);

        return updateDoc(docRef, { price: newPrice });
      });

      await Promise.all(updates);

      alert("Mobile Legends prices updated!");
    } catch (err) {
      console.error(err);
      alert("Error updating prices: " + err.message);
    }
  };

  return (
    <div style={{ padding: "1.5rem", position: "relative" }}>
      <div className="flex max-w-5xl flex-row justify-center gap-5 mx-auto">
        {/* Upload JSON + Add Product — ADMIN ONLY */}

        {isAdmin && (
          <section className="bg-white flex flex-col gap-3 flex-1 p-4 w-fit rounded-md shadow-sm">
            <div>
              <h2 className="font-semibold">Upload Products JSON</h2>
              <input
                type="file"
                className="bg-gray-50 p-1 rounded-sm px-4 w-full"
                accept="application/json"
                onChange={handleJsonUpload}
                disabled={uploading}
                style={{ marginTop: "0.75rem" }}
              />

              {uploading && <p>Uploading JSON...</p>}
              {uploadMessage && (
                <p style={{ marginTop: "0.5rem", color: "green" }}>
                  {uploadMessage}
                </p>
              )}
            </div>

            {/* Add single product button */}
            <button
              className="p-1 px-4 bg-blue-500 text-white"
              onClick={openAddModal}
            >
              + Add Product
            </button>
          </section>
        )}
        {isAdmin && (
          <section className="flex flex-1 w-fit flex-col p-4 bg-white shadow-md rounded-sm mx-auto items-center">
            <input
              type="number"
              className="border-1 w-full p-2 text-center rounded-lg "
              placeholder="Enter Stock rate "
              value={batchValue}
              onChange={(e) => setBatchValue(e.target.value)}
            />

            <button
              className="text-center p-2 mt-3 bg-black text-white rounded w-full"
              onClick={() => updateMobileLegendsPrices(Number(batchValue))}
            >
              Update ML Prices
            </button>
          </section>
        )}
      </div>

      {/* Save Button — ADMIN ONLY */}
      {isAdmin && Object.keys(editedProducts).length > 0 && (
        <button
          onClick={saveChanges}
          disabled={saving}
          style={{
            padding: "10px 20px",
            marginBottom: "15px",
            background: saving ? "#aaa" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}

      {/* Product table */}
      <section>
        {loadingProducts && <p>Loading products...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loadingProducts && !error && products.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Label</th>
                  <th style={thStyle}>Price</th>
                  {user?.role === "admin" && (
                    <th style={thStyle}>Smile Price</th>
                  )}
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td style={tdStyle}>{product.id}</td>
                    <td style={tdStyle}>{product.label}</td>

                    {/* Editable Price (admin only) */}
                    <td style={tdStyle}>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={
                          editedProducts[product.id]?.price ?? product.price
                        }
                        onChange={
                          isAdmin
                            ? (e) =>
                                handleEdit(
                                  product.id,
                                  "price",
                                  Number(e.target.value)
                                )
                            : undefined
                        }
                        style={{ width: "80px" }}
                      />
                    </td>
                    {user.role === "admin" && (
                      <td style={tdStyle}>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={editedProducts[product.id]?.sp ?? product.sp}
                          onChange={
                            isAdmin
                              ? (e) =>
                                  handleEdit(
                                    product.id,
                                    "sp",
                                    Number(e.target.value)
                                  )
                              : undefined
                          }
                          style={{ width: "80px" }}
                        />
                      </td>
                    )}

                    <td style={tdStyle}>{product.product}</td>

                    {/* Toggle status (admin button vs text) */}
                    <td style={tdStyle}>
                      {isAdmin ? (
                        <button
                          onClick={() =>
                            handleEdit(
                              product.id,
                              "status",
                              (editedProducts[product.id]?.status ??
                                product.status) === "active"
                                ? "disabled"
                                : "active"
                            )
                          }
                          style={{
                            padding: "4px 10px",
                            borderRadius: "5px",
                            border: "none",
                            background:
                              (editedProducts[product.id]?.status ??
                                product.status) === "active"
                                ? "green"
                                : "gray",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          {editedProducts[product.id]?.status ?? product.status}
                        </button>
                      ) : (
                        <span>
                          {editedProducts[product.id]?.status ?? product.status}
                        </span>
                      )}
                    </td>

                    {/* Delete button — admin only */}
                    <td style={tdStyle}>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(product.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "5px",
                            border: "none",
                            background: "#e53935",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadingProducts && !error && products.length === 0 && (
          <p>No products found.</p>
        )}
      </section>

      {/* Add Product Modal — ADMIN ONLY */}
      {isAdmin && showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>
              Add / Update Product
            </h2>

            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label>
                  ID
                  <input
                    type="text"
                    value={newProduct.id}
                    onChange={(e) =>
                      handleNewProductChange("id", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label>
                  Label
                  <input
                    type="text"
                    value={newProduct.label}
                    onChange={(e) =>
                      handleNewProductChange("label", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label>
                  Price
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      handleNewProductChange("price", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label>
                  Smile Price
                  <input
                    type="number"
                    value={newProduct.sp}
                    onChange={(e) =>
                      handleNewProductChange("sp", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label>
                  Product
                  <input
                    type="text"
                    value={newProduct.product}
                    onChange={(e) =>
                      handleNewProductChange("product", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label>
                  Status
                  <select
                    value={newProduct.status}
                    onChange={(e) =>
                      handleNewProductChange("status", e.target.value)
                    }
                    style={{
                      ...inputStyle,
                      paddingRight: "0.5rem",
                    }}
                  >
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={adding}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    background: "#f5f5f5",
                    cursor: adding ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: adding ? "#aaa" : "#1976d2",
                    color: "white",
                    cursor: adding ? "not-allowed" : "pointer",
                  }}
                >
                  {adding ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  borderBottom: "1px solid #ccc",
  padding: "0.5rem",
  textAlign: "left",
  background: "#f7f7f7",
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: "0.5rem",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: "0.25rem",
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid " + "#ccc",
  boxSizing: "border-box",
};

export default ApiProducts;
