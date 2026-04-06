import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    login: (data: any) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Attempt to refresh on initial load to see if user is already logged in
        const initAuth = async () => {
        try {
            const res = await api.get('/auth/refresh');
            sessionStorage.setItem('token', res.data.accessToken);
            console.log(res);
            // Fetch user profile or decode token here
            setUser({ id: 'anonymous', name: 'Anonymous', email: 'anonymous@example.com' }); 
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
        };
        initAuth();
    }, []);

    const login = (data: any) => {
        sessionStorage.setItem('token', data.accessToken);
        setUser(data.user);
    };

    const logout = async () => {
        await api.post('/auth/logout');
        sessionStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext)!;