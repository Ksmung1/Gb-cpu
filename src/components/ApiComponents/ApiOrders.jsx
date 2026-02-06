import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";

const ApiOrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailsMode, setDetailsMode] = useState(false);

  const isAdmin = user?.role === "admin";
  const isApiUser = user?.role === "api";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isAdmin && !isApiUser) {
      setLoading(false);
      setError("You do not have access to view API orders.");
      return;
    }

    setLoading(true);
    setError("");

    const colRef = collection(db, "apiOrders");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // If api role, filter by their order IDs stored in user.apiOrders
        if (isApiUser && !isAdmin) {
          const allowedIds = Array.isArray(user.apiOrders)
            ? user.apiOrders
            : [];
          list = list.filter((order) =>
            allowedIds.includes(order.orderId || order.id)
          );
        }

        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message || "Failed to fetch orders.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin, isApiUser]);

  const formatDate = (ts) => {
    if (!ts) return "-";
    try {
      // supports Firestore Timestamp or ISO/string/number
      const date =
        ts.toDate?.() ??
        (typeof ts === "number" ? new Date(ts) : new Date(ts));
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleString();
    } catch {
      return "-";
    }
  };

  if (!user) {
    return (
      <div className="mt-10 px-4 text-black">
        <p>Please log in to view your API orders.</p>
      </div>
    );
  }

  if (!isAdmin && !isApiUser) {
    return (
      <div className="mt-10 px-4 text-black">
        <h1 className="text-2xl font-bold mb-2">API Orders</h1>
        <p className="text-gray-700">
          You do not have access to this page. Only users with{" "}
          <span className="font-mono">api</span> or{" "}
          <span className="font-mono">admin</span> roles can view API orders.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 px-4 text-black max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">API Orders</h1>

        <button
          onClick={() => setDetailsMode((prev) => !prev)}
          className="px-3 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        >
          {detailsMode ? "Brief mode" : "Details mode"}
        </button>
      </div>

      {loading && <p>Loading orders...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="text-gray-700">No orders found.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="overflow-x-auto mt-3">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {/* Brief mode columns */}
                <th className={thClass}>ID</th>
                <th className={thClass}>User ID</th>
                <th className={thClass}>Zone ID</th>
                <th className={thClass}>Item</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Created At</th>
                <th className={thClass}>Cost</th>

                {/* Details mode extra columns */}
                {detailsMode && (
                  <>
                    <th className={thClass}>User UID</th>
                    <th className={thClass}>Product ID</th>
                    <th className={thClass}>API Order Id</th>
                    {isAdmin && (
                      <>
                        <th className={thClass}>Provider</th>
                        <th className={thClass}>Provider Order ID</th>
                      </>
                    )}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b hover:bg-gray-50 text-sm"
                >
                  {/* Brief mode data */}
                  <td className={tdClass}>{order.orderId || order.id}</td>
                  <td className={tdClass}>{order.userId || "-"}</td>
                  <td className={tdClass}>{order.zoneId || "-"}</td>
                  <td className={tdClass}>{order.item || order.product || "-"}</td>
                  <td className={tdClass}>{order.status || "-"}</td>
                  <td className={tdClass}>{formatDate(order.createdAt)}</td>
                  <td className={tdClass}>
                    {order.cost != null ? `${order.cost}` : "-"}
                  </td>

                  {/* Details mode extra data */}
                  {detailsMode && (
                    <>
                      <td className={tdClass}>{order.userUid || "-"}</td>
                      <td className={tdClass}>{order.productId || "-"}</td>
                      <td className={tdClass}>{order.apiOrderId || "-"}</td>
                      {isAdmin && (
                        <>
                          <td className={tdClass}>{order.provider || "-"}</td>
                          <td className={tdClass}>
                            {order.providerOrderId || "-"}
                          </td>
                        </>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thClass =
  "px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b";
const tdClass = "px-3 py-2 border-b align-top";

export default ApiOrders;
