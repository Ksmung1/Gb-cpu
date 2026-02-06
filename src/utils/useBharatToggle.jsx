// src/hooks/useBharatToggle.ts
import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../configs/firebase";
import { useUser } from "../context/UserContext";

export const useBharatToggle = () => {
  const { user } = useUser();
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    // 1. Listen to the **correct** global toggle: config/bharatToggle
    const toggleRef = doc(db, "config", "bharatToggle");
    const unsubToggle = onSnapshot(
      toggleRef,
      async (snap) => {
        const data = snap.data();
        console.log(data)
        const enabled = data?.toggle === true;   // <-- respects { enabled: true }

        if (!enabled) {
          setShowTutorial(false);
          setIsLoading(false);
          return;
        }

        // 2. Check per-user “don’t show again”
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const hide = userSnap.data()?.hideBharatTutorial === true;

        setShowTutorial(!hide);
        setIsLoading(false);
      },
      (err) => {
        console.error("bharatToggle listener error:", err);
        setIsLoading(false);
      }
    );

    return () => unsubToggle();
  }, [user?.uid]);

  // Save “don’t show again” in the user’s document
  const hideForever = async () => {
    if (!user?.uid) return;
    await setDoc(
      doc(db, "users", user.uid),
      { hideBharatTutorial: true },
      { merge: true }
    );
    setShowTutorial(false);
  };

  return { showTutorial, isLoading, hideForever };
};