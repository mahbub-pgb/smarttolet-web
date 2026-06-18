import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <Link to="/" className="brand">
        🏠 Smart To-Let
      </Link>
      <nav className="nav-links">
        <Link to="/">Browse</Link>
        <Link to="/map">Map</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/create">+ Post Listing</Link>
            <Link to="/my-listings">My Listings</Link>
            {isStaff && (
              <Link to="/admin" className="btn btn-ghost">
                Admin Panel
              </Link>
            )}
            <button className="btn btn-ghost" onClick={doLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/signin">Sign In</Link>
            <Link to="/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
