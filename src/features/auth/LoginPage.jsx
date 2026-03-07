import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import './Auth.css';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loginWithGoogle, user } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Si el usuario ya está autenticado, redirigir al dashboard
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.email) newErrors.email = 'El email es requerido';
        if (!formData.password) newErrors.password = 'La contraseña es requerida';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        const result = await login(formData.email, formData.password);

        if (!result.success) {
            setLoading(false);
            setErrors({ general: result.error || 'Credenciales inválidas.' });
        }
    };

    const handleRememberChange = (e) => {
        setFormData(prev => ({ ...prev, rememberMe: e.target.checked }));
    };

    return (
        <div className="auth-container">
            <div className="auth-bg-pattern" aria-hidden="true" />
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="/app-icon.svg" alt="" width="56" height="56" />
                    </div>
                    <h1>GANTTAGRAM</h1>
                    <p className="auth-tagline">Gestión de proyectos simplificada</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="tu@email.com"
                        autoComplete="email"
                        required
                    />

                    <div className="input-wrapper auth-password-wrapper">
                        <label className="input-label">Contraseña</label>
                        <div className="auth-password-inner">
                            <input
                                className={`input ${errors.password ? 'input-error' : ''}`}
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && <span className="input-error-message">{errors.password}</span>}
                    </div>

                    <div className="auth-options">
                        <label className="auth-checkbox">
                            <input
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={handleRememberChange}
                            />
                            <span>Recordarme</span>
                        </label>
                        <Link to="/forgot-password" className="auth-forgot">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    {errors.general && (
                        <div className="error-message" role="alert">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {errors.general}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="auth-submit"
                    >
                        Iniciar sesión
                    </Button>

                    <div className="auth-divider">
                        <span>o continúa con</span>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="google-btn"
                        onClick={async () => {
                            setLoading(true);
                            const result = await loginWithGoogle();
                            if (!result.success) {
                                setLoading(false);
                                setErrors({ general: result.error ? `Error Google: ${result.error}` : 'Error al iniciar sesión con Google.' });
                            }
                        }}
                        disabled={loading}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Google</span>
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="auth-link">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
