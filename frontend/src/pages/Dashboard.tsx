import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Document {
    id: string;
    title: string;
    updatedAt: string;
}

const Dashboard = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // 1. Fetch user's documents on load
    useEffect(() => {
        const fetchDocs = async () => {
        try {
            const res = await api.get('/documents');
            setDocuments(res.data);
        } catch (err) {
            console.error("Failed to fetch documents", err);
        } finally {
            setLoading(false);
        }
        };
        fetchDocs();
    }, []);

    // 2. Handle creating a new document
    const handleCreateDoc = async () => {
        try {
        const res = await api.post('/documents', { title: "Untitled Document" });
        const newDoc = res.data;
        // Redirect straight to the editor for the new doc
        navigate(`/editor/${newDoc.id}`);
        } catch (err) {
        alert("Error creating document");
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">CollabEditor</h1>
            <div className="flex items-center gap-4">
            <span className="text-gray-600">Hi, {user?.name}</span>
            <button 
                onClick={logout}
                className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100"
            >
                Logout
            </button>
            </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">My Documents</h2>
            <button 
                onClick={handleCreateDoc}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
                + New Document
            </button>
            </div>

            {/* Document Grid */}
            {documents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No documents yet. Create your first one!</p>
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {documents.map((doc) => (
                <div 
                    key={doc.id}
                    onClick={() => navigate(`/editor/${doc.id}`)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition"
                >
                    <div className="h-32 bg-gray-50 rounded-md mb-4 flex items-center justify-center">
                    <span className="text-4xl text-gray-300 text-center">📄</span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                    <p className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                </div>
                ))}
            </div>
            )}
        </main>
        </div>
    );
};

export default Dashboard;