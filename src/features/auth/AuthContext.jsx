import { createContext, useContext, useState, useEffect } from 'react';
import { LoadingScreen } from '../../shared/components/LoadingScreen';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Timeout de seguridad: si después de 8 segundos Firebase no responde, dejamos de cargar
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn("Auth timeout: Firebase tardó demasiado en responder.");
                setLoading(false);
                // Si hay un error detectable por window.onerror, lo disparamos
                if (typeof window.showError === 'function') {
                    window.showError("Timeout de Autenticación", "Firebase no responde. Revisa tu conexión a internet o la configuración del proyecto.");
                }
            }
        }, 8000);

        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            clearTimeout(timeout);
            try {
                if (authUser) {
                    const userDoc = await getDoc(doc(db, 'users', authUser.uid));
                    setUser({
                        uid: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName || userDoc.data()?.displayName || '',
                        ...userDoc.data()
                    });
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Auth hydration error:", err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const register = async (email, password, displayName) => {
        try {
            const { user: authUser } = await createUserWithEmailAndPassword(auth, email, password);

            // Actualizar perfil con displayName
            await updateProfile(authUser, { displayName });

            const newUser = {
                email: authUser.email,
                displayName: displayName,
                createdAt: new Date(),
            };

            // Crear documento de usuario en Firestore
            await setDoc(doc(db, 'users', authUser.uid), newUser);

            // ACTUALIZACIÓN OPTIMISTA: Settear usuario inmediatamente
            setUser({
                uid: authUser.uid,
                ...newUser
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const login = async (email, password) => {
        try {
            const { user: authUser } = await signInWithEmailAndPassword(auth, email, password);

            // ACTUALIZACIÓN OPTIMISTA: Settear usuario inmediatamente
            setUser({
                uid: authUser.uid,
                email: authUser.email,
                displayName: authUser.displayName,
            });

            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = "Error al iniciar sesión";

            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = "Email o contraseña incorrectos.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Formato de email inválido.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
            } else {
                errorMessage = error.message;
            }

            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const updateUserProfile = async (updates) => {
        try {
            if (updates.displayName) {
                await updateProfile(auth.currentUser, { displayName: updates.displayName });
            }

            await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

            setUser(prev => ({ ...prev, ...updates }));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };
    const value = {
        user,
        loading,
        register,
        login,
        logout,
        updateUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
};
