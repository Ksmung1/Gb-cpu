import React, { useState, useRef, useEffect } from "react";
import FlappyBirdGame from "../GameComponents/FlappyBirdGame";
import { useUser } from "../../context/UserContext";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";

const STORAGE_KEY = "flappyGameState";

const getToday6AM = () => {
  const now = new Date();
  const sixAM = new Date(now);
  sixAM.setHours(6, 0, 0, 0);
  if (now < sixAM) {
    sixAM.setDate(sixAM.getDate() - 1);
  }
  return sixAM.getTime();
};

const birdImages = [
  "/flappy/bird.png",
  "/flappy/bird2.png",
  "/flappy/bird3.png",
];

const Games = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { user } = useUser();

  const [isPaused, setIsPaused] = useState(false);
  const gameRef = useRef();

  const [remainingTries, setRemainingTries] = useState(5);
  const [showGame, setShowGame] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [mode, setMode] = useState(null);

  const [selectedBirdIndex, setSelectedBirdIndex] = useState(0);

  // New state: do we have a saved game to continue?
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // Check localStorage for saved game on mount or when showGame changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state && typeof state.birdY === "number") {
          setHasSavedGame(true);
        } else {
          setHasSavedGame(false);
        }
      } else {
        setHasSavedGame(false);
      }
    } catch {
      setHasSavedGame(false);
    }
  }, [showGame]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setHighScore(data.flappyScore || 0);
        const lastPlayTime = data.flappyLastPlayDate || 0;
        const resetTime = getToday6AM();
        const tries = lastPlayTime >= resetTime ? data.flappyTriesToday || 0 : 0;
        setRemainingTries(5 - tries);
      }
    };
    loadUserData();
  }, [user, showGame, isGameOver]);

  const consumeTry = async () => {
  if (!user) return false;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};
  const lastPlayDate = data.flappyLastPlayDate || 0;
  const resetTime = getToday6AM();

  let triesToday = 0;
  if (lastPlayDate >= resetTime) {
    triesToday = (data.flappyTriesToday || 0) + 1;
  } else {
    triesToday = 1;
  }

  if (triesToday > 5) {
    // no tries left
    return false;
  }

  await updateDoc(userRef, {
    flappyTriesToday: triesToday,
    flappyLastPlayDate: Date.now(),
  });

  setRemainingTries(5 - triesToday);
  return true;
};

  const navigateWithConfirm = (url) => {
    if (showGame && !isGameOver) {
      openModal({
        type: "confirm",
        title: "Quit Game?",
        content: "Are you sure you want to quit this game?",
        onConfirm: () => navigate(url),
      });
    } else {
      navigate(url);
    }
  };

  const handleGameOver =async (finalScore) => {
    setScore(finalScore);
    setIsGameOver(true);
    setShowGame(false);
     if (user) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};
    const currentHighScore = data.flappyScore || 0;

    if (finalScore > currentHighScore) {
      // Update high score in Firestore
      await updateDoc(userRef, { flappyScore: finalScore });
      // Update local highScore state so UI reflects new record immediately
      setHighScore(finalScore);
    }
  }
  };
  // Add this helper function inside your component:


  const handleDeath = () => {
    if (user && mode === "rank") {
    }
  };

const handleStart = async (selectedMode) => {
  if (selectedMode === "rank") {
    if (remainingTries <= 0) {
      openModal({
        type: "alert",
        title: "No Tries Left",
        content: "You have no tries left for today. Come back tomorrow!",
      });
      return;
    }

    const success = await consumeTry();
    if (!success) {
      openModal({
        type: "close",
        title: "No Tries Left",
        content: "You have no tries left for today. Come back tomorrow!",
      });
      return;
    }
  }

  setMode(selectedMode);
  setIsGameOver(false);
  setShowGame(true);
  setScore(0);
};

const handleRestart = async () => {
  if (mode === "rank") {
    if (remainingTries <= 0) {
      openModal({
        type: "close",
        title: "No Tries Left",
        content: "You have no tries left for today. Come back tomorrow!",
      });
      setIsGameOver(false);
      setShowGame(false);
      setMode(null);
      return;
    }

    const success = await consumeTry();
    if (!success) {
      openModal({
        type: "close",
        title: "No Tries Left",
        content: "You have no tries left for today. Come back tomorrow!",
      });
      setIsGameOver(false);
      setShowGame(false);
      setMode(null);
      return;
    }
  }

  setIsGameOver(false);
  setShowGame(true);
  setScore(0);
  gameRef.current?.restart?.();
};

  const shareScore = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Flappy Bird Score",
        text: `I scored ${score} points in Fappy Kaja! Can you beat me?`,
        url: window.location.href,
      });
    } else {
      openModal({
        type: "close",
        title: "Sharing not supported",
        content: "Your browser doesn't support the Web Share API.",
      });
    }
  };

  const onBirdUp = () => {
    setSelectedBirdIndex((prev) =>
      prev === 0 ? birdImages.length - 1 : prev - 1
    );
  };

  const onBirdDown = () => {
    setSelectedBirdIndex((prev) =>
      prev === birdImages.length - 1 ? 0 : prev + 1
    );
  };

  // New function to continue saved game
  const handleContinueGame = () => {
    setMode("classic"); // or you can save mode in storage and restore it here
    setShowGame(true);
    setIsGameOver(false);
    setIsPaused(false);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/flappy/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Press Start 2P', cursive",
        color: "white",
      }}
    >
      {!showGame && !isGameOver && (
        <div className="flex flex-col items-center space-y-4 max-w-md px-4">
          <h1 className="text-3xl text-white drop-shadow">Fappy Kaja</h1>

          <div className="flex flex-row items-center select-none">
            <button
              onClick={onBirdUp}
              className="mr-2 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              aria-label="Select previous bird"
            >
              ◀
            </button>
            <img
              src={birdImages[selectedBirdIndex]}
              alt="Selected Bird"
              className="w-12 h-10 mx-2"
              draggable={false}
            />
            <button
              onClick={onBirdDown}
              className="ml-2 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              aria-label="Select next bird"
            >
              ▶
            </button>
          </div>

          {user && <p className="text-sm">HIGHSCORE: {highScore}</p>}

          <button
            onClick={() => navigateWithConfirm("/leaderboards")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm shadow-lg w-full"
          >
            Leaderboards
          </button>

          {hasSavedGame && (
            <button
              onClick={handleContinueGame}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm shadow-lg w-full mt-2"
            >
              Continue Last Game
            </button>
          )}

          <div className="flex gap-4 w-full">
            <button
              onClick={() => handleStart("classic")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm shadow-lg flex-1"
            >
              CLASSIC
            </button>
            <button
              onClick={() => handleStart("rank")}
              className="bg-red-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm shadow-lg flex-1"
            >
              RANK
            </button>
          </div>

          {user && (
            <div className="bg-gray-500 hover:bg-gray-600 p-2 rounded-md px-3 w-full text-center">
              <p className="text-sm mt-1">Tries Left Today: {remainingTries}</p>
            </div>
          )}
        </div>
      )}

      {showGame && (
        <>
          <FlappyBirdGame
            ref={gameRef}
            birdImage={birdImages[selectedBirdIndex]}
            pipeImage="/flappy/pipe.png"
            backgroundImage="/flappy/bg.png"
            onGameEnd={handleGameOver}
            onDeath={handleDeath}
            mode={mode}
            openModal={openModal}
          />

          <div className="mt-4 flex gap-4">
            {!isPaused ? (
              <button
                onClick={() => {
                  setIsPaused(true);
                  gameRef.current?.pauseGame?.();
                }}
                className="bg-gray-700 text-white px-3 py-1 rounded"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsPaused(false);
                  gameRef.current?.resumeGame?.();
                }}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Resume
              </button>
            )}
          </div>
        </>
      )}

      {isGameOver && (
        <div className="absolute bg-[#f5e4c3] max-w-md text-black px-3 py-6 rounded-lg shadow-lg text-center space-y-3 border-4 border-orange-500">
          <p className="text-xs">SCORE</p>
          <p className="text-2xl">{score}</p>
          {user && mode === "rank" && (
            <>
              <p className="text-xs mt-2">HIGHSCORE</p>
              <p className="text-2xl">{highScore}</p>
              <p className="text-xs mt-1">Tries Left Today: {remainingTries}</p>
            </>
          )}

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleRestart}
              className="bg-orange-500 text-sm px-2 py-2 rounded text-white shadow"
            >
              RESTART
            </button>
            <button
              onClick={shareScore}
              className="bg-green-500 text-sm px-2 py-2 rounded text-white shadow"
            >
              SHARE
            </button>
            <button
              onClick={() => {
                setIsGameOver(false);
                setMode(null);
              }}
              className="bg-blue-500 px-2 text-sm py-2 rounded text-white shadow"
            >
              MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
