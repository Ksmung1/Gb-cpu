import React, { useState, useEffect } from "react";
import { auth, db } from "../../configs/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  EmailAuthProvider,
  linkWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { useUser } from "../../context/UserContext";
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const countryCodes = [
  { code: "+1", label: "US" },
  { code: "+91", label: "IN" },
  { code: "+44", label: "GB" },
  { code: "+61", label: "AU" },
  { code: "+64", label: "NZ" },
  { code: "+92", label: "PK" },
  { code: "+880", label: "BD" },
  { code: "+94", label: "LK" },
  { code: "+977", label: "NP" },
  { code: "+93", label: "AF" },
  { code: "+84", label: "VN" },
  { code: "+62", label: "ID" },
  { code: "+63", label: "PH" },
  { code: "+60", label: "MY" },
  { code: "+65", label: "SG" },
  { code: "+66", label: "TH" },
  { code: "+81", label: "JP" },
  { code: "+82", label: "KR" },
  { code: "+86", label: "CN" },
  { code: "+852", label: "HK" },
  { code: "+971", label: "AE" },
  { code: "+966", label: "SA" },
  { code: "+90", label: "TR" },
  { code: "+20", label: "EG" },
  { code: "+234", label: "NG" },
  { code: "+254", label: "KE" },
  { code: "+27", label: "ZA" },
  { code: "+33", label: "FR" },
  { code: "+49", label: "DE" },
  { code: "+39", label: "IT" },
  { code: "+34", label: "ES" },
  { code: "+55", label: "BR" },
  { code: "+52", label: "MX" },
];

const checkPasswordStrength = (password) => {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length < 6) return { strength: "Weak", color: "text-red-500" };
  if (password.length >= 8 && hasDigit && hasSpecial && (hasUpper || hasLower))
    return { strength: "Strong", color: "text-green-500" };
  return { strength: "Medium", color: "text-yellow-500" };
};

const SignupWithOTP = () => {
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { openModal } = useModal();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { user, setUser } = useUser();

  const passwordStrength = checkPasswordStrength(password);

  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);

  // Setup reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    setError("");
    if (!username.trim()) return setError("Username is required");
    if (username.length > 15) return setError("Username cannot exceed 15 characters");
    if (!email.includes("@")) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (!phoneNumber.match(/^\d{6,14}$/)) return setError("Invalid phone number");

    const fullPhone = countryCode + phoneNumber;
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(result);
      setStep(2);
    } catch (err) {
      setError(err.message.includes("reCAPTCHA") ? "reCAPTCHA failed. Try again." : err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) return setError("Enter 6-digit OTP");
    setLoading(true);
    setError("");

    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;

      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(firebaseUser, credential).catch(() => {});

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          username,
          email,
          phone: countryCode + phoneNumber,
          photoURL: "/avatar.jpg",
          role: "Customer",
          createdAt: serverTimestamp(),
        });
      }

      // Fetch the final user data (in case it was just created)
      const finalDoc = await getDoc(userRef);
      if (!finalDoc.exists()) {
        throw new Error("Failed to create user profile");
      }

      const userData = finalDoc.data();
      const token = await firebaseUser.getIdToken();

      // Store in localStorage (consistent with login flow)
      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);

      openModal({
        title: "Success!",
        content: <p className="text-center">Account created successfully!</p>,
        type: "close",
      });
      navigate("/profile");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.code === "auth/invalid-verification-code" ? "Invalid OTP" : err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google Signup
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userRef = doc(db, "users", googleUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const userData = snap.data();
        const token = await googleUser.getIdToken();
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData);
        openModal({ title: "Welcome back!", content: <p>Logged in with Google!</p>, type: "close" });
        navigate("/profile");
        return;
      }

      await setDoc(userRef, {
        uid: googleUser.uid,
        username: googleUser.displayName || "User",
        email: googleUser.email,
        phone: googleUser.phoneNumber || "",
        photoURL: googleUser.photoURL || "/avatar.jpg",
        role: "Customer",
        createdAt: serverTimestamp(),
      });

      const finalDoc = await getDoc(userRef);
      const userData = finalDoc.data();
      const token = await googleUser.getIdToken();
      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);

      openModal({ title: "Success!", content: <p>Google signup complete!</p>, type: "close" });
      navigate("/profile");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setGoogleLoading(false);
        return;
      }
      console.error("Google signup error:", err);
      setError("Google signup failed: " + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-2 py-8 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800"
          : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      }`}
    >
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-xl transition-all duration-300 ${
          isDarkMode
            ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700"
            : "bg-white/95 backdrop-blur-sm border border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Create Account
          </h1>
          <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Sign up with phone or Google
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Username */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 15))}
                placeholder="johndoe"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-600"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition`}
              />
              <p className="text-xs text-gray-500 mt-1">{username.length}/15</p>
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-600"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition`}
              />
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-lg border pr-12 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-600"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {password && (
                <p className={`text-sm mt-1 flex items-center gap-1 ${passwordStrength.color}`}>
                  <FiCheckCircle size={14} />
                  Strength: <span className="font-medium">{passwordStrength.strength}</span>
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={`px-1 py-2.5 rounded-lg border text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                >
                  {countryCodes.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label} {code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className={` px-2 py-2.5 w-full rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-600"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition`}
                />
              </div>
            </div>

            {/* Send OTP Button */}
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
                loading
                  ? "bg-indigo-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <span className={`px-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>or</span>
              <div className={`flex-1 h-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            </div>

            {/* Google Button - Official Style */}
            <button
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 flex items-center justify-center gap-3 hover:shadow-md transition-all duration-200 active:scale-95 ${
                googleLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              style={{ fontFamily: "Roboto, sans-serif" }}
            >
              <svg width="20" height="20" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.5h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-197.9z"
                  fill="#4285f4"
                />
                <path
                  d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
                  fill="#34a853"
                />
                <path
                  d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z"
                  fill="#fbbc04"
                />
                <path
                  d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 34.5 334.3 0 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z"
                  fill="#ea4335"
                />
              </svg>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </button>

            <div id="recaptcha-container"></div>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <FiCheckCircle className="mx-auto text-green-500" size={48} />
              <p className={`mt-3 text-lg font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                OTP Sent!
              </p>
              <p className="text-sm text-gray-500">Check your phone: {countryCode} {phoneNumber}</p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={`w-full px-4 py-3 text-center text-2xl font-mono tracking-widest rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
                loading || otp.length !== 6
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 active:scale-95"
              }`}
            >
              {loading ? "Verifying..." : "Complete Signup"}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-sm text-indigo-500 hover:underline"
            >
              ← Back to form
            </button>
          </div>
        )}

        {/* Login Link */}
        <p className={`text-center mt-6 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="font-medium text-indigo-500 hover:underline cursor-pointer"
          >
            Log in
          </span>
        </p>
     <p className={`text-center mt-6 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
  Can't create an account?{" "}
  <a
    href="https://wa.me/916009099196?text=Hi%2C%20I%20need%20help%20creating%20an%20account."
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-green-500 hover:underline cursor-pointer"
  >
    Click here
  </a>
</p>
      </div>
    </div>
  );
};

export default SignupWithOTP;