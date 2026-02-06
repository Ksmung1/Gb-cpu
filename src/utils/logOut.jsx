import { auth } from "../configs/firebase";
import { signOut } from "firebase/auth";

export const logOut = async () => {
  try {
    await signOut(auth);
    // Clear all localStorage items related to auth
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
  } catch (err) {
    console.error("Logout failed:", err);
    // Even if signOut fails, clear localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
  }
};