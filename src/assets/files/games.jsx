import mlLogo from '../images/ml-logo.avif';
import mcgg from '../images/mcgg.avif';
import honkai from '../images/honkai.avif';
import charisma from '../images/charisma.avif';
import skinGift from "../images/skinGifting.jpg"
import moskov from "../images/moskov.webp"
import kagura from "../images/kagura.jpg"
import genshin from "../images/genshin.jpg"
import zenless from "../images/zenless.webp"
import pubg from "../images/pubg.webp"
import supersus from "../images/supersus.webp"
import mlbbcustom from "../images/mlbb-custom.jpg"
import wuthering from "../images/wuthering-waves.webp"
import bloodStrike from "../images/blood-strike.webp"
import hok from "../images/hok.webp"
import wwm from "../images/wwm.webp"
import { getMobileLegendsProductList, getMagicChessGoGoProductList , getHonkaiProductList} from '../../utils/handleGetProductList';

const games = [
               {
    id: 12,
    name: "MLBB Custom Packs",
    img: mlbbcustom,
    route: '/mlbb-custom',
    filter: 'others'
  },
         {
    id: 16,
    name: "Where Winds Meet",
    img: wwm,
    route: '/where-winds-meet',
    filter: 'other'
  },
     {
    id: 8,
    name: "Genshin Impact",
    img: genshin,
    route: '/genshin-impact',
    filter: 'popular'
  },
               {
    id: 13,
    name: "Wuthering Waves",
    img: wuthering,
    route: '/wuthering-waves',
    filter: 'popular'
  },
             {
    id: 11,
    name: "Super Sus",
    img: supersus,
    route: '/super-sus',
    filter: 'others'
  },
           {
    id: 9,
    name: "Zenless Zone Zero",
    img: zenless,
    route: '/zzz',
    filter: 'popular'
  },
    {
    id: 15,
    name: "Honor of Kings",
    img: hok,
    route: '/honor-of-kings',
    filter: 'popular'
  },
  
             {
    id: 14,
    name: "Blood Strike",
    img: bloodStrike,
    route: '/blood-strike',
    filter: 'other'
  },
  {
    id: 1,
    name: "Mobile Legends",
    img: mlLogo,
    onclick: async () => {
      return await getMobileLegendsProductList();
    },
    route: '/recharge',
    filter: 'popular'
  },

        {
    id: 10,
    name: "PUBG Global",
    img: pubg,
    route: '/pubg-global',
    filter: 'popular'
  },
    {
    id: 3,
    name: "Honkai Star Rail",
    img: honkai,
        onclick: async () => {
      return await getHonkaiProductList();
    },
    route: '/honkai-starrail',
    filter: 'other'
  },
  {
    id: 4,
    name: "Charisma via Gifting",
    img: charisma,
    route: '/charisma',
    filter: 'other'
  }, 
  
    
     {
    id: 7,
    name: "MLBB International",
    img: kagura,
    route: '/mlbb-international',
    filter: 'popular'
  },

  {
    id: 6,
    name: "MLBB (Small packs)",
    img: moskov,
    route: '/mlbb-global',
    filter: 'other'
  },

  {
    id: 2,
    name: "Magic Chess: GO GO",
    img: mcgg,
    route: '/mcgg-recharge',
    onclick: async () => {
      return await getMagicChessGoGoProductList();
    },
    filter: 'popular'
  },

   {
    id: 5,
    name: "Skin Gifting",
    img: skinGift,
    route: '/mlbb-skin-gift',
    filter: 'other'
  },
    

   


 


];

export default games;
