import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import IncidentList from './components/IncidentList';
import IncidentForm from './components/IncidentForm';
import IncidentView from './components/IncidentView';
import Dashboard from './components/Dashboard';
import UnverifiedList from './components/UnverifiedList';
import About from './components/About';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<IncidentList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/unverified" element={<UnverifiedList />} />
          <Route path="/create" element={<IncidentForm />} />
          <Route path="/view/:uuid" element={<IncidentView />} />
          <Route path="/edit/:uuid" element={<IncidentForm />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
