import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Profile from "./pages/Profile";
import { FaTrophy } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";
import { useDarkMode } from "../context/DarkModeContext";
import gamebar from "../assets/images/gamebar-logo.png"
const Navbar = () => {
  const navigate = useNavigate();
  const { user,hasPendingOrders } = useUser();
  const [profileVisible, setProfileVisible] = useState(false);
  const profileRef = useRef();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const photoURL = user?.photoURL || '/avatar.jpg';



  const handleNavigation = () => {
      setProfileVisible((prev) => !prev);

  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileVisible(false);
      }
    };

    if (profileVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileVisible]);

return (
<header
  className={`fixed top-0 left-0 w-full z-50 px-4 md:px-20 lg:px-40 py-2 flex justify-between items-center h-14 shadow-md
    ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
>
    {/* Logo & Title */}
    <div className="flex items-center space-x-2">
    <div className="relative w-10 h-10 min-w-10 flex items-center" onClick={handleNavigation}>
      <RxHamburgerMenu className={isDarkMode ? 'text-white' : 'text-black'} size={35} />
      
      {hasPendingOrders && (
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
      )}
    </div>
      <h6
        onClick={() => navigate('/')}
        className={`object-contain flex ${isDarkMode ?'text-gray-100' : 'text-gray-800'} `}
      >
        <img className="w-full h-12" src={gamebar}  alt="" />
        <span className="text-[1px]">Gamebar</span>
      </h6>
    </div>

    {/* Right Side: Profile/Login */}
    <div className="flex items-center space-x-4 relative">
      <div
        className="cursor-pointer"
        onClick={() => navigate('/leaderboards')}
      >
        <FaTrophy className="text-yellow-500 w-6 h-6" />
      </div>
<div
  onClick={toggleDarkMode}
  className={`w-13 h-6 flex items-center bg-gray-300 rounded-full px-1 cursor-pointer transition-colors duration-300 ${
    isDarkMode ? 'bg-gray-400' : 'bg-gray-00'
  }`}
>
  <div
    className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
      isDarkMode ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white'
    }`}
  ></div>
</div>


<div
  className="relative h-10 w-10 rounded-full overflow-hidden cursor-pointer"
  onClick={() => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/authentication-selection');
    }
  }}
>
  {/* 🔴 Notification Red Dot */}


  {user ? (
    <img
      src={photoURL}
      alt="Profile"
      onError={(e) => (e.target.src = './avatar.jpg')}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 font-semibold">

      Login
    </div>
  )}
</div>



      {profileVisible && (
        <div
          ref={profileRef}
          className="absolute top-12 right-0 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded shadow-md dark:shadow-gray-700 z-50"
        >
          <Profile setProfileVisible={setProfileVisible} />
        </div>
      )}
    </div>
  </header>
);

};

export default Navbar;
