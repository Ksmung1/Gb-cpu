import HonkaiProductList from "./Honkai/HonkaiProductList";
import RechargeDisplay from "../RechargeDisplay";
import { useState } from "react";
import ResellerForm from "../ResellerForm";
import { useUser } from "../../../context/UserContext";
const Honkai = ()=>{
            const {user} = useUser()
            const role = user?.role || 'reseller' 
            const [userId, setUserId] = useState("");
            const [zoneId, setZoneId] = useState("");
            const [username, setUsername] = useState("");
            const [usernameExists, setUsernameExists] = useState(false)

          return (
                    <div className="p-4 py-5 md:px-20 lg:px-40 flex flex-col gap-10">
                              <div className="sm:grid grid-cols-2 flex flex-col gap-10">
                                        <RechargeDisplay />
                                        <ResellerForm userId={userId} setUserId={setUserId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
                              </div>
                              <HonkaiProductList  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} role={role}/>
                    </div>
          )
}

export default Honkai;