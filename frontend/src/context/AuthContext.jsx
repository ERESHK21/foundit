import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('foundit_user') || 'null');
    } catch {
      return null;
    }
  });

  function persist(data) {
    const profile = { id: data.id, name: data.name, email: data.email, role: data.role };
    localStorage.setItem('foundit_token', data.token);
    localStorage.setItem('foundit_user', JSON.stringify(profile));
    setUser(profile);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data);
    return data;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    persist(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('foundit_token');
    localStorage.removeItem('foundit_user');
    setUser(null);
  }

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('foundit:logout', handler);
    return () => window.removeEventListener('foundit:logout', handler);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      isStaff: user?.role === 'STAFF' || user?.role === 'ADMIN',
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
