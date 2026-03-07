import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import './Auth.css';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, loginWithGoogle, user } = useAuth();

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
        if (!formData.displayName.trim()) {
            newErrors.displayName = 'El nombre es requerido';
        }
        if (!formData.email) newErrors.email = 'El email es requerido';
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        const result = await register(formData.email, formData.password, formData.displayName.trim());

        if (!result.success) {
            setLoading(false);
            setErrors({ general: result.error || 'Error al crear la cuenta' });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>GANTTAGRAM</h1>
                    <p className="text-secondary">Crear cuenta nueva</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="Nombre completo"
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        error={errors.displayName}
                        placeholder="Tu nombre"
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="tu@email.com"
                        required
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        placeholder="Mínimo 6 caracteres"
                        required
                    />

                    <Input
                        label="Confirmar contraseña"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        placeholder="Confirma tu contraseña"
                        required
                    />

                    {errors.general && (
                        <div className="error-message">{errors.general}</div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="auth-submit"
                    >
                        Crear Cuenta
                    </Button>

                    <div className="auth-divider">
                        <span>o continua con</span>
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="font-bold">Google</span>
                    </Button>
                </form>

                <div className="auth-footer">
                    <p className="text-secondary">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="auth-link">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
