import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IncidentList from './components/IncidentList';
import IncidentForm from './components/IncidentForm';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<IncidentList />} />
          <Route path="/create" element={<IncidentForm />} />
          <Route path="/edit/:uuid" element={<IncidentForm />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
