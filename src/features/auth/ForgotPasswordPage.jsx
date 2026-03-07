import { Link } from 'react-router-dom';
import './Auth.css';

export const ForgotPasswordPage = () => {
    return (
        <div className="auth-container">
            <div className="auth-bg-pattern" aria-hidden="true" />
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="/app-icon.svg" alt="" width="56" height="56" />
                    </div>
                    <h1>Restablecer contraseña</h1>
                    <p className="auth-tagline">Esta función estará disponible pronto.</p>
                </div>
                <p className="auth-tagline" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    Mientras tanto, contacta con el administrador si has olvidado tu contraseña.
                </p>
                <div className="auth-footer">
                    <Link to="/login" className="auth-link">
                        ← Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};
