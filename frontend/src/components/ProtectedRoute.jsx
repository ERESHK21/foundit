import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, staffOnly = false }) {
  const { user, isStaff } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (staffOnly && !isStaff) {
    return <Navigate to="/" replace />;
  }
  return children;
}
