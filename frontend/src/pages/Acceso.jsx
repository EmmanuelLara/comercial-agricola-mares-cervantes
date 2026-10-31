import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { LogoSymbol } from '../components/Logo';

const Acceso = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
      
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-logo" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
            <LogoSymbol size={68} />
          </div>
          <h1>Comercial Agrícola Mares Cervantes</h1>
          <p>Sistema de Gestión Comercial</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-alert">
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Usuario</label>
            <div className="input-with-icon">
              <User size={20} className="icon" />
              <input 
                type="text" 
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={20} className="icon" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              <>
                Entrar al Sistema <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>&copy; 2024 Comercial Agrícola Mares Cervantes</p>
          <small>Versión v2.1.0-prod</small>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-emerald: #10b981;
          --primary-dark: #064e3b;
          --accent-green: #34d399;
          --bg-dark: #020617;
        }

        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-dark);
          position: relative;
          overflow: hidden;
          padding: 2rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .login-bg-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .shape-1 {
          width: 400px;
          height: 400px;
          background: var(--primary-emerald);
          top: -100px;
          right: -100px;
        }

        .shape-2 {
          width: 300px;
          height: 300px;
          background: #059669;
          bottom: -50px;
          left: -50px;
        }

        .login-card {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 440px;
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          z-index: 10;
          color: white;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--primary-emerald), var(--primary-dark));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: white;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }

        .login-header h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .login-form .form-group {
          margin-bottom: 1.5rem;
        }

        .login-form label {
          display: block;
          margin-bottom: 0.6rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          transition: color 0.3s;
        }

        .input-with-icon input {
          width: 100%;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 1rem 1rem 1rem 3.5rem;
          color: white;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .input-with-icon input:focus {
          outline: none;
          background: rgba(30, 41, 59, 0.8);
          border-color: var(--primary-emerald);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .input-with-icon input:focus + .icon {
          color: var(--primary-emerald);
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          text-align: center;
        }

        .login-submit-btn {
          width: 100%;
          padding: 1.1rem;
          background: linear-gradient(to right, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          margin-top: 1rem;
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(5, 150, 105, 0.3);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 3rem;
          text-align: center;
          color: #64748b;
        }

        .login-footer p {
          font-size: 0.8rem;
          margin-bottom: 0.3rem;
        }

        .login-footer small {
          font-weight: 700;
          color: var(--primary-emerald);
          text-transform: uppercase;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
};

export default Acceso;
