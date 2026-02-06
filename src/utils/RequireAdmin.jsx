// RequireAdmin.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const RequireAdmin = ({ children }) => {
  const { user } = useUser();
  const isApiUser = user?.role === "admin" || user?.role === "api";

  if (!isApiUser) {
    return <Navigate to="/" replace />;
  }

  // if admin → render the child component
  return children;
};

export default RequireAdmin;
