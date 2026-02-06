import MGlobalProductList from "./MGlobal/MGlobalProductList"
import RechargeDisplay from "../RechargeDisplay";
import InternationalProductList from "./InternaltionalComponents/InternationalProductList";
import RechargeForm3 from "../RechargeForm3";
import { useState } from "react";

const MLBBInternational = ()=> {
                    const [userId, setUserId] = useState('')
                    const [zoneId, setZoneId] = useState('')
                    const [username, setUsername] = useState('')
                    const [usernameExists, setUsernameExists] = useState(false)
          
          return (
                    <div className="p-4 md:px-20 lg:px-40 flex flex-col gap-10">
                              <div className="flex flex-col sm:grid grid-cols-2 gap-10">
                                        <RechargeDisplay />
                                         <RechargeForm3  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
                              </div>
                              
                             <InternationalProductList  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} /> 
                    </div>
          )
}

export default MLBBInternational;