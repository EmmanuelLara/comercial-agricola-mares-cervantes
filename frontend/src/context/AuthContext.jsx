import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Limpiar sesiones antiguas persistentes para siempre pedir login al iniciar
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    const savedUser = sessionStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user: userData, token } = response.data;
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      if (token) {
        sessionStorage.setItem('token', token);
        localStorage.setItem('token', token);
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message 
        || (error.response?.status === 401 ? 'Usuario o contraseña incorrectos' : null)
        || (error.message === 'Network Error' ? 'No se pudo conectar con el servidor backend' : 'Error al iniciar sesión');
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
      setUser(null);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
