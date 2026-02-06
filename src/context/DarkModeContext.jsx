// src/context/DarkModeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext();
export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(null); // null until detected
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const localPref = localStorage.getItem('theme');

    // If user has a saved preference → use it
    if (localPref) {
      setIsDarkMode(localPref === 'dark');
    } 
    // No saved preference → DEFAULT TO LIGHT (ignore system)
    else {
      setIsDarkMode(false); // ← Force light mode as default
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isDarkMode !== null) {
      document.documentElement.classList.toggle('dark', isDarkMode);
      // Optional: Save to localStorage on initial load too
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  if (!hydrated) return null; // Prevent flash/flicker

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};