import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/me')
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const register = async (name, email, password) => {
    await api.post('/register', { name, email, password });
    return login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refresh = async () => {
    const res = await api.get('/me');
    setUser(res.data.data);
    return res.data.data;
  };

  const isSuperAdmin = () => !!user && user.roles?.includes('superadmin');

  const hasRole = (...roles) => {
    if (!user) return false;
    if (isSuperAdmin()) return true;
    const list = roles.flat();
    return list.some((r) => user.roles?.includes(r));
  };

  const hasPermission = (...permissions) => {
    if (!user) return false;
    if (isSuperAdmin()) return true;
    const list = permissions.flat();
    return list.some((p) => user.permissions?.includes(p));
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refresh,
      isSuperAdmin, hasRole, hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
