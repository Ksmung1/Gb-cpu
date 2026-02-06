// Optional: Animated version with smooth height
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BlogCaption = ({ username, caption }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 100;

  if (!caption) return null;

  const shouldTruncate = caption.length > maxLength;

  return (
    <div className="px-3 py-1 text-sm">
      <p>
        <span className="font-semibold mr-1">{username}</span>
        <span className="inline">
          {shouldTruncate && !expanded ? (
            <>
              {caption.slice(0, maxLength)}
              <span
                onClick={() => setExpanded(true)}
                className="text-gray-500 cursor-pointer ml-1"
              >
                ...See more
              </span>
            </>
          ) : (
            <AnimatePresence>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline"
              >
                {caption}
                {shouldTruncate && (
                  <span
                    onClick={() => setExpanded(false)}
                    className="text-gray-500 cursor-pointer ml-1"
                  >
                    {" "}
                    See less
                  </span>
                )}
              </motion.span>
            </AnimatePresence>
          )}
        </span>
      </p>
    </div>
  );
};

export default BlogCaption