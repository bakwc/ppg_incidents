import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IncidentList from './components/IncidentList';
import IncidentForm from './components/IncidentForm';
import IncidentView from './components/IncidentView';
import Dashboard from './components/Dashboard';
import UnverifiedList from './components/UnverifiedList';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<IncidentList />} />
          <Route path="/dashboard" element={<Dashboard />} />
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
