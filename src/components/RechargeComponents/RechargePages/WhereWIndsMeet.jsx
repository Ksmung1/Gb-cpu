import MagicchessProductList from "./MagicChess/MagicChessProductList"
import RechargeDisplay from "../RechargeDisplay";
import ResellerForm from "../ResellerForm"
import { useState } from "react";
import { useUser } from "../../../context/UserContext";
import HonorKingsProductList from "./HonorKingsComponents/HonorKingsProductList";
import RechargeForm2 from "../RechargeForm2";
import WhereWindsMeetProductList from "./WhereWindsMeetComponents/WhereWindsMeetProductList";
const WhereWindsMeet = ()=> {
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
                              
                             <WhereWindsMeetProductList   userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} role={role}/> 
                    </div>
          )
}

export default WhereWindsMeet;