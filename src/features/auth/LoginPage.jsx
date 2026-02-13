import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import './Auth.css';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
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

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>GANTTAGRAM</h1>
                    <p className="text-secondary">Gestión de proyectos simplificada</p>
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
                        required
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        placeholder="••••••••"
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
                        Iniciar Sesión
                    </Button>
                </form>

                <div className="auth-footer">
                    <p className="text-secondary">
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
