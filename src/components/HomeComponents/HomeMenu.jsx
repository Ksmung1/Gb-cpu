import React from "react";
import { useNavigate } from "react-router-dom";
import games from "../../assets/files/games";
import { useDarkMode } from "../../context/DarkModeContext";

const HomeMenu = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const handleClick = (route) => {
    navigate(route);
  };

  // Separate popular and all games
  const popularGames = games.filter((game) => game.filter === "popular");
  const allGames = games; // includes everything

  return (
    <section className="py-3 pt-1" id="coin">

      {/* Popular Games Section */}
      <div className="mb-3">
        <h5 className="text-3xl font-bold text-left mb-2">Popular games</h5>
        <ul className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {popularGames.map(({ id, name, img, route }) => (
            <li
              key={id}
              onClick={() => handleClick(route)}
              className={`
                cursor-pointer ${isDarkMode ? "bg-black" : "bg-white"}
                rounded-lg shadow-md overflow-hidden hover:shadow-xl
                transition-shadow duration-300 p-2 py-1 border border-gray-400
                flex flex-col items-center
              `}
            >
              <div className="size-18 overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  loading="eager"
                  className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 hover:scale-105"
                />
              </div>
              <p className="text-center mt-1 text-[9px] font-medium">{name}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* All Games Section */}
      <div>
        <h5 className="text-3xl font-bold text-left mb-2">All games</h5>
        <ul className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {allGames.map(({ id, name, img, route }) => (
            <li
              key={id}
              onClick={() => handleClick(route)}
              className={`
                cursor-pointer ${isDarkMode ? "bg-black" : "bg-white"}
                rounded-lg shadow-md overflow-hidden hover:shadow-xl
                transition-shadow duration-300 p-2 py-1 border border-gray-400
                flex flex-col items-center
              `}
            >
              <div className="size-18 overflow-hidden"> 
    
                <img
                  src={img}
                  alt={name}
                  loading="eager"
                  className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 hover:scale-105"
                />
              </div>
              <p className="text-center mt-1 text-[9px] font-medium">{name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HomeMenu;