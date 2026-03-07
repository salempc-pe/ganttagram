import { createContext, useContext, useState, useEffect } from 'react';
import { LoadingScreen } from '../../shared/components/LoadingScreen';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
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
    const [authError, setAuthError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Timeout de seguridad: si después de 12 segundos Firebase no responde, dejamos de cargar
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn("Auth timeout: Firebase tardó demasiado en responder.");
                setLoading(false);
                setAuthError("Tiempo de espera agotado. Revisa tu conexión.");

                if (typeof window.showError === 'function') {
                    window.showError("Timeout de Autenticación", "Firebase no responde. Revisa tu conexión a internet o la configuración del proyecto.");
                }
            }
        }, 12000);

        // Comprobar si volvemos de una redirección de Google
        const checkRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result && result.user) {
                    // Login exitoso, se limpia la bandera
                    sessionStorage.removeItem('isAuthRedirecting');
                } else if (!result && sessionStorage.getItem('isAuthRedirecting')) {
                    // Si regresamos pero no hay resultado, probablemente el navegador bloqueó las cookies (ITP en iOS/iPadOS)
                    sessionStorage.removeItem('isAuthRedirecting');
                    console.warn("Auth Redirect falló silenciosamente (probablemente por 'Anti-Tracking' o cookies de terceros).");
                    if (typeof window.showError === 'function') {
                        window.showError(
                            "Inicio de sesión bloqueado",
                            "El navegador ha bloqueado la sesión por seguridad. Si usas iPad/iPhone, por favor ve a Configuración > Safari y desactiva 'Prevenir rastreo entre sitios'. También asegúrate de no estar en Modo Incógnito."
                        );
                    }
                }
            } catch (error) {
                console.error("Error capturado de Auth Redirect:", error);
                sessionStorage.removeItem('isAuthRedirecting');
                if (typeof window.showError === 'function') {
                    window.showError("Error de Autenticación", "No se pudo iniciar sesión con Google: " + error.message);
                }
            }
        };
        checkRedirect();

        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            try {
                if (authUser) {
                    const userRef = doc(db, 'users', authUser.uid);
                    let userDoc = await getDoc(userRef);
                    let userData = userDoc.data();

                    // Si es totalmente nuevo...
                    if (!userDoc.exists()) {
                        userData = {
                            email: authUser.email,
                            displayName: authUser.displayName || '',
                            createdAt: new Date(),
                        };
                        try {
                            await setDoc(userRef, userData);
                        } catch (e) {
                            console.warn("Auth: No se pudo crear el doc del usuario en Firestore", e);
                        }
                    }

                    setUser({
                        uid: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName || userData?.displayName || '',
                        ...userData
                    });
                } else {
                    setUser(null);
                }
                setAuthError(null);
            } catch (err) {
                console.error("Auth hydration error:", err);
                setUser(null);
                setAuthError("Error de sincronización con la base de datos.");
            } finally {
                clearTimeout(timeout);
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

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            // Ya no forzamos redirect por defecto en tablets/móviles porque en tablets 
            // como el iPad, si falla por ITP o Strict Cookies, se crea un bucle infinito de recargas.
            // En su lugar, preferimos SIEMPRE el Popup. Safari permite Popups si los gatilla 
            // explícitamente el usuario (el botón de Login).

            await signInWithPopup(auth, provider);
            return { success: true };

        } catch (error) {
            console.error("Google Login error:", error);

            // Si el error es estrictamente que se bloqueó el popup o se cerró sin terminar, probamos Redirect
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
                try {
                    const provider = new GoogleAuthProvider();
                    // Colocamos bandera para detectar si la redirección falla silenciosamente a la vuelta
                    sessionStorage.setItem('isAuthRedirecting', 'true');
                    await signInWithRedirect(auth, provider);
                    return { success: true, redirecting: true };
                } catch (fallbackError) {
                    sessionStorage.removeItem('isAuthRedirecting');
                    return { success: false, error: fallbackError.message };
                }
            }

            // Si el error es sobre cookies de terceros (ITP en Firefox/Safari)
            if (error.code === 'auth/web-storage-unsupported') {
                return { success: false, error: "Tu navegador bloquea el almacenamiento necesario. Desactiva 'Prevenir rastreo entre sitios' o el 'Modo estricto' de tu navegador e intenta de nuevo." };
            }

            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        loading,
        authError,
        register,
        login,
        loginWithGoogle,
        logout,
        updateUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
};
