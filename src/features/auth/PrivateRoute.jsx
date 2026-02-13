import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="loader"></div>
                    <p className="text-secondary mt-4">Cargando...</p>
                </div>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" replace />;
};
