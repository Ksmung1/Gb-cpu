// src/components/blogs/BlogPost.jsx
import React, { useState } from "react";
import BlogHeader from "./BlogHeader";
import BlogMedia from "./BlogMedia";
import BlogActions from "./BlogActions";
import BlogLikes from "./BlogLikes";
import BlogCaption from "./BlogCaption";
import BlogComments from "./BlogComments";
import { useDarkMode } from "../../context/DarkModeContext";

const BlogPost = ({
  post,
  onLike,
  onCommentLike,
  onReply,
  onComment,
  onShare,
  onDelete,
  onDeleteComment, // ← RECEIVE IT
  currentUser,
}) => {
  const [showComments, setShowComments] = useState(false);
  const { isDarkMode } = useDarkMode();

  return (
    <article
      className={`rounded-xl shadow-sm overflow-hidden mb-4 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <BlogHeader post={post} currentUser={currentUser} onDelete={onDelete} />
      <BlogMedia media={post.media} onLike={onLike} likedByMe={post.likedByMe} />
      <BlogActions
        post={post}
        onLike={onLike}
        onShare={onShare}
        onComment={() => setShowComments(!showComments)}
        showComments={showComments}
      />
      <BlogLikes likes={post.likes} likedByMe={post.likedByMe} />
      <BlogCaption caption={post.caption} username={post.username} />

      {showComments && (
        <div className="animate-fadeIn">
          <BlogComments
            comments={post.comments}
            onCommentLike={(cid, liked) => onCommentLike(post.id, cid, liked)}
            onReply={(cid, text) => onReply(post.id, cid, text)}
            onComment={onComment}
            onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)} // ← PASS IT
            postId={post.id}
            currentUser={currentUser}
          />
        </div>
      )}
    </article>
  );
};

export default BlogPost;