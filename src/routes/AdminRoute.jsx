import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useUser();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <div className="text-red-600 font-bold text-center mt-10">Access Denied: Admins Only</div>;
  }

  return children;
};

export default AdminRoute;
