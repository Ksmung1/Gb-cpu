import RechargeDisplay from "../RechargeDisplay";
import { useState } from "react";
import SuperSusProductList from "./SuperSusComponents/SuperSusProductList";
import ResellerForm from "../ResellerForm";
import { useUser } from "../../../context/UserContext";
import RechargeForm2 from "../RechargeForm2";
const SuperSus = ()=> {
          const {user} = useUser()
          const [userId, setUserId] = useState('')
          const [zoneId, setZoneId] = useState('')
          const [username, setUsername] = useState('')
          const [usernameExists, setUsernameExists] = useState(false)
          const role = user?.role || 'customer'
          return (
                    <div className="p-4 md:px-20 lg:px-40 flex flex-col gap-10">
                              <div className="flex flex-col sm:grid grid-cols-2 gap-10">
                                        <RechargeDisplay />
                                         <RechargeForm2  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
                              </div>
                              
                             <SuperSusProductList   userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} role={role}/> 
                    </div>
          )
}

export default SuperSus;