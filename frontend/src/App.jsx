import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navigation from './components/Navigation';
import IncidentList from './components/IncidentList';
import IncidentForm from './components/IncidentForm';
import IncidentView from './components/IncidentView';
import Dashboard from './components/dashboards/Dashboard';
import Home from './components/Home';
import UnverifiedList from './components/UnverifiedList';
import About from './components/About';
import Login from './components/Login';
import Footer from './components/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Track page view for Umami
    if (typeof window.umami !== 'undefined') {
      window.umami.track();
    }
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/dashboards" element={<Navigate to="/dashboard/causes-analysis" replace />} />
            <Route path="/incidents" element={<IncidentList />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unverified" element={<UnverifiedList />} />
            <Route path="/create" element={<IncidentForm />} />
            <Route path="/view/:uuid" element={<IncidentView />} />
            <Route path="/edit/:uuid" element={<IncidentForm />} />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
