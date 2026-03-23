import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/dashboard"
        element={user ? <div>Welcome to your Dashboard!</div> : <Navigate to="/login" />} 
      />

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;