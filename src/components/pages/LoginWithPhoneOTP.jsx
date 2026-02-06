import { useNavigate } from "react-router-dom";
import LoginWithEmail from "./LoginWithEmail";
import { useDarkMode } from "../../context/DarkModeContext";
import { useUser } from "../../context/UserContext";

const LoginWithPhoneOTP = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();

  // Redirect if user is already logged in
  if (user) {
    navigate("/profile");
  }

  return (
    <div
      className={`pt-25 px-3 flex items-center justify-center ${
        isDarkMode
          ? "bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700"
          : "bg-gradient-to-tr from-indigo-100 to-blue-200"
      }`}
    >
      <div
        className={`p-6 rounded-xl shadow-lg w-full max-w-md space-y-6 flex flex-col items-center ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2
          className={`text-2xl font-bold text-center ${
            isDarkMode ? "text-indigo-400" : "text-indigo-700"
          }`}
        >
          Welcome!
        </h2>

        <p className={`text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          Choose an option to continue
        </p>

        <div className="w-full">
          {/* Login Button */}
          <button
            onClick={() => navigate("/login")} // Replace with actual login route
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md ${
              isDarkMode
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            Login
          </button>
          <p className="text-sm text-center">For existing users</p>
          <p className="text-center">or</p>

          {/* Signup Button */}
          <button
            onClick={() => navigate("/sign-up")} // Replace with actual signup route
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-md border ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-indigo-400 border-indigo-500"
                : "bg-white hover:bg-gray-50 text-indigo-700 border-indigo-400"
            }`}
          >
            Create Account
          </button>
          <p className="text-sm text-center">For new users</p>

        </div>

  
      </div>
    </div>
  );
};

export default LoginWithPhoneOTP;