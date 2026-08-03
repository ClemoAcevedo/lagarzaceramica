import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminGuard() {
  const { configured, isAdmin, loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="admin-gate" aria-busy="true"><p>Comprobando acceso…</p></main>;
  }

  if (!configured || !session || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

