import React, { createContext, useState, useEffect, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { auth, db } from "../configs/firebase";

export const UserContext = createContext();

export
 const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageExists, setMessageExists] = useState(false);

  // Pending orders effect (keep as you have)
  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") return;

    const charmsQuery = query(collection(db, "charms-orders"), where("status", "==", "pending"));
    const skinQuery = query(collection(db, "skin-orders"), where("status", "==", "pending"));
    const mlQuery = query(collection(db, "accounts-ml"), where("status", "==", "pending"));

    const checkPending = (charmsSnap, skinSnap, mlSnap) => {
      return !charmsSnap.empty || !skinSnap.empty || !mlSnap.empty;
    };

    let charmsUnsub = () => {};
    let skinUnsub = () => {};
    let mlUnsub = () => {};

    setHasPendingOrders(false);

    charmsUnsub = onSnapshot(charmsQuery, (charmsSnap) => {
      skinUnsub = onSnapshot(skinQuery, (skinSnap) => {
        mlUnsub = onSnapshot(mlQuery, (mlSnap) => {
          setHasPendingOrders(checkPending(charmsSnap, skinSnap, mlSnap));
        });
      });
    });

    return () => {
      charmsUnsub();
      skinUnsub();
      mlUnsub();
    };
  }, [user]);

  // Auth & user data effect + wakeup call
  useEffect(() => {
    let unsubscribeUserDoc = () => {};
    let unsubscribeMessages = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {

        const userDocRef = doc(db, "users", currentUser.uid);

        try {
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) {
            const userData = snapshot.data();
            setIsAdmin(userData.role === "admin");
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            console.warn("User doc missing.");
            setUser({ uid: currentUser.uid });
            setIsAdmin(false);
            localStorage.setItem("user", JSON.stringify({ uid: currentUser.uid }));
          }
        } catch (err) {
          console.error("Error fetching user document:", err);
        }

        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const liveUserData = snap.data();
              setUser(liveUserData);
              setIsAdmin(liveUserData.role === "admin");
              localStorage.setItem("user", JSON.stringify(liveUserData));
            }
          },
          (error) => console.error("Live user update error:", error)
        );

        const messagesQuery = query(
          collection(db, "messages"),
          where("recipientId", "==", currentUser.uid),
          where("read", "==", false)
        );

        unsubscribeMessages = onSnapshot(
          messagesQuery,
          (snapshot) => {
            setMessageExists(!snapshot.empty);
          },
          (error) => {
            console.error("Message listener error:", error);
          }
        );
      } else {
        setUser(null);
        setIsAdmin(false);
        setMessageExists(false);
        localStorage.removeItem("user");
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
      unsubscribeMessages();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, loading, messageExists, hasPendingOrders }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
