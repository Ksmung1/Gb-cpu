// src/components/ScrollToTop.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Native smooth scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    // 2. Fallback for browsers that ignore the smooth flag
    // (e.g. some mobile browsers)
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, [pathname]);   // runs on every route change

  return null;   // renders nothing
}