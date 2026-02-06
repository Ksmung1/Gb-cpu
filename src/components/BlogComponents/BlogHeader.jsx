// src/components/blogs/BlogHeader.jsx
import React, { useState } from "react";
import { FiMoreVertical } from "react-icons/fi";

const BlogHeader = ({ post, currentUser, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = ["admin"].includes(currentUser?.role);

  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <img
          src={post.photoURL || "/avatar.jpg"}
          alt={post.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-sm">{post.username}</p>
          <p className="text-xs text-gray-500">Just now</p>
        </div>
      </div>

      {/* 3-dot menu */}
      {isAdmin && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete Post
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogHeader;