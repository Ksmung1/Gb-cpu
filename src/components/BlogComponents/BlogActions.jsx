import React from "react";
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { useDarkMode } from "../../context/DarkModeContext";

const BlogActions = ({ post, onLike, onShare, onComment, showComments }) => {
  const { isDarkMode } = useDarkMode();

  const likeCount = post.likes?.length || 0;

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex gap-4">
        {/* Like + Count */}
        <button
          onClick={onLike}
          className={`flex items-center gap-1 transition-all ${
            post.likedByMe ? "text-red-500" : isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <FiHeart
            className={`w-6 h-6 ${post.likedByMe ? "fill-current" : ""}`}
          />
          <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'} `}>
            {likeCount > 0 ? `${likeCount}` : ""}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={onComment}
          className={`flex items-center gap-1 transition-all ${
            showComments ? "text-blue-600" : isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <FiMessageCircle className="w-6 h-6" />
          <span className="text-sm">Comment</span>
        </button>
      </div>

      {/* Share */}
      <button
        onClick={onShare}
        className={isDarkMode ? "text-gray-300" : "text-gray-700"}
      >
        <FiShare2 className="w-6 h-6" />
      </button>
    </div>
  );
};

export default BlogActions;