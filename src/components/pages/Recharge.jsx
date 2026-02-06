import { useState } from "react";
import RechargeDisplay from "../RechargeComponents/RechargeDisplay";
import RechargeForm2 from "../RechargeComponents/RechargeForm2";
import RechargeProductList from "../RechargeComponents/RechargeProductList";
const Recharge = ()=> {
            const [userId, setUserId] = useState("");
            const [zoneId, setZoneId] = useState("");
            const [username, setUsername] = useState("");
            const [usernameExists, setUsernameExists] = useState(false)
          
          return (
                    <div className="flex flex-col gap-12 items-center w-full px-4 mt-6 md:px-20 lg:px-40">
                              <div className="flex flex-col sm:grid grid-cols-2 gap-10">
                             
                              <RechargeDisplay />
                              <RechargeForm2 userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} />
                              </div>
                              <RechargeProductList  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
                              <div className="h-5"></div>
                    </div>
          )
}

export default Recharge;