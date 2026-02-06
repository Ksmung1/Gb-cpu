import React, { useEffect, useState, useRef } from "react";
import { doc, updateDoc, setDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useUser } from "../../context/UserContext";
import { GetSmileBalance } from "../../utils/GetSmileBalance";
import { fetchUsers } from "../../utils/fetchUsers";
import { fetchGlobalOrders } from "../../utils/fetchGlobalOrders";
import { fetchUserStats } from "../../utils/fetchUserStats";
import UserList from "../AdminComponents/UserList";
import OrderList from "../AdminComponents/OrderList";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai";
import AdminProducts from "../AdminComponents/AdminProducts";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { useAlert } from "../../context/AlertContext";
import AdminBanner from "../AdminComponents/AdminBanner";
import AdminRedeem from "../AdminComponents/AdminRedeem";
import { getYokcashBalance } from "../../utils/getYokcashBalance";
import { useDarkMode } from "../../context/DarkModeContext";
import { FiRefreshCw } from "react-icons/fi";
import UploadSkins from "../AdminComponents/UploadSkins";
import UploadAssets from "../AdminComponents/UploadAssets";
import CollageAdmin from "../AdminComponents/CollageAdmin";
import SmileHistory from "../AdminComponents/SmileHistory";

const Admin = () => {
  const { user, hasPendingOrders } = useUser();
  const { showAlert, showConfirm } = useAlert();
  const dropdownRef = useRef(null);
  const [fetchingYokcash, setFetchingYokcash] = useState(false);
  const [smileBalance, setSmileBalance] = useState(0);
  const [yokcashBalance, setYokcashBalance] = useState(null);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [globalOrders, setGlobalOrders] = useState([]);
  const { isDarkMode } = useDarkMode();
  const [openAdminPanel, setOpenAdminPanel] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState("dashboard");
  const [searchUser, setSearchUser] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [filterIsTopup, setFilterIsTopup] = useState("all");

  // Bharat Toggle State
  const [bharatEnabled, setBharatEnabled] = useState(false);
  const [loadingBharat, setLoadingBharat] = useState(true);
  const [togglingBharat, setTogglingBharat] = useState(false); // ← NEW: Prevents double click + shows processing

  // Fetch Bharat Toggle Status
  useEffect(() => {
    const toggleRef = doc(db, "config", "bharatToggle");
    
    const unsubscribe = onSnapshot(
      toggleRef,
      (snap) => {
        const data = snap.data();
        setBharatEnabled(data?.toggle === true);
        setLoadingBharat(false);
      },
      (error) => {
        console.error("Error listening to bharatToggle:", error);
        setBharatEnabled(false);
        setLoadingBharat(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  const toggleBharatMode = async () => {
    if (togglingBharat) return; // Prevent double execution

    const newState = !bharatEnabled;
    setTogglingBharat(true);

    showConfirm(
      `Turn Bharat Mode ${newState ? "ON" : "OFF"}?`,
      async () => {
        try {
          // 1. Update global toggle
          await setDoc(
            doc(db, "config", "bharatToggle"),
            { toggle: newState },
            { merge: true }
          );

          // 2. Reset ALL users' hideBharatTutorial to false when TURNING OFF
          if (!newState) {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);

            const batchUpdates = snapshot.docs.map((userDoc) =>
              updateDoc(userDoc.ref, { hideBharatTutorial: false })
            );

            await Promise.all(batchUpdates);
            console.log(`Reset hideBharatTutorial for ${snapshot.size} users (Bharat Mode OFF)`);
          }

          // 3. Update local UI state
          setBharatEnabled(newState);
          showAlert(`Bharat Mode is now ${newState ? "ON" : "OFF"}`);
        } catch (error) {
          console.error("Failed to toggle Bharat mode:", error);
          showAlert("Failed to update Bharat mode");
        } finally {
          setTogglingBharat(false);
        }
      },
      () => {
        // On cancel
        setTogglingBharat(false);
      }
    );
  };

  useEffect(() => {
    if (user) {
      GetSmileBalance().then(setSmileBalance);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  useEffect(() => {
    fetchGlobalOrders().then(setGlobalOrders);
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchUserStats(users).then(setUserStats);
    }
  }, [users]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenAdminPanel(false);
      }
    };
    if (openAdminPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openAdminPanel]);

  const handlePanelSelect = (panel) => {
    setSelectedPanel(panel);
    setOpenAdminPanel(false);
  };

  const toggleAdminPanel = () => {
    setOpenAdminPanel((prev) => !prev);
  };

  const shutDownWebsite = (minutesFromNow = 5) => {
    showConfirm("Shut down website?", async () => {
      const startTimestamp = Date.now() + minutesFromNow * 60 * 1000;
      setOpenAdminPanel(false);
      try {
        await setDoc(
          doc(db, "config", "siteStatus"),
          {
            isMaintenanceScheduled: true,
            maintenanceStartTime: startTimestamp,
            isMaintenance: false,
          },
          { merge: true }
        );
        showAlert("Maintenance scheduled successfully");
      } catch (error) {
        console.error("Failed to schedule maintenance:", error);
        showAlert("Failed to schedule maintenance");
      }
    });
  };

  async function handleSmileCall() {
    const collectionNames = [
      "mlProductList",
      "mGlobalProductList",
      "magicChessProductList",
      "mlCustomProductList"
    ];
    try {
      const smileBalance = await GetSmileBalance();
      console.log("Smile balance fetched:", smileBalance);
      const snapshots = await Promise.all(
        collectionNames.map((col) => getDocs(collection(db, col)))
      );
      let updatedCount = 0;
      for (const snapshot of snapshots) {
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.api === "smile") {
            const productId = docSnap.id;
            const currentPrice = parseFloat(data.price) || 0;
            const outOfStock = currentPrice < smileBalance;
            await updateDoc(docSnap.ref, { outOfStock });
            console.log(`Updated product ${productId}: outOfStock=${outOfStock}`);
            updatedCount++;
          }
        }
      }
      console.log(`Smile: Updated ${updatedCount} matching documents with outOfStock status`);
      return true;
    } catch (error) {
      console.error("Error in handleSmileCall:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      showAlert("Error updating Smile outOfStock status");
      return false;
    }
  }

  async function handleYokcashServerCall() {
    const collectionNames = [
      "mlProductList",
      "mGlobalProductList",
      "magicChessProductList",
      "honkaiProductList",
      "pubgProductList",
      "internationalProductList",
      "genshinProductList",
      "zenlessProductList",
      "wutheringProductList"
    ];
    try {
      const yokcashBalance = await getYokcashBalance();
      console.log("Yokcash balance fetched:", yokcashBalance);
      const url = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${url}/get-services`, { method: 'POST' });
      const json = await response.json();
      const services = json.data;
      const priceMap = {};
      services.forEach(svc => {
        if (svc.id) {
          priceMap[svc.id] = parseFloat(svc.harga_pro) || 0;
        }
      });
      const snapshots = await Promise.all(
        collectionNames.map((col) => getDocs(collection(db, col)))
      );
      let updatedCount = 0;
      for (const snapshot of snapshots) {
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.api !== "yokcash") continue;
          const productId = docSnap.id;
          const newPrice = priceMap[productId];
          if (newPrice !== undefined) {
            const outOfStock = newPrice > yokcashBalance;
            const priceChanged = parseFloat(data.price) !== newPrice;
            const stockChanged = data.outOfStock !== outOfStock;
            if (priceChanged || stockChanged) {
              await updateDoc(docSnap.ref, {
                price: newPrice,
                outOfStock,
              });
              console.log(`Updated ${productId}: price=${newPrice}, outOfStock=${outOfStock}`);
              updatedCount++;
            }
          }
        }
      }
      console.log(`Yokcash: Updated ${updatedCount} products with price & outOfStock`);
      return true;
    } catch (error) {
      console.error("Error in handleYokcashServerCall:", error);
      showAlert("Error updating Yokcash prices/out-of-stock");
      return false;
    }
  }

  return (
    <div className={`p-4 md:px-20 lg:px-40 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-5 flex-row justify-between w-full space-x-4">
          <div className="bg-blue-800 cursor-pointer text-white p-1 rounded">
            <button
              disabled={fetchingYokcash}
              onClick={async (e) => {
                e.preventDefault();
                setFetchingYokcash(true);
                try {
                  const success = await handleYokcashServerCall();
                  const success2 = await handleSmileCall();
                  if (success2) {
                    console.log("Price update successful");
                    showAlert("Price update successful");
                  } else {
                    console.warn("Price update partially failed:", { yokcash: success, smile: success2 });
                    showAlert("Price update partially failed");
                  }
                } catch (err) {
                  console.error("Error updating prices:", err);
                  showAlert("Error updating prices");
                } finally {
                  setFetchingYokcash(false);
                }
              }}
            >
              <FiRefreshCw
                className={`transition-transform duration-300 ${fetchingYokcash ? "animate-spin" : ""}`}
                size={18}
              />
            </button>
          </div>

          <div className="fixed right-10 z-50">
            {openAdminPanel ? (
              <AiOutlineClose
                onClick={toggleAdminPanel}
                size={30}
                className="cursor-pointer"
                title="Close menu"
              />
            ) : (
              <div className="relative">
                <GiHamburgerMenu
                  onClick={toggleAdminPanel}
                  size={30}
                  className="cursor-pointer"
                  title="Open menu"
                />
                {hasPendingOrders && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {openAdminPanel && (
        <div
          ref={dropdownRef}
          className={`${
            isDarkMode
              ? 'bg-gray-800 text-gray-100 border-gray-700'
              : 'bg-white text-gray-900 border-gray-200'
          } fixed top-30 right-4 rounded-lg shadow-lg w-48 z-50 border`}
        >
          <ul className="py-4 flex flex-col">
            {['dashboard', 'users', 'products', 'orders', 'queues', 'banner', 'collage', 'smile-history'].map((panel) => (
              <li
                key={panel}
                className={`${
                  isDarkMode ? 'hover:bg-blue-700 border-gray-700' : 'hover:bg-blue-100 border-gray-200'
                } cursor-pointer p-3 border-b flex items-center justify-between`}
                onClick={() => handlePanelSelect(panel)}
              >
                <span>{panel === 'smile-history' ? 'Smile History' : panel.charAt(0).toUpperCase() + panel.slice(1)}</span>
                {panel === 'queues' && hasPendingOrders && (
                  <span className="ml-2 w-2.5 h-2.5 rounded-full bg-red-500" />
                )}
              </li>
            ))}

            {/* Bharat Mode Toggle - Now with disabled + processing state */}
            <li
              className={`p-3 border-b flex items-center justify-between ${
                togglingBharat || loadingBharat
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-blue-700'
              } ${isDarkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-100'}`}
              onClick={() => !(togglingBharat || loadingBharat) && toggleBharatMode()}
            >
              <span>Bharat Mode</span>
              <div className="flex items-center gap-2">
                {loadingBharat ? (
                  <span className="text-xs">Loading...</span>
                ) : togglingBharat ? (
                  <span className="text-xs animate-pulse">Processing...</span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      bharatEnabled
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {bharatEnabled ? 'ON' : 'OFF'}
                  </span>
                )}
              </div>
            </li>

            <li
              className="cursor-pointer text-center bg-red-600 hover:bg-red-700 mx-3 text-white rounded-full p-3 border-b"
              onClick={() => shutDownWebsite()}
            >
              Maintenance
            </li>
          </ul>
        </div>
      )}

      {selectedPanel === "users" && (
        <UserList
          users={users}
          userStats={userStats}
          search={searchUser}
          setSearchUser={setSearchUser}
          isDarkMode={isDarkMode}
        />
      )}
      {selectedPanel === "queues" && <AdminRedeem isDarkMode={isDarkMode} />}
      {selectedPanel === "dashboard" && <AdminDashboard isDarkMode={isDarkMode} />}
      {selectedPanel === "orders" && (
        <>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search order by UID, username or user"
              className={`border px-3 py-2 w-full md:w-1/2 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : ''}`}
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />
            <select
              className={`border px-3 py-2 w-full md:w-1/2 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : ''}`}
              value={filterIsTopup}
              onChange={(e) => setFilterIsTopup(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="true">Topup Orders Only</option>
              <option value="false">ML Orders Only</option>
              <option value="genshin">Genshin Orders Only</option>
            </select>
          </div>
          <OrderList
            orders={globalOrders}
            filter={filterIsTopup}
            search={searchOrder}
            isDarkMode={isDarkMode}
          />
        </>
      )}
      {selectedPanel === "products" && (
        <div className={`text-center mt-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          <h2 className="text-xl font-semibold">Products Panel</h2>
          <p>Add your products management here.</p>
          <AdminProducts isDarkMode={isDarkMode} />
        </div>
      )}
      {!selectedPanel && !openAdminPanel && (
        <div className={`text-center mt-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>Select a panel from the menu (top right menu) to get started.</p>
        </div>
      )}
      {selectedPanel === "banner" && <AdminBanner isDarkMode={isDarkMode} />}
      {selectedPanel === "collage" && <CollageAdmin />}
      {selectedPanel === "smile-history" && <SmileHistory isDarkMode={isDarkMode} />}
    </div>
  );
};

export default Admin;