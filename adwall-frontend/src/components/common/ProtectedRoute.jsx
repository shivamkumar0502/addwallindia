// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "@/context/AuthContext";

// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const { user, loading, isAuthenticated } = useAuth();
//   const location = useLocation();

//   if (loading) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
//     </div>
//   );

//   if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
//   if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
//   return children;
// };
// export default ProtectedRoute;

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
      </div>
    );

  // FIX: `location` object har render pe naya reference deta tha, jisse
  // Navigate baar baar naya state push karta tha. Sirf pathname bhejo.
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // FIX: role mismatch pe "/" bhejo, lekin user ko uske apne dashboard pe
  // bhejna zyada sahi hai — warna admin ko /client kholne pe home pe fenkta hai.
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const home =
      user?.role === "admin"
        ? "/admin/dashboard"
        : user?.role === "owner"
        ? "/owner/dashboard"
        : "/client/dashboard";
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;