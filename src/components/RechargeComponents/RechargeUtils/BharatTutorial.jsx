// src/components/RechargeUtils/BharatTutorial.js
import React, { useState, useEffect } from "react";
import { useDarkMode } from "../../../context/DarkModeContext";
import utr1 from "../../../assets/images/utr-1.jpg";
import utr2 from "../../../assets/images/utr-2.jpg";
import utr3 from "../../../assets/images/utr-3.jpg";
import { FiYoutube, FiZoomIn } from "react-icons/fi";

const DEMO_IMAGES = [utr1, utr2, utr3];

export default function BharatTutorial({ onContinue, onDontShowAgain }) {
  const { isDarkMode } = useDarkMode();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [dontShow, setDontShow] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null); // For zoom modal

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    if (dontShow) onDontShowAgain();
    onContinue();
  };

  const openZoom = (imgSrc) => {
    setZoomedImage(imgSrc);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  return (
    <>
      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90"
          onClick={closeZoom}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={zoomedImage}
              alt="Zoomed UPI Step"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <button
              onClick={closeZoom}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm"
            >
              <FiZoomIn size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Main Tutorial */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm ${
          isDarkMode ? "bg-gray-900/95" : "bg-black/80"
        }`}
      >
        <div
          className={`max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-6 ${
            isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
          }`}
        >
          {/* Header with YouTube Link */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">How to Pay with UPI</h2>
          </div>
          <div>
           <a
              href="https://www.youtube.com/watch?v=YOUR_OFFICIAL_VIDEO_ID"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-white text-black gap-2 text-sm font-medium transition-colors"
            >
              <FiYoutube className="text-red-500" size={20} />
              Watch Tutorial
            </a>
          </div>

          {/* Scrollable Steps */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
            {[
              "Complete the payment in your UPI app.",
              "Copy and enter UTR/ TXN/ UPI Transaction ID or reference number.",
              "Submit the UTR and wait a few seconds until successful",
            ].map((text, index) => (
              <div
                key={index}
                className={`flex gap-4 items-start p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex-shrink-0 relative group">
                  <img
                    src={DEMO_IMAGES[index]}
                    alt={`Step ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg cursor-zoom-in transition-transform group-hover:scale-105"
                    onClick={() => openZoom(DEMO_IMAGES[index])}
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/400x300?text=Step+${index + 1}`;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                    <FiZoomIn className="text-white" size={20} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-md">Step {index + 1}</p>
                  <p className="text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Don’t show again */}
          <div className="flex items-center gap-2">
            <input
              id="dont-show"
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="rounded w-4 h-4"
            />
            <label htmlFor="dont-show" className="text-sm cursor-pointer">
              Don’t show this again
            </label>
          </div>

          {/* Continue Button */}
          <button
            disabled={secondsLeft > 0}
            onClick={handleContinue}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
              secondsLeft > 0
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
            }`}
          >
            {secondsLeft > 0 ? `Continue in ${secondsLeft}s` : "I Understand"}
          </button>
        </div>
      </div>
    </>
  );
}