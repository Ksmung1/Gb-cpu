// src/components/blogs/BlogComment.jsx
import React, { useState } from "react";
import { FiHeart, FiTrash2 } from "react-icons/fi";
import { useDarkMode } from "../../context/DarkModeContext";
import { formatDistanceToNow } from "date-fns";

const BlogComment = ({ comment, onLike, onDelete, time }) => {
  const [liked, setLiked] = useState(comment.likedByMe || false);
  const { isDarkMode } = useDarkMode();
  let lastTap = 0;


  const timeAgo = time
    ? formatDistanceToNow(time, { addSuffix: true })
    : "just now";

  return (
    <div
      className="flex gap-2 p-2 cursor-pointer select-none"
    >
      {/* Avatar */}
      <img
        src={comment.photoURL || "/avatar.jpg"}
        alt={comment.username}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="break-words">
          <span className="font-semibold">{comment.username}</span>{" "}
          <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>
            {comment.text}
          </span>
        </p>

        {/* Meta line */}
        <div className="flex items-center gap-2 text-xs mt-1">
          <span
            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
          >
            {timeAgo}
          </span>

          {comment.likes?.length > 0 && (
            <span
              style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
            >
              {comment.likes.length}{" "}
              {comment.likes.length === 1 ? "like" : "likes"}
            </span>
          )}

          {liked && <FiHeart className="w-3 h-3 text-red-500 fill-current" />}

          {/* DELETE – only if canDelete === true */}
{comment.canDelete && (
  <button
    onClick={() => {
      onDelete?.();
    }}
    className="ml-auto text-red-500 hover:text-red-600"
  >
    <FiTrash2 className="w-4 h-4" />
  </button>
)}
        </div>
      </div>
    </div>
  );
};

export default BlogComment;