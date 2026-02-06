import axios from "axios";
const baseURL = import.meta.env.VITE_BACKEND_URL;

const getMobileLegendsProductList  = async()=>{
          try{
                    const res = await axios.post(`${baseURL}/smile/mobilelegends/get-product-list`);
                    console.log(res)
                    return res.data
          } catch(error){
                    console.error(error)
                    console.log("Failed to fetch product list:")
          }

}
const getMagicChessGoGoProductList  = async()=>{
          try{
                    const res = await axios.post(`${baseURL}/smile/magicchessgogo/get-product-list`);
                    console.log(res)
                    return res.data
          } catch(error){
                    console.error(error)
                    console.log("Failed to fetch product list:")
          }

}

const getHonkaiProductList = async ()=>{
          try {
                    const res = await axios.post(`${baseURL}/smile/honkai/get-product-list`)
                    return res.data
          } catch(error){
                    console.error(error)
                    console.log("Failed to fetch product list:")
          }
}

export {getMobileLegendsProductList, getMagicChessGoGoProductList, getHonkaiProductList};