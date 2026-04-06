import { useEffect, useState, useRef, Component } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '../context/AuthContext';

const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  const port = import.meta.env.VITE_YJS_WS_PORT || '5000';
  return import.meta.env.VITE_YJS_WS_URL || `${protocol}://${host}:${port}`;
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">⚠️ Error loading editor</p>
            <p className="text-slate-600 text-sm">Retrying connection...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- SUB-COMPONENT ---
const TiptapInstance = ({ ydoc, provider, user }: any) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ 
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: user?.name || 'Anonymous',
          color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        },
      }),
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'p-10 min-h-[600px] focus:outline-none prose max-w-none',
      },
    },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
};

// --- MAIN PAGE ---
const EditorPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;

    // Initialize Y.Doc if not already done
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
      ydocRef.current.getText('shared-text');
    }

    if (cleanupTimerRef.current) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    if (!providerRef.current) {
      const wsUrl = getWsUrl();
      console.log("🔌 Attempting to connect to:", wsUrl);
      
      const provider = new WebsocketProvider(wsUrl, `collab-room-${id}`, ydocRef.current!);

      const checkReady = () => {
        const isAwarenessReady = 
          provider.awareness && 
          typeof provider.awareness.getStates === 'function';
        
        console.log("📡 Sync status: synced =", provider.synced, "awareness ready =", isAwarenessReady);
        
        if (provider.synced && isAwarenessReady) {
          setTimeout(() => {
            setIsReady(true);
            setConnectionError(null);
          }, 200);
        }
      };

      provider.on('status', ({ status }: any) => {
        console.log("📡 WS Status:", status);
        if (status === 'connected') {
          setConnectionError(null);
          checkReady();
        }

        if (status === 'disconnected') {
          setConnectionError('Disconnected from WebSocket server');
        }
      });

      provider.on('sync', checkReady);
      provider.on('awareness', checkReady);

      provider.on('error', ({ error }: any) => {
        console.error("❌ WebSocket error:", error);
        setConnectionError(`Connection error: ${error?.message || 'Unknown error'}`);
      });

      // Force initial check after a delay
      setTimeout(checkReady, 500);

      providerRef.current = provider;
    }

    return () => {
      if (providerRef.current) {
        cleanupTimerRef.current = window.setTimeout(() => {
          providerRef.current?.disconnect();
          providerRef.current = null;
        }, 100);
      }
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-3 flex justify-between items-center text-white text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionError ? 'bg-red-400' : isReady ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
            }`}></div>
            <span>
              {connectionError ? '⚠️ ' : ''}{connectionError ? 'CONNECTION FAILED' : isReady ? 'STABLE' : 'WAITING FOR DATA...'}
            </span>
          </div>
          <span>ROOM: {id?.slice(0, 8)}</span>
        </div>

        {connectionError && (
          <div className="bg-red-50 border-t border-red-200 p-4">
            <p className="text-red-700 text-sm font-medium">❌ {connectionError}</p>
            <p className="text-red-600 text-xs mt-1">
              Make sure the backend WebSocket server is running on {getWsUrl()}
            </p>
          </div>
        )}

        {isReady && providerRef.current ? (
          <ErrorBoundary>
            <TiptapInstance 
              key={id}
              ydoc={ydocRef.current} 
              provider={providerRef.current} 
              user={user} 
            />
          </ErrorBoundary>
        ) : !connectionError ? (
          <div className="flex h-[600px] items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Connecting to server...</p>
            </div>
          </div>
        ) : (
          <div className="flex h-[600px] items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600 font-medium mb-4">Connection Failed</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;