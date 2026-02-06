import { useUser } from "../context/UserContext";
import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useDarkMode } from "../context/DarkModeContext";
const Maintenance = () =>{
          const {isAdmin } = useUser()
          const {isDarkMode} = useDarkMode()
const disableMaintenance = async () => {
  try {
    const statusDocRef = doc(db, "config", "siteStatus");
    await updateDoc(statusDocRef, { isMaintenance: false,isMaintenanceScheduled: false, maintenanceStartTime: null });
    alert("Maintenance disabled.");
  } catch (error) {
    alert("Error: " + error.message);
    console.error("Failed to disable maintenance:", error);
  }
};
return (
  <div
    className={`min-h-screen flex flex-col justify-center items-center p-4
      ${
        isDarkMode
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-100 text-gray-700"
      }`}
  >
    <h1 className="text-xl font-bold mb-4">🚧 Site Under Maintenance 🚧</h1>
    <p className="text-sm max-w-md text-center mb-8">
      Sorry for the inconvenience. We're doing some work on the site and will be back shortly. Please check back later.
    </p>

    {isAdmin && (
      <button
        onClick={disableMaintenance}
        className={`px-4 py-2 rounded-lg font-semibold transition 
          ${
            isDarkMode
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-green-400 hover:bg-green-500 text-gray-900"
          }`}
      >
        Disable Maintenance Mode
      </button>
    )}
  </div>
);

}



export default Maintenance;
