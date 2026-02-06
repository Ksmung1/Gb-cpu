// src/components/blogs/BlogShareModal.jsx
import { FiCopy, FiMessageCircle, FiMail } from "react-icons/fi";
import { useDarkMode } from "../../context/DarkModeContext";

const BlogShareModal = ({ onClose }) => {
          const {isDarkMode} = useDarkMode()
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-end justify-center z-50">
      <div className={` ${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-md rounded-t-2xl p-4 animate-slide-up`}>
        <h3 className="font-bold text-lg mb-4">Share Post</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <button className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
              <FiMessageCircle />
            </div>
            <span className="text-xs mt-1">Message</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
              <FiCopy />
            </div>
            <span className="text-xs mt-1">Copy Link</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white">
              <FiMail />
            </div>
            <span className="text-xs mt-1">Email</span>
          </button>
        </div>
        <button
          onClick={onClose}
          className={`mt-6 w-full py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}  rounded-lg`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BlogShareModal;