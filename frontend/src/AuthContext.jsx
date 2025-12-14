import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (username, password) => {
    const userData = await apiLogin(username, password);
    setUser(userData);
  };
  
  const logout = () => {
    apiLogout();
    setUser(null);
  };
  
  const isAdmin = user?.is_staff || user?.is_superuser;
  
  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

