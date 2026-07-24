import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../services/api";
import { authService } from "../services/authService";

const TOKEN_KEY = "precision_engine_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const interceptorAdded = useRef(false);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);
  const setToken = useCallback((token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  useEffect(() => {
    if (interceptorAdded.current) return;
    interceptorAdded.current = true;

    api.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }, [getToken]);

  const restoreSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const user = await authService.me();
      setCurrentUser(user);
    } catch {
      setToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [getToken, setToken]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signup = useCallback(async (data) => {
    const result = await authService.signup(data);
    return result;
  }, []);

  const login = useCallback(async (data) => {
    const result = await authService.login(data);
    setToken(result.access_token);
    setCurrentUser(result.user);
    return result;
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
  }, [setToken]);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
