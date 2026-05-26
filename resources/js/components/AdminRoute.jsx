import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ permission, role, superadmin = false }) {
  const { user, loading, hasPermission, hasRole, isSuperAdmin } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (superadmin && !isSuperAdmin()) return <Navigate to="/dashboard" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  if (role && !hasRole(role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
