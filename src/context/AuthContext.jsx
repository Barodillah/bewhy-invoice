import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token invalid or expired
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }

  function login(newToken, userData) {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(userData);
  }

  function logout() {
    // Call logout API if we have a token
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
