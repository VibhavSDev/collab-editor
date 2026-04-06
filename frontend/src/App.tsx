import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" />} 
      />

      <Route
        path="/editor/:id"
        element={<Editor />}
      />

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;