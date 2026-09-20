import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  recruiter: Record<string, unknown> | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    recruiter: null,
    loading: true,
  });

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getProfile()
        .then(recruiter => {
          setState({ isAuthenticated: true, recruiter, loading: false });
        })
        .catch(() => {
          api.logout();
          setState({ isAuthenticated: false, recruiter: null, loading: false });
        });
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    setState({ isAuthenticated: true, recruiter: result.recruiter, loading: false });
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await api.register(email, password, name);
    setState({ isAuthenticated: true, recruiter: result.recruiter, loading: false });
  };

  const logout = () => {
    api.logout();
    setState({ isAuthenticated: false, recruiter: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
