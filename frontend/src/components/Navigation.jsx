import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navigation() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  
  const isActive = (path) => {
    if (path === '/incidents') {
      return location.pathname === '/incidents' || location.pathname.startsWith('/view') || location.pathname.startsWith('/edit') || location.pathname.startsWith('/unverified');
    }
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <nav className="bg-slate-900 border-b border-slate-800 lg:sticky lg:top-0 lg:z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 min-h-16">
          <div className="flex items-center gap-3 sm:gap-8">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent hover:from-orange-300 hover:to-amber-300 transition-all whitespace-nowrap">
              PPG Incidents
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/')
                    ? 'bg-slate-800 text-amber-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                Dashboards
              </Link>
              <Link 
                to="/incidents" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/incidents')
                    ? 'bg-slate-800 text-amber-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                Incidents
              </Link>
              <Link 
                to="/about" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/about')
                    ? 'bg-slate-800 text-amber-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/unverified"
              className="px-4 py-2 bg-slate-800/70 hover:bg-slate-700 border border-amber-500/50 rounded-lg font-medium text-amber-400 transition-all text-sm whitespace-nowrap"
            >
              📝 Unverified
            </Link>
            <Link
              to="/create"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5 text-sm whitespace-nowrap"
            >
              Report Incident
            </Link>
            {user ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-300 text-sm whitespace-nowrap">
                  {user.username} {isAdmin && <span className="text-amber-400">(admin)</span>}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all text-sm whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all text-sm whitespace-nowrap"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

