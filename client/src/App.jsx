import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import Home from './pages/Home';
import ListingsMap from './pages/ListingsMap';
import ListingDetail from './pages/ListingDetail';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';
import Dashboard from './pages/admin/Dashboard';
import Moderation from './pages/admin/Moderation';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          {/* ---- Public / front-end ---- */}
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<ListingsMap />} />
          <Route path="/listings/:slug" element={<ListingDetail />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/:id/edit"
            element={
              <ProtectedRoute>
                <EditListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            }
          />

          {/* ---- Admin (staff only) ---- */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <AdminRoute>
                <Moderation />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            }
          />

          <Route path="*" element={<div className="container">Page not found.</div>} />
        </Routes>
      </main>
    </>
  );
}
