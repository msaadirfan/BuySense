// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';
import api from '../api.js';
import { REFRESH_TOKEN, ACCESS_TOKEN } from '../constants.js';

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const token = localStorage.getItem(ACCESS_TOKEN);

                // No token → not authorized
                if (!token) {
                    if (isMounted) setIsAuthorized(false);
                    return;
                }

                const decoded = jwtDecode(token);
                const expiry = decoded.exp;
                const now = Date.now() / 1000;

                // Token expired → try refresh
                if (now > expiry) {
                    const refresh = localStorage.getItem(REFRESH_TOKEN);

                    if (!refresh) {
                        if (isMounted) setIsAuthorized(false);
                        return;
                    }

                    try {
                        const res = await api.post('/buysense/token/refresh/', { refresh });

                        if (res.status === 200) {
                            localStorage.setItem(ACCESS_TOKEN, res.data.access);
                            if (isMounted) setIsAuthorized(true);
                        } else {
                            if (isMounted) setIsAuthorized(false);
                        }
                    } catch {
                        if (isMounted) setIsAuthorized(false);
                    }
                } else {
                    // Token still valid
                    if (isMounted) setIsAuthorized(true);
                }
            } catch {
                if (isMounted) setIsAuthorized(false);
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    // Still checking
    if (isAuthorized === null) {
        return null; // or a spinner
    }

    // Authorized → render children
    // Not authorized → redirect
    return isAuthorized ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;