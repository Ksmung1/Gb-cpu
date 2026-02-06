// src/pages/Blogs.jsx
import React, { useState, useEffect } from "react";
import BlogPost from "../BlogComponents/BlogPost";
import BlogShareModal from "../BlogComponents/BlogShareModal";
import AddBlogForm from "../BlogComponents/AddBlogForm";
import { useBlogs } from "../../hooks/useBlogs";
import { getDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useDarkMode } from "../../context/DarkModeContext";

const DeleteConfirmModal = ({ onConfirm, onCancel }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } rounded-xl p-6 max-w-sm w-full shadow-2xl`}
      >
        <h3 className="text-lg font-bold mb-3">Delete Post?</h3>
        <p className="text-sm opacity-70 mb-4">
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 py-2 rounded-lg ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Blogs = () => {
  const { posts, loading, currentUser, likePost, addComment, likeComment, addReply, addPost, deleteComment } = useBlogs();
  const [showShare, setShowShare] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { isDarkMode } = useDarkMode();

  // Fetch user role
  useEffect(() => {
    if (currentUser?.uid) {
      getDoc(doc(db, "users", currentUser.uid)).then((snap) => {
        setUserRole(snap.data()?.role);
      });
    }
  }, [currentUser]);

  const handleDeletePost = async (postId) => {
    setShowDeleteConfirm(postId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await deleteDoc(doc(db, "blogs", showDeleteConfirm));
      setShowDeleteConfirm(null);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };


  return (
    <div
      className={`min-h-screen py-4 transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900"
          : "bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50"
      }`}
    >
      <div className="max-w-2xl mx-auto px-4">

        {/* Admin Add Button */}
        {["admin", "reseller"].includes(userRole) && (
          <button
            onClick={() => setShowAddForm(true)}
            className="fixed bottom-20 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl z-40 transform hover:scale-110 transition-all"
          >
            +
          </button>
        )}

        {/* Posts */}
        <div className="space-y-6 pb-20">
          {posts.length === 0 ? (
            <p className="text-center py-16 opacity-70">No posts yet.</p>
          ) : (
            posts.map((post) => (
<BlogPost
  key={post.id}
  post={post}
  onLike={() => likePost(post.id)}
  onCommentLike={(cid, liked) => likeComment(post.id, cid, liked)}
  onReply={(cid, text) => addReply(post.id, cid, text)}
  onComment={(text) => addComment(post.id, text)}
  onDeleteComment={(postId, commentId) => deleteComment(postId, commentId)}
  onShare={() => setShowShare(post.id)}
  onDelete={handleDeletePost}
  currentUser={{
    ...currentUser,
    role: userRole, // ← CRITICAL: Pass role
  }}
/>
            ))
          )}
        </div>

        {/* Modals */}
        {showShare && <BlogShareModal onClose={() => setShowShare(null)} />}
        {showAddForm && <AddBlogForm onClose={() => setShowAddForm(false)} addPost={addPost} />}
        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteConfirm(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Blogs;