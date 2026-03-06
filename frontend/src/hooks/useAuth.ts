import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    try {
      const response = await api.get<User>('/auth/me');
      setState({ user: response.data, loading: false, error: null });
    } catch {
      localStorage.removeItem('auth_token');
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { access_token, user } = response.data;
      localStorage.setItem('auth_token', access_token);
      setState({ user, loading: false, error: null });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { access_token, user } = response.data;
      localStorage.setItem('auth_token', access_token);
      setState({ user, loading: false, error: null });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!state.user,
  };
}
