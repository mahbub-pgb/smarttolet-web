import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';

// Guards the /admin/* area: must be signed in AND staff. Non-staff users are
// sent to the public site; signed-out users to sign-in.
export default function AdminRoute({ children }) {
  const { user, isStaff, loading } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}
