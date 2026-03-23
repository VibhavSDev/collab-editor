import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
        const res = await api.post('/auth/login', { email, password });
        console.log(res.data);
        login(res.data);
        navigate('/dashboard');
        } catch (err) {
        alert("Invalid credentials");
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg w-96">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <input 
            type="email" placeholder="Email" 
            className="w-full p-2 mb-4 border rounded"
            onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
            type="password" placeholder="Password" 
            className="w-full p-2 mb-6 border rounded"
            onChange={(e) => setPassword(e.target.value)} 
            />
            <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Sign In
            </button>
        </form>
        </div>
    );
};

export default Login;