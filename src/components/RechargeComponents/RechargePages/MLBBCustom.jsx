import MGlobalProductList from "./MGlobal/MGlobalProductList"
import RechargeForm2 from "../RechargeForm2";
import RechargeDisplay from "../RechargeDisplay";
import { useState } from "react";
import MLBBCustomProductList from "./MLBBCustoms/MLBBCustomProductList";
import { useUser } from "../../../context/UserContext";

const MLBBCustom = ()=> {
                    const {user} = useUser()
                    const role = user?.role || 'customer'
                    const [userId, setUserId] = useState('')
                    const [zoneId, setZoneId] = useState('')
                    const [username, setUsername] = useState('')
                    const [usernameExists, setUsernameExists] = useState(false)
          
          return (
                    <div className="p-4 md:px-20 lg:px-40 flex flex-col gap-10">
                              <div className="flex flex-col sm:grid grid-cols-2 gap-10">
                                        <RechargeDisplay />
                                         <RechargeForm2  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
                              </div>
                              
                             <MLBBCustomProductList  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} role={role}/> 
                    </div>
          )
}

export default MLBBCustom;