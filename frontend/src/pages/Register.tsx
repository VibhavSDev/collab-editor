import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
        const res = await api.post('/auth/register', { email, password, name });
        login(res.data); // Log them in immediately after registering
        navigate('/dashboard');
        } catch (err: any) {
        alert(err.response?.data?.error || "Registration failed");
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg w-96">
            <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
            <input 
            type="text" placeholder="Full Name" required
            className="w-full p-2 mb-4 border rounded"
            onChange={(e) => setName(e.target.value)} 
            />
            <input 
            type="email" placeholder="Email" required
            className="w-full p-2 mb-4 border rounded"
            onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
            type="password" placeholder="Password" required
            className="w-full p-2 mb-6 border rounded"
            onChange={(e) => setPassword(e.target.value)} 
            />
            <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
            Register
            </button>
            <p className="mt-4 text-center text-sm">
            Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
            </p>
        </form>
        </div>
    );
};

export default Register;