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
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (typeof window.umami !== 'undefined') {
      // Track page view
      window.umami.track(props => ({ ...props, url: location.pathname + location.search }));
      // Track navigation event
      const pageName = location.pathname === '/' ? 'home' : location.pathname.slice(1).split('/')[0];
      window.umami.track('page-' + pageName, { path: location.pathname });
    }
  }, [location]);

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
