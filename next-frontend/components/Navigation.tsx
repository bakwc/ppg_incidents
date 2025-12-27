'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth';

export default function Navigation() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/incidents') {
      return pathname === '/incidents' || pathname?.startsWith('/view') || pathname?.startsWith('/edit') || pathname?.startsWith('/unverified');
    }
    if (path === '/') {
      return pathname === '/';
    }
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname?.startsWith('/dashboard');
    }
    return pathname?.startsWith(path);
  };
  
  return (
    <nav className="bg-slate-900 border-b border-slate-800 lg:sticky lg:top-0 lg:z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 min-h-16">
          <div className="flex items-center gap-3 sm:gap-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent hover:from-orange-300 hover:to-amber-300 transition-all whitespace-nowrap">
              PPG Incidents
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/')
                    ? 'bg-slate-800 text-amber-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                Home
              </Link>
              <Link
                href="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/dashboard')
                    ? 'bg-slate-800 text-amber-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                Dashboards
              </Link>
              <Link
                href="/incidents" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive('/incidents')
                    ? 'bg-slate-800 text-amber-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                Incidents
              </Link>
              <Link
                href="/about" 
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
              href="/unverified"
              className="px-4 py-2 bg-slate-800/70 hover:bg-slate-700 border border-amber-500/50 rounded-lg font-medium text-amber-400 transition-all text-sm whitespace-nowrap"
              data-umami-event="nav-unverified"
            >
              📝 Unverified
            </Link>
            <Link
              href="/create"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5 text-sm whitespace-nowrap"
              data-umami-event="nav-report-incident"
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
                  data-umami-event="logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all text-sm whitespace-nowrap"
                data-umami-event="nav-login"
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

