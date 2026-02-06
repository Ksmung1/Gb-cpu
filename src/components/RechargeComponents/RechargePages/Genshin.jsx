// src/pages/Genshin.jsx
import GenshinProductList from "./Genshins/GenshinProductList";
import GenshinDisplay from "./Genshins/GenshinDisplay";
import GenshinForm from "./Genshins/GenshinForm";
import { useState } from "react";
import { useUser } from "../../../context/UserContext";

const Genshin = () => {
  const { user } = useUser();
  const role = user?.role || "customer"; // fallback to customer

  // Shared state
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("asia"); // default
  const [username, setUsername] = useState("");
  const [usernameExists, setUsernameExists] = useState(false);

  return (
    <div className="p-4 py-0 md:px-20 lg:px-40 flex flex-col gap-2">
      <div className="sm:grid grid-cols-2 flex flex-col gap-2">
        <GenshinDisplay />
        <GenshinForm
          userId={userId}
          setUserId={setUserId}
          zoneId={zoneId}
          setZoneId={setZoneId}
          username={username}
          setUsername={setUsername}
          usernameExists={usernameExists}
          setUsernameExists={setUsernameExists}
        />
      </div>

        <GenshinProductList
          userId={userId}
          setUserId={setUserId}
          zoneId={zoneId}
          setZoneId={setZoneId}
          username={username}
          setUsername={setUsername}
          usernameExists={usernameExists}
          setUsernameExists={setUsernameExists}
          role={role}
        />
    </div>
  );
};

export default Genshin;