// src/components/blogs/BlogComments.jsx
import React, { useState } from "react";
import BlogComment from "./BlogComment";
import { useDarkMode } from "../../context/DarkModeContext";

const BlogComments = ({
  comments = [],
  onCommentLike,
  onReply,
  postId,
  onComment,
  onDeleteComment,
}) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const { isDarkMode } = useDarkMode();

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(replyingTo, replyText);
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div
      className={`border-t px-3 py-2 max-h-96 overflow-y-auto ${
        isDarkMode ? "border-gray-700" : "border-gray-300"
      }`}
    >
      {/* Add Comment */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.target.elements.comment;
          if (input.value.trim()) {
            onComment(input.value);
            input.value = "";
          }
        }}
        className="flex gap-2 mb-3 sticky top-0 bg-inherit z-10 pt-2"
      >
        <input
          name="comment"
          type="text"
          placeholder="Add a comment..."
          className={`flex-1 px-3 py-1 text-sm border rounded-full outline-none ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          }`}
        />
        <button type="submit" className="text-sm font-medium text-blue-600">
          Post
        </button>
      </form>

      {/* Comments */}
      {comments.map((c) => (
        <div key={c.id} className="mb-4">
          {/* Main Comment */}
          <BlogComment
            comment={c}
            onLike={(liked) => onCommentLike(postId, c.id, liked)}
            onDelete={() => onDeleteComment(postId, c.id)}
            time={c.createdAt?.toDate()}
          />

          {/* Reply Button */}
          <button
            onClick={() => setReplyingTo(c.id)}
            className="text-xs hover:underline ml-10"
            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
          >
            Reply
          </button>

          {/* Reply Input */}
          {replyingTo === c.id && (
            <div className="ml-10 mt-2 flex gap-2 items-center">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder="Write a reply..."
                className={`flex-1 px-3 py-1 text-sm border rounded-full outline-none ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                autoFocus
              />
              <button onClick={handleReply} className="text-sm text-blue-600">
                Send
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
                className="text-xs"
                style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Replies */}
          {c.replies?.map((r) => (
            <div
              key={r.id}
              className={`ml-10 mt-2 pl-3 ${
                isDarkMode ? "border-l-2 border-gray-700" : "border-l-2 border-gray-200"
              }`}
            >
              <BlogComment
                comment={r}  // ← Use REPLY data
                onLike={() => {}} // Optional: add reply likes later
                onDelete={() => onDeleteComment(postId, c.id, r.id)} // ← Pass replyId
                time={r.createdAt?.toDate()}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default BlogComments;