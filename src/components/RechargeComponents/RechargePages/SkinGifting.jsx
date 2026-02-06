import { useState } from "react";
import RechargeDisplay from "../RechargeDisplay";
import RechargeForm2 from "../RechargeForm2";
import SkinGiftingProductList from "./SkinGifting/SkinGiftingProductList";

const SkinGifting = ()=> {
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
                              
                             <SkinGiftingProductList  userId={userId} setUserId={setUserId} zoneId={zoneId} setZoneId={setZoneId} username={username} setUsername={setUsername} usernameExists={usernameExists} setUsernameExists={setUsernameExists} /> 
                    </div>
          )
}

export default SkinGifting;