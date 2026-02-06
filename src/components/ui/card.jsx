import React from "react";

export const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-gray-800 bg-slate-900 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
