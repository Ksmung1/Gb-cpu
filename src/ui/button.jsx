import React from "react";

export const Button = ({
  children,
  onClick,
  className = "",
  variant = "default",
  size = "md",
}) => {
  const base =
    "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    default: "bg-blue-600 hover:bg-blue-500 text-white",
    outline: "border border-gray-400 text-white hover:bg-gray-700",
  };

  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};
