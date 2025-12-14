import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navigation from './components/Navigation';
import IncidentList from './components/IncidentList';
import IncidentForm from './components/IncidentForm';
import IncidentView from './components/IncidentView';
import Dashboard from './components/Dashboard';
import UnverifiedList from './components/UnverifiedList';
import About from './components/About';
import Login from './components/Login';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboards" element={<Dashboard />} />
            <Route path="/incidents" element={<IncidentList />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unverified" element={<UnverifiedList />} />
            <Route path="/create" element={<IncidentForm />} />
            <Route path="/view/:uuid" element={<IncidentView />} />
            <Route path="/edit/:uuid" element={<IncidentForm />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
