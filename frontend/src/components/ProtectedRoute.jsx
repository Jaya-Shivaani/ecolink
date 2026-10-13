import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBFA]">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Loading your space...</p>
        </div>
      </div>
    );
  }

  // If there's no token or user is explicitly null after loading, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has at least one of the required roles
  const hasAccess =
    !allowedRoles ||
    allowedRoles.some((role) => {
      if (role === 'buyer' && (!user.roles || user.roles.buyer !== false)) {
        return true;
      }
      return user.roles && user.roles[role];
    });

  if (!hasAccess) {
    const fallback = user.roles?.seller
      ? '/seller'
      : user.roles?.buyer
      ? '/buyer'
      : '/';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
