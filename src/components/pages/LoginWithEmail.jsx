import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth, db } from "../../configs/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from "../../context/UserContext";
import { useModal } from "../../context/ModalContext";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import { FiEye, FiEyeOff, FiMail, FiLock, FiAlertCircle } from "react-icons/fi";

const LoginWithEmail = () => {
  const { isDarkMode } = useDarkMode();
  const { user,setUser } = useUser();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);

  // ----------- EMAIL/PASSWORD LOGIN -----------
  const loginWithEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) throw new Error("User profile not found.");

      const userData = userDoc.data();
      const token = await user.getIdToken();

      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);

      openModal({
        title: "Welcome Back!",
        content: <p className="text-center">Hello, {userData.username || "User"}!</p>,
        type: "close",
      });
      navigate("/profile");
    } catch (err) {
      const code = err.code;
      if (code === "auth/user-not-found") setError("No account found with this email.");
      else if (code === "auth/wrong-password") setError("Incorrect password.");
      else if (code === "auth/invalid-email") setError("Invalid email address.");
      else if (code === "auth/too-many-requests") setError("Too many attempts. Try again later.");
      else setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----------- PASSWORD RESET -----------
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) return setError("Enter your email to reset password");
    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 8000);
    } catch (err) {
      setError("Failed to send reset email. Check if email is registered.");
    } finally {
      setLoading(false);
    }
  };

  // ----------- GOOGLE LOGIN / SIGNUP -----------
  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          username: user.displayName || user.email.split("@")[0],
          email: user.email,
          phone: user.phoneNumber || "",
          photoURL: user.photoURL || "/avatar.jpg",
          role: "Customer",
          createdAt: serverTimestamp(),
        });
      }

      const finalDoc = await getDoc(userRef);
      const userData = finalDoc.data();
      const token = await user.getIdToken();

      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);

      openModal({
        title: userSnap.exists() ? "Welcome Back!" : "Account Created!",
        content: <p className="text-center">Hello, {userData.username}!</p>,
        type: "close",
      });
      navigate("/profile");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setGoogleLoading(false);
        return;
      }
      console.error("Google login error:", err);
      setError("Google login failed. Try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-2 py-8 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900"
          : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      }`}
    >
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode
            ? "bg-gray-800/90 border-gray-700"
            : "bg-white/95 border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {showResetForm ? "Reset Password" : "Welcome Back"}
          </h1>
          <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {showResetForm
              ? "Enter your email to reset password"
              : "Log in to your account"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <FiAlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {resetSent && (
          <div className="mb-5 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm text-center">
            Reset email sent! Check your inbox (and spam).
          </div>
        )}

        {/* Login Form */}
        {!showResetForm ? (
          <form onSubmit={loginWithEmail} className="space-y-5">
            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-600"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-600"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
                loading
                  ? "bg-indigo-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        ) : (
          /* Reset Form */
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600"
                  } focus:outline-none focus:ring-2 focus:ring-green-500/20 transition`}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
                loading
                  ? "bg-green-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 active:scale-95"
              }`}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Divider */}
        {!showResetForm && (
          <>
            <div className="flex items-center my-6">
              <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <span className={`px-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>or</span>
              <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            </div>

            {/* Google Button - Official */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 flex items-center justify-center gap-3 hover:shadow-md transition-all duration-200 active:scale-95 ${
                googleLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              style={{ fontFamily: "Roboto, sans-serif" }}
            >
              <svg width="20" height="20" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                <path d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.5h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-197.9z" fill="#4285f4" />
                <path d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z" fill="#34a853" />
                <path d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z" fill="#fbbc04" />
                <path d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 34.5 334.3 0 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z" fill="#ea4335" />
              </svg>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </button>
          </>
        )}

        {/* Footer Links */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm gap-3">
          {!showResetForm ? (
            <>
              <button
                onClick={() => setShowResetForm(true)}
                className="text-indigo-500 hover:underline font-medium"
              >
                Forgot password?
              </button>
              <button
                onClick={() => navigate("/sign-up")}
                className="text-indigo-500 hover:underline font-medium"
              >
                Create an account
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShowResetForm(false);
                setResetSent(false);
                setError("");
              }}
              className="text-indigo-500 hover:underline font-medium"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginWithEmail;