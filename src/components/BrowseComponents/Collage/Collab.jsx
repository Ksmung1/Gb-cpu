import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../../configs/firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp
} from "firebase/firestore";
import SkinSelector from "../Collage/helper/skinSelector.jsx"
import CollageSetting from "../Collage/helper/collageSetting";
import Footer from "../Collage/helper/footer";
import { useNavigate } from "react-router-dom";
import Editor from "../Collage/helper/Editor.jsx"
import useModal from "../../../context/useModal";
import AssetsSelector from "../Collage/helper/assetsSelector";
import useExitPrompt from "../Collage/helper/useExitPrompt";
const Collab = () => {
  const  currentUser  = auth.currentUser;
  const { showAlert, showConfirm, ModalComponent } = useModal();
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const COLLAGE_WIDTH_PX = 360;
  const [showSkins, setShowSkins] = useState(false);
  const [cols, setCols] = useState(6);
  const [setting, setSetting] = useState(false);
  const [bgColor, setBgColor] = useState("#00154bfb");
  const [border, setBorder] = useState(0);
  const [showAssets, setShowAssets] = useState(false)
  const [allSkins, setallSkins] = useState([]);
  const [accountSection, setAccountSection] = useState(true)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
const [downloading, setDownloading] = useState(false);

const [selectedSkins, setSelectedSkins] = useState([]);
const [selectedAssets, setSelectedAssets] = useState([]);
  useExitPrompt("Are you sure you want to exit? Any unsaved changes will be lost."); 
  const [orderBy, setOrderBy] = useState("auto");
 const [userBalance, setUserBalance] = useState(null);
  const [accountImage, setAccountImage] = useState(null);
  const [exported, setExported] = useState(false);
  const [paid, setPaid] = useState(false); // payment status
  const [filter, setFilter] = useState("none");
  const collageRef = useRef(null);
  const [group, setGroup] = useState(false)
  const [allAssets, setAllAssets] = useState([]);
  const [price, setPrice] = useState(0);
  const count = selectedSkins.length;

useEffect(() => {
  if (count > 1800) {
    showAlert("You can select a maximum of 180 skins.");
    setSelectedSkins((prev) => prev.slice(0, 180));
    return;
  }
  setPrice(calculatePrice(count));
}, [selectedSkins]);

useEffect(() => {
  const assetsCol = collection(db, "assets");

  // Listen for realtime updates
  const unsubscribe = onSnapshot(
    assetsCol,
    (snapshot) => {
      const assetsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllAssets(assetsList);
    },
    (error) => {
      console.error("Failed to fetch skins:", error);
    }
  );

  // Cleanup listener on unmount
  return () => unsubscribe();
}, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchBalance = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          setUserBalance(snap.data()?.balance || 0);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    fetchBalance();
  }, [currentUser]);
useEffect(() => {
  const skinsCol = collection(db, "skins");

  const fetchSkins = async () => {
    try {


      const snapshot = await getDocs(skinsCol);
      const skinsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setallSkins(skinsList);

    } catch (error) {
      console.error("Failed to fetch skins:", error);
    }
  };

  fetchSkins();
}, []);



const handleAccountImageUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    setAccountImage({ imageUrl: reader.result });
    setExported(false);
    setPaid(false); 
  };
  reader.readAsDataURL(file);
};

  const removeAccountImage = () => {
    setAccountImage(null);
    setExported(false);
    setPaid(false);
  };
  const calculatePrice = (count) => {
  if (count <= 50) return 20;
  if (count <= 80) return 30;
  if (count <= 100) return 40;
  if (count <= 120) return 50;
  if (count <= 150) return 80;
  return 100; 
};


  const clearAll = () => {
    setSelectedSkins([]);
    setAccountImage(null);
    setExported(false);
    setPaid(false);
  };

  const totalGapWidth = border * (cols - 1);
  const totalPadding = border * 2;
  const imageWidth = Math.floor(
    (COLLAGE_WIDTH_PX - totalGapWidth - totalPadding) / cols
  );
const displayedItems = (() => {
  // Step 1: Apply sorting first
  let sorted = [...selectedSkins];
  if (orderBy === "points") {
    sorted.sort((a, b) => {
      const itemA = allSkins.find((s) => s.id === a);
      const itemB = allSkins.find((s) => s.id === b);
      return (itemB?.points || 0) - (itemA?.points || 0);
    });
  } else if (orderBy === "low-points") {
    sorted.sort((a, b) => {
      const itemA = allSkins.find((s) => s.id === a);
      const itemB = allSkins.find((s) => s.id === b);
      return (itemA?.points || 0) - (itemB?.points || 0);
    });
  }

  // Step 2: Group by family if enabled
  if (group) {
    const familyBuckets = {};
    sorted.forEach((id) => {
      const skin = allSkins.find((s) => s.id === id);
      const fam = skin?.family || "Others";
      if (!familyBuckets[fam]) familyBuckets[fam] = [];
      familyBuckets[fam].push(id);
    });

    // Flatten groups but preserve sort order of families
    return Object.values(familyBuckets).flat();
  }

  // If no grouping, return just sorted
  return sorted;
})();


const handlePayment = async () => {
  if (!currentUser) {
    showAlert("Please login to make payment.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const balance = userSnap.data()?.balance || 0;

    const userConfirmed = await showConfirm(
      `Pay ₹${price} to unlock collage? You can no longer edit after you pay`
    );
    if (!userConfirmed) return;

    setLoading(true);

    if (balance < price) {
      showAlert("Insufficient balance. Please recharge your coins.");
      return;
    }

    // Deduct balance and log transaction
    await updateDoc(userDocRef, {
      balance: increment(-price),
      collageCount: increment(1),
    });
    await setDoc(
      doc(collection(userDocRef, "balance-history")),
      {
        type: "deduction",
        amount: price,
        reason: "Collage unlock payment",
        by: currentUser.uid,
        balanceAfter: balance - price,
        timestamp: serverTimestamp(),
      }
    );

    setPaid(true);
    setExported(false);

    // --- Canvas setup ---
    const scale = 6; // Ultra HD
    const gap = border * scale;
    const padding = gap;

    const colsCount = cols;
    const rowsCount = Math.ceil(displayedItems.length / colsCount);

    const collageWidth = colsCount * imageWidth * scale + (colsCount - 1) * gap;
    const collageHeight = rowsCount * imageWidth * scale + (rowsCount - 1) * gap;

    let accountHeight = 0;
    let accountWidth = 0;
    if (accountSection && accountImage?.imageUrl) {
      accountWidth = collageWidth;
      accountHeight = accountWidth / (16 / 8);
    }

    const canvasWidth = collageWidth + padding * 2;
    const canvasHeight = collageHeight + padding * 2 + (accountSection ? accountHeight + padding : 0);
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set filter depending on paid status
    const canvasFilter = !paid
      ? `blur(0.7px) ${filter === "grayscale" ? "grayscale(100%)" : filter === "vivid" ? "contrast(1.3) saturate(1.3)" : ""}`
      : filter === "grayscale"
        ? "grayscale(100%)"
        : filter === "vivid"
        ? "contrast(1.3) saturate(1.3)"
        : "none";

    ctx.filter = canvasFilter;

    // Draw account image
    if (accountSection && accountImage?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = accountImage.imageUrl;
      await new Promise(resolve => { img.onload = resolve; });
      const accountX = (canvasWidth - accountWidth) / 2;
      const accountY = padding;
      ctx.drawImage(img, accountX, accountY, accountWidth, accountHeight);
    }

    // Draw collage images
    for (let i = 0; i < displayedItems.length; i++) {
      const skin = allSkins.find(s => s.id === displayedItems[i]);
      if (!skin?.imageUrl) continue;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = skin.imageUrl;
      await new Promise(resolve => { img.onload = resolve; });

      const col = i % colsCount;
      const row = Math.floor(i / colsCount);

      const x = padding + col * (imageWidth * scale + gap);
      const y = accountHeight + padding * 2 + row * (imageWidth * scale + gap);

      ctx.drawImage(img, x, y, imageWidth * scale, imageWidth * scale);
    }

    // Optional: boost brightness
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 1.05);
      data[i + 1] = Math.min(255, data[i + 1] * 1.05);
      data[i + 2] = Math.min(255, data[i + 2] * 1.05);
    }
    ctx.putImageData(imgData, 0, 0);

    // Convert to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
    if (!blob) throw new Error("Canvas blob is empty");

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "mlbb_collages"); // Must be UNSIGNED preset
    formData.append("folder", "mlbb_collages");
    formData.append("quality", "auto:best");
    formData.append("fetch_format", "auto");

    const res = await fetch("https://api.cloudinary.com/v1_1/drqosjiqm/image/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Cloudinary error:", errText);
      throw new Error("Image upload failed");
    }

    const uploadResult = await res.json();
    setUploadedImageUrl(uploadResult.secure_url);

    // Save collage URL
    const existingUrls = userSnap.data().savedCollageUrls || [];
    if (!existingUrls.includes(uploadResult.secure_url)) {
      await updateDoc(userDocRef, {
        savedCollageUrls: arrayUnion(uploadResult.secure_url),
        lastSavedAt: new Date(),
      });
    } else {
      await updateDoc(userDocRef, { lastSavedAt: new Date() });
    }

    showAlert("Payment successful! Collage saved.");
  } catch (err) {
    console.error(err);
    showAlert("Payment or upload failed. Try again.");
  } finally {
    setLoading(false);
  }
};

const handleDownload = async () => {
  if (!currentUser) {
    showAlert("Please login to download your collage.");
    return;
  }
  if (!paid || !uploadedImageUrl) {
    showAlert("Please pay first to unlock the collage.");
    return;
  }

  try {
    setDownloading(true);

    // Direct download from Cloudinary
    const res = await fetch(uploadedImageUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "mlbb-collage.png";
    link.click();

    URL.revokeObjectURL(url);
    setExported(true);
  } catch (err) {
    console.error(err);
    showAlert("Failed to download collage, please try again.");
  } finally {
    setDownloading(false);
  }
};

  // Prevent screenshot keys (PrintScreen, etc) if unpaid or not exported
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!paid || !exported) {
        if (
          e.key === "PrintScreen" ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") ||
          (e.metaKey && e.shiftKey && e.key.toLowerCase() === "4")
        ) {
          e.preventDefault();
          showAlert(
            "Screenshot is disabled until you export or pay to unlock the collage."
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paid, exported]);

  // Blur & disable collage if unpaid
const collageStyle = {
  // Apply filter based on selection
  filter: `
    ${!paid ? "blur(0.7px)" : ""}
    ${filter === "grayscale" ? "grayscale(100%)" : ""}
    ${filter === "vivid" ? "contrast(1.3) saturate(1.3)" : ""}
  `.trim(),

  userSelect: paid ? "auto" : "none",
};


  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black">
        <h1 className="text-xl font-bold mb-4">You must be a user to access this page.</h1>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

    if (userBalance !== null && userBalance < 50) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black">
        <h1 className="text-xl font-bold mb-4">
          You must have a minimum of 50 coins to access this page.
        </h1>
        <button
          onClick={() => navigate("/wallet")}
          className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
        >
          Go to Wallet
        </button>
      </div>
    );
  }

return (
<div className="p-4 text-white mb-20 max-w-sm lg:max-w-[1200px] mx-auto">

  {/* Mobile notice */}
  <div className="flex justify-between items-center mb-5">
      <h1
        className="text-md mb-2 text-center font-bold cursor-pointer"
        onClick={() => navigate("/")}
      >
        MLBB Collage
      </h1>
      <p>{count ? count : ""}</p>

    <button onClick={()=>navigate('/collage-history')}>History</button>
  </div>
  
  {/* Main grid: 3 columns on large screens, stacked on mobile */}
  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4">
    {/* Left: Settings */}
    <div className="hidden lg:block">
  
  

          <CollageSetting 
            setCols={setCols}
            cols={cols}
            bgColor={bgColor}
            setBgColor={setBgColor}
            border={border}
            setBorder={setBorder}
            orderBy={orderBy}
            setOrderBy={setOrderBy}
            group={group}
            setGroup={setGroup}
            accountSection={accountSection}
            setAccountSection={setAccountSection}
            style={collageStyle}
            filter={filter}
            setFilter={setFilter}
          />
     </div>

    {/* Middle: Collage */}
    <div className="justify-center  flex">
<Editor
  ref={collageRef}
  bgColor={bgColor}
  border={border}
  accountImage={accountImage}
  removeAccountImage={removeAccountImage}
  handleAccountImageUpload={handleAccountImageUpload}
  displayedItems={displayedItems}
  selectedAssets={selectedAssets}
  setSelectedAssets={setSelectedAssets}
  allSkins={allSkins}
  allAssets={allAssets}
  cols={cols}
  imageWidth={imageWidth}
  style={collageStyle}
  paid={paid}
  accountSection={accountSection}
/>
    </div>
{setting && (
  <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 lg:hidden min-w-[350px]">
    <CollageSetting 
      setCols={setCols}
      cols={cols}
      bgColor={bgColor}
      setBgColor={setBgColor}
      border={border}
      setBorder={setBorder}
      orderBy={orderBy}
      setOrderBy={setOrderBy}
      group={group}
      setGroup={setGroup}
      setSetting={setSetting}
      accountSection={accountSection}
      setAccountSection={setAccountSection}
      style={collageStyle}
     filter={filter}
            setFilter={setFilter}
    />
  </div>
)}



    {/* Right: Skins selector (desktop only) */}
    <div className="hidden min-w-[360px] lg:block w-full max-h-[400px] overflow-y-auto scrollbar-hide">
      {
        showAssets ?   
      <AssetsSelector
      setShowAssets={setShowAssets}
        allSkins={allSkins}
        allAssets={allAssets}
                selectedAssets={selectedAssets}
        setSelectedAssets={(skins) => {
          setSelectedAssets(skins);
          setExported(false);
          setPaid(false);
        }}
      />
:    <SkinSelector
       setShowSkins={setShowSkins}
        allSkins={allSkins}
        allAssets={allAssets}
        selectedSkins={selectedSkins}
        setSelectedSkins={(skins) => {
          setSelectedSkins(skins);
          setExported(false);
          setPaid(false);
        }}
      />
      }
   
    </div>
  </div>

  {/* Mobile skins selector */}
  {showSkins && (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 
                max-w-[360px] w-full z-[100] 
                overflow-y-scroll scrollbar-hide rounded-lg lg:hidden">
  <SkinSelector
    setShowSkins={setShowSkins}
    allSkins={allSkins}
    selectedSkins={selectedSkins}
    setSelectedSkins={(skins) => {
      setSelectedSkins(skins);
      setExported(false);
      setPaid(false);
    }}
  />
</div>
  )}


    {showAssets && (
<div className="fixed bottom-16 left-1/2 -translate-x-1/2 
                max-w-[360px] w-full z-[100] 
                overflow-y-scroll scrollbar-hide rounded-lg lg:hidden">
      <AssetsSelector
        setShowAssets={setShowAssets}
        allSkins={allSkins}
        allAssets={allAssets}
                selectedAssets={selectedAssets}
        setSelectedAssets={(skins) => {
          setSelectedAssets(skins);
          setExported(false);
          setPaid(false);
        }}
      />
    </div>
  )}


  {/* Footer always visible */}
  <div className="fixed bottom-0 left-0 px-4 bg-black mx-auto right-0">
    <Footer
      showSkins={showSkins}
      setShowSkins={setShowSkins}
      showAssets={showAssets}
      setShowAssets={setShowAssets}
      paid={paid}
      selectedSkins={selectedSkins}
      accountImage={accountImage}
      handlePayment={handlePayment}
      handleDownload={handleDownload}
      downloading={downloading}
      loading={loading}
      clearAll={clearAll}
      setting={setting}
      setSetting={setSetting}
      price={price}
    />
  </div>
  {ModalComponent}
</div>

);

};

export default Collab;
