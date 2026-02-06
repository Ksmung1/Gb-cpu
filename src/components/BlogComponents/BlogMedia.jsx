// src/components/blogs/BlogMedia.jsx
import { useState } from "react";
import { FiHeart } from "react-icons/fi";

const BlogMedia = ({ media, onLike, likedByMe }) => {
  const [showHeart, setShowHeart] = useState(false);
  let lastTap = 0;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (!likedByMe) {
        onLike(); // This triggers real like
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
      }
    }
    lastTap = now;
  };

  return (
    <div
      className="relative bg-black overflow-hidden cursor-pointer"
      onClick={handleDoubleTap}
    >
      <img
        src={media[0]?.url}
        alt="post"
        className="w-full h-auto max-h-96 object-contain"
      />
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <FiHeart className="text-red-500 text-7xl animate-ping fill-current" />
        </div>
      )}
    </div>
  );
};

export default BlogMedia;