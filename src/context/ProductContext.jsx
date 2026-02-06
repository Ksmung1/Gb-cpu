import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../configs/firebase";

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const colRef = collection(db, "mlProductList");

    // Subscribe to realtime updates (uses cache + live)
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(data);
      setLoaded(true);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loaded }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
