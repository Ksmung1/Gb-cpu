import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { FaStar } from "react-icons/fa";
import { useDarkMode } from "../../context/DarkModeContext";
import { db } from "../../configs/firebase";
import account from "../../assets/images/Game account middle text [GameBar].avif";
import bosst from "../../assets/images/Mlbb Rank boosting [GameBar].avif";
import bg from "../../assets/images/bg.webp";
import renting from "../../assets/images/Mlbb Account renting [GameBar].avif";
import yuzhong from "../../assets/images/yuzhong.avif";

const BrowsePage = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const [favorite, setFavorite] = useState(null);
  const [leaderboardTopCard, setLeaderboardTopCard] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalCard, setModalCard] = useState(null);

  const cardData = [
    { id: "account", title: "MOBILE LEGENDS ACCOUNT SELLING", img: account, route: "/account-auction" },
    { id: "renting", title: "Account Renting", img: renting, route: "/coming-soon" },
    { id: "boost", title: "Rank Boosting", img: bosst, route: "/coming-soon" },
    { id: "region", title: "ML Region Checker", img: yuzhong, route: "/id-checker" },
    { id: "collage", title: "ML Collage Editor", img: bg, route: "/collage" },
  ];

  useEffect(() => {
    async function loadFavorite() {
      const storedFavorite = localStorage.getItem("favoriteCard");
      if (storedFavorite) {
        setFavorite(storedFavorite);
        return;
      }

      try {
        const leaderboardRef = doc(db, "leaderboards", "cards");
        const leaderboardSnap = await getDoc(leaderboardRef);
        if (leaderboardSnap.exists()) {
          const data = leaderboardSnap.data();
          let maxCount = -Infinity;
          let maxCardId = null;
          for (const card of cardData) {
            const count = data[card.id] ?? 0;
            if (count > maxCount) {
              maxCount = count;
              maxCardId = card.id;
            }
          }
          if (maxCardId) setLeaderboardTopCard(maxCardId);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
    }
    loadFavorite();
  }, []);

  const topCardId = favorite || leaderboardTopCard;
  const favoriteCard = cardData.find((c) => c.id === topCardId);
  const otherCards = cardData.filter((c) => c.id !== topCardId);

  const updateFavoriteCount = async (cardId, value) => {
    const ref = doc(db, "leaderboards", "cards");
    await setDoc(ref, { [cardId]: increment(value) }, { merge: true });
  };

  const toggleFavorite = async (cardId) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const storedFavorite = localStorage.getItem("favoriteCard");

      if (storedFavorite === cardId) {
        await updateFavoriteCount(cardId, -1);
        setFavorite(null);
        localStorage.removeItem("favoriteCard");
      } else {
        if (storedFavorite) {
          await updateFavoriteCount(storedFavorite, -1);
        }
        await updateFavoriteCount(cardId, 1);
        setFavorite(cardId);
        localStorage.setItem("favoriteCard", cardId);
      }
    } catch (error) {
      console.error("Error updating favorite count:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (card) => setModalCard(card);
  const closeModal = () => setModalCard(null);

  return (
    <div
      className={`relative w-full flex flex-col gap-5 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white"
      }`}
    >
      {/* Animated background */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div
          className="w-[200%] h-full bg-repeat animate-bgScroll opacity-10"
          style={{ backgroundImage: `url(${bg})` }}
        />
      </div>

      <div className="relative w-full z-10 p-4 max-w-6xl mx-auto flex flex-col gap-6">

    {/* Favorite Card */}
{favoriteCard && (
  <div
    key={favoriteCard.id}
    className={`relative flex flex-col items-center justify-center gap-6 p-6 rounded-lg border overflow-hidden transition-all duration-300 transform shadow-xl w-full aspect-[16/9] ${
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
    }`}
    style={{
      backgroundImage: `url(${favoriteCard.img})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(0.9)",
    }}
    onClick={() => navigate(favoriteCard.route)}
  >
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(favoriteCard.id);
      }}
      className="absolute top-4 right-4 z-20 hover:scale-110 transition-transform"
      title={favorite === favoriteCard.id ? "Unfavorite" : "Mark as Favorite"}
    >
      <FaStar
        className={`text-3xl ${
          favorite === favoriteCard.id ? "fill-yellow-400" : "fill-gray-400 hover:fill-yellow-400"
        }`}
      />
    </button>
  </div>
)}


        {/* Other Cards Grid */}
        <div
          className={`grid gap-6 w-full ${
            otherCards.length === 2 ? "grid-cols-2" : otherCards.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {otherCards.map((card) => (
    <div
  key={card.id}
  className={`relative flex items-center justify-center p-4 rounded-lg border overflow-hidden transition-all duration-300 transform hover:scale-[1.02] w-full aspect-[16/9] ${
    isDarkMode ? "bg-gray-800 border-gray-700 shadow-lg" : "bg-white border-gray-300 shadow-md"
  }`}
  style={{
    backgroundImage: `url(${card.img})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter: "brightness(0.85)",
  }}
  onClick={() => navigate(card.route)}
>
  <button
    onClick={(e) => {
      e.stopPropagation();
      toggleFavorite(card.id);
    }}
    className="absolute top-2 right-2 z-20 hover:scale-110 transition-transform"
    title={favorite === card.id ? "Unfavorite" : `Mark ${card.title} as Favorite`}
  >
    <FaStar
      className={`text-xl ${
        favorite === card.id ? "fill-yellow-400" : "fill-gray-400 hover:fill-yellow-400"
      }`}
    />
  </button>
</div>

          ))}
        </div>
      </div>

      {/* Modal */}
      {modalCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-opacity-70 p-4"
          onClick={closeModal}
        >
          <div
            className={`relative max-w-lg w-full rounded-lg p-6 ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute cursor-pointer top-2 right-3 text-2xl font-bold hover:text-red-500"
              onClick={closeModal}
            >
              &times;
            </button>
            <img
              src={modalCard.img}
              alt={modalCard.title}
              className="w-full h-48 object-cover rounded mb-4"
            />
            <h2 className="font-extrabold mb-3">{modalCard.title}</h2>
            <button
              onClick={() => {
                closeModal();
                navigate(modalCard.route);
              }}
              className="px-2 py-1 text-sm rounded font-bold bg-gradient-to-r from-purple-500 to-blue-600 hover:scale-105 transition-transform duration-300 text-white"
            >
              Go to {modalCard.title}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bgScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-bgScroll {
          animation: bgScroll 60s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BrowsePage;
