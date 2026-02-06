import axios from "axios"

export const getYokcashBalance = async()=>{
 try {
          const url = import.meta.env.VITE_BACKEND_URL
          const res = await axios.post(`${url}/yokcash/balance`)
          if(res.data.status){
                    return res.data.data.saldo
          } else {
                    console.warn(res.data.msg)
                    return 0.0
          }
 } catch (err){
          console.error(err)
          return 0
 }
}