import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser, registerUser, fetchProfile } from './api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: false,
  error: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

const STORAGE_TOKEN_KEY = 'multivasta-auth-token';
const STORAGE_USER_KEY = 'multivasta-auth-user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER_KEY));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || user) {
      return;
    }

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchProfile(token);
        setUser(profile.user || profile);
      } catch (err) {
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token, user]);

  const persistAuth = (userData, authToken) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem(STORAGE_TOKEN_KEY, authToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginUser(credentials);
      persistAuth(result.user, result.token);
      return result.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser(payload);
      persistAuth(result.user, result.token);
      return result.user;
    } catch (err) {
      setError(err.message || 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  const value = useMemo(
    () => ({ user, token, loading, error, login, signup, logout }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
