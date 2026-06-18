import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

export default function ProtectedRoute({ children }) {
  const { isStaff, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading…</div>;
  if (!isStaff) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}
