import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-area">
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">🏠 Admin</div>
          <nav>
            <NavLink to="/admin" end>
              Dashboard
            </NavLink>
            <NavLink to="/admin/moderation">Moderation</NavLink>
            <NavLink to="/admin/users">Users</NavLink>
            <NavLink to="/admin/settings">Settings</NavLink>
          </nav>
          <div className="sidebar-foot">
            <Link to="/" className="view-site">
              ← View public site
            </Link>
            <div className="who">
              <strong>{user?.fullName || user?.mobile}</strong>
              <span className="role">{user?.role}</span>
            </div>
            <button className="btn btn-ghost block" onClick={doLogout}>
              Logout
            </button>
          </div>
        </aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
