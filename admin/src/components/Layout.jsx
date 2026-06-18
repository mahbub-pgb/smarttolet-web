import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">🏠 Admin</div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/moderation">Moderation</NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="sidebar-foot">
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
  );
}
