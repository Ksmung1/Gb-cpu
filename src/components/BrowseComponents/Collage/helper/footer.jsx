import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Shirt, 
  Package, 
  Download, 
  CreditCard, 
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const Footer = ({ 
  showSkins, setShowSkins, 
  showAssets, setShowAssets, 
  paid, selectedSkins, accountImage, handlePayment,handleDownload, downloading, loading, clearAll, setting, setSetting, price
}) => {
  const location = useLocation();
  const isDisabled = selectedSkins.length === 0 && !accountImage;
  const navigate = ()=>window.location.reload()
  return (
    <div className='max-w-sm mx-auto px-2 pb-3'>
      <div className='bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-2'>
        <div className='flex items-center justify-center gap-2 flex-wrap'>

          {/* If not paid → show all buttons */}
          {!paid && (
            <>
              {/* Skins Toggle Button */}
              <button 
                onClick={() => {setShowSkins(!showSkins); setShowAssets(false); setSetting(false)}}
                className={`
                  group relative flex items-center gap-1 px-2 py-2 rounded-lg font-medium
                  transition-all duration-300 ease-out transform hover:scale-105 text-xs
                  bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-purple-500/25
                `}
              >
                <Shirt className={`w-3 h-3 transition-transform duration-300 ${showSkins ? 'rotate-12' : 'group-hover:rotate-6'}`} />
                <span className='font-semibold'>Skins</span>
                {showSkins ? (
                  <ChevronUp className='w-3 h-3 transition-transform duration-200' />
                ) : (
                  <ChevronDown className='w-3 h-3 transition-transform duration-200' />
                )}
              </button>

              {/* Assets Toggle Button */}
              {location.pathname !== "/collab2" && (
                <button 
                  onClick={() => {setShowAssets(!showAssets); setShowSkins(false); setSetting(false)}}
                  className={`
                    group relative flex items-center gap-1 px-2 py-2 rounded-lg font-medium
                    transition-all duration-300 ease-out transform hover:scale-105 text-xs
                    bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25
                  `}
                >
                  <Package className={`w-3 h-3 transition-transform duration-300 ${showAssets ? 'rotate-12' : 'group-hover:rotate-6'}`} />
                  <span className='font-semibold'>Assets</span>
                  {showAssets ? (
                    <ChevronUp className='w-3 h-3 transition-transform duration-200' />
                  ) : (
                    <ChevronDown className='w-3 h-3 transition-transform duration-200' />
                  )}
                </button>
              )}

              {/* Settings Button */}
              <button
                className={`
                  ${setting ? "bg-black text-white border-gray-900 " : "bg-white text-black border-gray-200 "}
                  group flex items-center gap-1 px-2 py-2 rounded-lg font-medium text-xs
                  transition-all duration-300 ease-out transform hover:scale-105
                  border hover:border-gray-300 hover:shadow
                `}
                onClick={()=>{setSetting(!setting); setShowAssets(false); setShowSkins(false)}}
                title="Settings"
              >
                <Settings className='w-3 h-3 group-hover:rotate-90 transition-transform duration-300' />
                <span className='hidden'>Settings</span>
              </button>
            </>
          )}

          {/* Always show Download/Pay Button */}
          {paid && (
            <button onClick={navigate} className='text-sm bg-red-500 p-1 rounded-md px-2 '>Back</button>
          )}
       <button
  className={`
    group flex items-center px-3 py-2 rounded-lg font-semibold
    transition-all duration-300 ease-out transform hover:scale-105 min-w-[80px] text-xs
    ${isDisabled 
      ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50" 
      : paid 
        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/25 hover:shadow-green-500/40" 
        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:shadow-blue-500/40"
    }
  `}
  onClick={async () => {
    setSetting(false);
    setShowAssets(false);
    setShowSkins(false);

    if (!paid) {
      await handlePayment(); // Trigger payment first
    } else {
      await handleDownload(); // Trigger download if already paid
    }
  }}
  disabled={isDisabled || loading || downloading} // disable during loading
  title={paid ? "Download Collage" : "Pay to unlock"}
>
  {loading ? (
    <span>Processing...</span>
  ) : downloading ? (
    <span>Downloading...</span>
  ) : paid ? (
    <>
      <Download className='w-3 h-3 group-hover:animate-bounce' />
      <span>Download</span>
    </>
  ) : (
    <>
      <CreditCard className='h-3' />
      <span>{price}</span>
    </>
  )}
</button>

        </div>
      </div>
    </div>
  );
};

export default Footer;
