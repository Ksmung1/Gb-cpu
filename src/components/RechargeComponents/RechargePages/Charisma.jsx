import CharismaProductList from "./CharismaComponents/CharismaProductList";
import RechargeDisplay from "../RechargeDisplay";
import RechargeForm2 from "../RechargeForm2";
import { useState } from "react";
const Charisma = ()=> {
                const [userId, setUserId] = useState('')
          const [zoneId, setZoneId] = useState('')
          const [username, setUsername] = useState('')
          const [usernameExists, setUsernameExists] = useState(false)

          return (
                    <div className="flex flex-col items-center sm:items-start p-4 md:px-20 lg:px-40 gap-10">
                        <div className="sm:grid grid-cols-2 flex flex-col items-center gap-10">
                              <RechargeDisplay />
                              <RechargeForm2  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
                        </div>
                              <CharismaProductList  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists}/>
    
                    </div>
          )
}

export default Charisma;