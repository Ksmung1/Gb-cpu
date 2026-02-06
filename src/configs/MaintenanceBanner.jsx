import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";

function MaintenanceBanner() {
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const { isAdmin } = useUser();
  const {isDarkMode} = useDarkMode()
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "siteStatus"), (docSnap) => {
      if (docSnap.exists()) {
        setStatus(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (status?.isMaintenanceScheduled && status?.maintenanceStartTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = status.maintenanceStartTime - now;
        if (diff <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const disableMaintenance = async () => {
    try {
      const statusDocRef = doc(db, "config", "siteStatus");
      await updateDoc(statusDocRef, {
        isMaintenance: false,
        isMaintenanceScheduled: false,
        maintenanceStartTime: null,
      });
      alert("Maintenance canceled successfully.");
    } catch (error) {
      alert("Error: " + error.message);
      console.error("Failed to disable maintenance:", error);
    }
  };

  if (status?.isMaintenance) {
    return (
    <div
  className={`w-full text-center py-4 font-semibold ${
    isDarkMode
      ? "bg-indigo-800 text-indigo-100"
      : "bg-indigo-600 text-white"
  }`}
>
  Our site is currently undergoing maintenance. We’ll be back shortly — thank you for your patience.
  <button className="underline" onClick={disableMaintenance}>STOP MAINTENANCE</button>
</div>

    );
  }

  if (status?.isMaintenanceScheduled && timeLeft !== null) {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

return (
  <div
    className={`w-full text-center p-4 font-medium shadow-md ${
      isDarkMode
        ? "bg-blue-900 text-blue-200"
        : "bg-blue-100 text-blue-900"
    }`}
  >
    <p className="text-xs">
      Scheduled maintenance will begin in{" "}
      <strong>
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </strong>
      . We kindly recommend you avoid transactions during this period to prevent any issues.
    </p>
    {isAdmin && (
      <button
        onClick={disableMaintenance}
        className={`mt-2 px-2 text-xs py-1 rounded-lg transition ${
          isDarkMode
            ? "bg-blue-700 text-white hover:bg-blue-600"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        Cancel Scheduled Maintenance
      </button>
    )}
  </div>
);

  }

  return null;
}

export default MaintenanceBanner;
