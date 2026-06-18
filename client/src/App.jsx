import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
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
          <Route path="*" element={<div className="container">Page not found.</div>} />
        </Routes>
      </main>
    </>
  );
}
