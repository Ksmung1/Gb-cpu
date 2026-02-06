// src/components/blogs/BlogLikes.jsx
import { Heart, HeartIcon } from "lucide-react";
import React from "react";

const BlogLikes = ({ likes = [], likedByMe = false }) => {
  if (!likes || likes.length === 0) return null;

  const totalLikes = likes.length;
  const otherLikes = totalLikes - (likedByMe ? 1 : 0);

  // Helper to get names (you can pass full user objects if needed)
  const getName = (user) => user.displayName || user.username || "Someone";

  const youLiked = likedByMe ? "You" : null;
  const firstLiker = likes.find((u) => u.uid !== (likedByMe ? "me" : null));
  const secondLiker = likes.find((u, i) => i === 1 && u.uid !== (likedByMe ? "me" : null));

  return (
    <div className="px-3 py-1 text-sm">
      <p className="flex items-center gap-1 cursor-pointer hover:underline">
        {/* Heart icon */}
        <span className="text-red-500"><HeartIcon/></span>

        {/* Text logic */}
        {totalLikes === 1 ? (
          <span>
            {youLiked ? "You liked this" : `${getName(firstLiker)} liked this`}
          </span>
        ) : totalLikes === 2 ? (
          <span>
            {youLiked
              ? `You and ${getName(firstLiker)} liked this`
              : `${getName(firstLiker)} and ${getName(secondLiker)} liked this`}
          </span>
        ) : (
          <span>
            {youLiked ? (
              <>
                You,{" "}
                <span className="font-medium">{getName(firstLiker)}</span> and{" "}
                <span className="font-medium">
                  {otherLikes === 1
                    ? "1 other"
                    : `${otherLikes.toLocaleString()} others`}
                </span>{" "}
                liked this
              </>
            ) : (
              <>
                <span className="font-medium">{getName(firstLiker)}</span>,{" "}
                <span className="font-medium">{getName(secondLiker)}</span> and{" "}
                <span className="font-medium">
                  {otherLikes - 1 === 1
                    ? "1 other"
                    : `${(otherLikes - 1).toLocaleString()} others`}
                </span>{" "}
                liked this
              </>
            )}
          </span>
        )}
      </p>
    </div>
  );
};

export default BlogLikes;