// src/hooks/useBlogs.js
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { auth,db } from "../configs/firebase";
import { getAuth } from "firebase/auth";
import { useUser } from "../context/UserContext";

export const useBlogs = () => {
  const [posts, setPosts] = useState([]);
  const {user} = useUser()
  const [loading, setLoading] = useState(true);
  const currentUser = user;

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // -------------------------------------------------
    // 1. Posts
    // -------------------------------------------------
    const postsQ = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(postsQ, (postSnap) => {
      const promises = postSnap.docs.map((postDoc) => {
        const p = { id: postDoc.id, ...postDoc.data() };
        const likedByMe = p.likes?.includes(currentUser.uid) || false;
        const isAdmin = ["admin"].includes(currentUser.role || "");

        // -------------------------------------------------
        // 2. Comments (real‑time)
        // -------------------------------------------------
        const comRef = collection(postDoc.ref, "comments");
        const comQ = query(comRef, orderBy("createdAt", "desc"));

        return new Promise((resolve) => {
          const unsubCom = onSnapshot(comQ, (comSnap) => {
            const comments = comSnap.docs.map((c) => {
              const cd = { id: c.id, ...c.data() };
              const commentLiked = cd.likes?.includes(currentUser.uid) || false;
              const isOwn = cd.authorId === currentUser.uid;
              const canDelete = isOwn || isAdmin;   // <-- key flag

              // -------------------------------------------------
              // 3. Replies (real‑time)
              // -------------------------------------------------
              const repRef = collection(c.ref, "replies");
              const repQ = query(repRef, orderBy("createdAt", "desc"));
              const unsubRep = onSnapshot(repQ, (repSnap) => {
                const replies = repSnap.docs.map((r) => ({
                  id: r.id,
                  ...r.data(),
                  likedByMe: r.data().likes?.includes(currentUser.uid) || false,
                  isOwn: r.data().authorId === currentUser.uid,
                  canDelete: r.data().authorId === currentUser.uid || isAdmin,
                }));

                setPosts((prev) =>
                  prev.map((po) =>
                    po.id === p.id
                      ? {
                          ...po,
                          comments: po.comments.map((co) =>
                            co.id === c.id ? { ...co, replies } : co
                          ),
                        }
                      : po
                  )
                );
              });

              return {
                ...cd,
                likedByMe: commentLiked,
                replies: [],
                canDelete,               // <-- used in UI
                _unsubRep: unsubRep,
              };
            });

            resolve({
              ...p,
              likedByMe,
              comments,
              _unsubCom: unsubCom,
            });
          });
        });
      });

      Promise.all(promises).then((newPosts) => {
        setPosts((prev) => {
          prev.forEach((po) => {
            po._unsubCom?.();
            po.comments?.forEach((co) => co._unsubRep?.());
          });
          return newPosts;
        });
        setLoading(false);
      });
    });

    return () => {
      unsubPosts();
      posts.forEach((p) => {
        p._unsubCom?.();
        p.comments?.forEach((c) => c._unsubRep?.());
      });
    };
  }, [currentUser]);

  // -----------------------------------------------------------------
  // ACTIONS
  // -----------------------------------------------------------------
const deleteComment = async (postId, commentId, replyId) => {
  if (replyId) {
    await deleteDoc(doc(db, "blogs", postId, "comments", commentId, "replies", replyId));
  } else {
    await deleteDoc(doc(db, "blogs", postId, "comments", commentId));
  }
};

  const addComment = async (postId, text) => {
    const ref = doc(db, "blogs", postId);
    await addDoc(collection(ref, "comments"), {
      authorId: currentUser.uid,
      username: currentUser.username || "You",
      photoURL: currentUser.photoURL || "/avatar.jpg",
      text,
      likes: [],
      createdAt: serverTimestamp(),
    });
  };

  const likeComment = async (postId, commentId, liked) => {
    const ref = doc(db, "blogs", postId, "comments", commentId);
    await updateDoc(ref, {
      likes: liked ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid),
    });
  };

  const addReply = async (postId, commentId, text) => {
    const ref = doc(db, "blogs", postId, "comments", commentId);
    await addDoc(collection(ref, "replies"), {
      authorId: currentUser.uid,
      username: currentUser.username || "You",
      photoURL: currentUser.photoURL || "/avatar.jpg",
      text,
      likes: [],
      createdAt: serverTimestamp(),
    });
  };

  const likePost = async (postId) => {
    const ref = doc(db, "blogs", postId);
    const post = posts.find((p) => p.id === postId);
    const liked = post?.likedByMe;
    await updateDoc(ref, {
      likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  const addPost = async (caption, imageUrl) => {
    await addDoc(collection(db, "blogs"), {
      authorId: currentUser.uid,
      username: currentUser.username || "You",
      photoURL: currentUser.photoURL || "/avatar.jpg",
      caption,
      media: [{ url: imageUrl }],
      likes: [],
      createdAt: serverTimestamp(),
    });
  };

  const deletePost = async (postId) => {
    await deleteDoc(doc(db, "blogs", postId));
  };

  return {
    posts,
    loading,
    currentUser,
    likePost,
    addComment,
    deleteComment,
    likeComment,
    addReply,
    addPost,
    deletePost,
  };
};