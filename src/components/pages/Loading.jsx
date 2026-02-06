import { useDarkMode } from "../../context/DarkModeContext";


const Loading = ({ message = ''}) => {
  const {isDarkMode} = useDarkMode()
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen w-full text-center animate-fadeIn
        ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-700'}`}
    >
    </div>
  );
};

export default Loading;
