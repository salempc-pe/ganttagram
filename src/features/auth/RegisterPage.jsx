import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import './Auth.css';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, user } = useAuth();

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
