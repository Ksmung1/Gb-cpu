import { useEffect, useMemo, useState, useRef } from "react"; // ← added useRef
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../../configs/firebase";
import RechargeCheckout from "../../RechargeCheckout";
import { useUser } from "../../../../context/UserContext";
import { useDarkMode } from "../../../../context/DarkModeContext";
import coin from "../../../../assets/images/coin.png";
import smallPackImg from "../../../../assets/images/small-packs.png";
import mediumPackImg from "../../../../assets/images/medium-packs.png";
import largePackImg from "../../../../assets/images/large-packs.png";
import defaultImg from "../../../../assets/images/d.avif";
import weekly from "../../../../assets/images/weekly.avif";
import ph from "../../../../assets/images/ph.png";
import ru from "../../../../assets/images/ru.webp";
import sg from "../../../../assets/images/sg.png";
import br from "../../../../assets/images/br.jpeg";
import ty from "../../../../assets/images/ty.jpeg";
import my from "../../../../assets/images/my.jpeg";
import myr from "../../../../assets/images/myr.jpeg";
import usa from "../../../../assets/images/usa.jpeg";
import id from "../../../../assets/images/id.jpeg";

const defaultCountryImg = coin;

const InternationalProductList = ({
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();

  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCountry, setActiveCountry] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // ← NEW: Ref to scroll to checkout
  const checkoutRef = useRef(null);

  const imgMap = {
    small: smallPackImg,
    medium: mediumPackImg,
    large: largePackImg,
  };

  const countryImages = {
    PH: ph,
    RU: ru,
    SG: sg,
    BR: br,
    TY: ty,
    MY: my,
    USA: usa,
    MYR: myr,
    ID: id,
  };

  const getDiamondImage = (item) => {
    if (item.img && imgMap[item.img]) return imgMap[item.img];

    const d = Number(item.diamonds || 0);

    if (!d && item.label === "Weekly Pass") {
      return weekly;
    }
    if (d >= 800) return largePackImg;
    if (d >= 60) return mediumPackImg;
    if (d >= 150) return defaultImg;
    if (d > 0) return smallPackImg;

    return defaultImg;
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "internationalProductList"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => (a.price || 0) - (b.price || 0));
        setProducts(data);
        setLoaded(true);
      },
      (error) => {
        console.error("Error fetching international products:", error);
      }
    );

    return () => unsub();
  }, []);

  // ← NEW: Auto-scroll to checkout when product is selected
  useEffect(() => {
    if (selectedItem && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedItem]);

  const countryList = useMemo(() => {
    const countries = new Set();
    products.forEach((p) => {
      const countryValues = (p.country || "Other")
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
      countryValues.forEach((c) => countries.add(c));
    });
    return [...countries];
  }, [products]);

  useEffect(() => {
    if (!activeCountry && countryList.length > 0) {
      setActiveCountry(countryList[0]);
    }
  }, [countryList, activeCountry]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (item) =>
        !item.hide &&
        (item.country || "Other")
          .split(",")
          .map((c) => c.trim())
          .includes(activeCountry)
    );
  }, [products, activeCountry]);

  if (!loaded) return <div className="text-center py-10">Loading...</div>;

  return (
    <div
      className={`space-y-4 w-full flex flex-col sm:grid sm:grid-cols-2 gap-10 ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3">
          {countryList.map((country) => (
            <button
              key={country}
              onClick={() => {
                setActiveCountry(country);
                setSelectedItem(null);
              }}
              className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm bg-white/20 shadow-md transition-all duration-200 ${
                activeCountry === country
                  ? "ring-2 ring-yellow-400 text-yellow-500"
                  : isDarkMode
                  ? "bg-gray-700/30 text-gray-200 shadow-inner"
                  : "bg-white/60 text-gray-800 hover:bg-white"
              }`}
            >
              <div className="w-[48px] h-[28px] overflow-hidden rounded-md shadow-sm">
                <img
                  src={countryImages[country] || defaultCountryImg}
                  alt={country}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-semibold text-center">
                {country}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((item, i) => (
              <div
                key={item.id || i}
                onClick={() => setSelectedItem(item)}
                className={`flex relative overflow-hidden flex-row cursor-pointer justify-between items-center px-2 py-1 rounded-md border shadow-md transition-all duration-200 hover:shadow-lg ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                } ${
                  selectedItem?.id === item.id
                    ? isDarkMode
                      ? "ring-2 ring-offset-2 ring-blue-500 ring-offset-gray-900"
                      : "ring-2 ring-offset-2 ring-blue-400"
                    : ""
                }`}
              >
                {item.outOfStock && (
                  <div className="absolute top-5 py-1 -left-1 w-[100px] bg-red-600 text-white text-[6px] text-center font-bold transform -rotate-45 z-10 shadow-lg pointer-events-none">
                    OUT OF STOCK
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex w-10 h-10 items-center gap-2">
                    <img
                      className="object-contain w-full h-full"
                      src={getDiamondImage(item)}
                      alt={item.label}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <p
                      className={`${
                        isDarkMode ? "text-gray-200" : "text-gray-800"
                      } text-[12px] font-semibold`}
                    >
                      {item?.diamonds === "0" ? "" : item.diamonds}
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      } text-[10px] italic`}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <p className="font-semibold text-[13px] text-green-500">
                    ₹
                    {(() => {
                      let parsedAmount;

                      if (user?.role === "reseller" || user?.role === "prime") {
                        parsedAmount = item.resellerRupees;
                      } else if (user?.role === "vip") {
                        parsedAmount = Math.round(item.rupees * 0.97);
                      } else {
                        parsedAmount = item.rupees;
                      }

                      return parsedAmount;
                    })()}
                  </p>
                  <p className="text-[10px] text-red-500 line-through">
                    {item.falseRupees}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div
              className={`${
                isDarkMode ? "text-gray-500" : "text-gray-500"
              } text-sm col-span-2 text-center mt-4`}
            >
              No items available at the moment.
            </div>
          )}
        </div>
      </div>

      {/* Checkout – now with ref for smooth scroll */}
      <div ref={checkoutRef}>
        <RechargeCheckout
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          userId={userId}
          setUserId={setUserId}
          zoneId={zoneId}
          setZoneId={setZoneId}
          username={username}
          setUsername={setUsername}
          usernameExists={usernameExists}
          setUsernameExists={setUsernameExists}
        />
      </div>
    </div>
  );
};

export default InternationalProductList;