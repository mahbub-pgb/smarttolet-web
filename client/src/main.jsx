import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import './admin.css';

// NOTE: StrictMode is intentionally omitted. @react-google-maps/api markers /
// info windows disappear under React 18 StrictMode's double mount/unmount in
// development (the map renders but pins vanish).
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
);
