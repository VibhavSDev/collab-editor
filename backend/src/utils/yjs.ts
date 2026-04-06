import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { map } from 'lib0';
import * as sync from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';

// Track documents and their associated clients separately for clarity
const docs = new Map<string, Y.Doc>();
const clientSets = new Map<string, Set<any>>();

const messageSync = 0;
const messageAwareness = 1;

export const setupWSConnection = (conn: any, req: any) => {
  conn.binaryType = 'arraybuffer';
  
  // Extract room name from URL (e.g., /collab-room-123 -> collab-room-123)
  const docName = req.url.slice(1).split('?')[0] || 'default';

  // 1. Initialize Document
  const doc = map.setIfUndefined(docs, docName, () => {
    const d = new Y.Doc();
    
    // Broadcast updates to all clients in this room
    d.on('update', (update: Uint8Array, origin: any) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      sync.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);
      
      clientSets.get(docName)?.forEach(client => {
        if (client !== origin && client.readyState === 1) { // 1 = OPEN
          client.send(message);
        }
      });
    });

    return d;
  });

  // 2. Initialize Awareness if it doesn't exist
  if (!(doc as any).awareness) {
    (doc as any).awareness = new awarenessProtocol.Awareness(doc);
    (doc as any).awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate((doc as any).awareness, changedClients));
      const message = encoding.toUint8Array(encoder);

      clientSets.get(docName)?.forEach(client => {
        if (client !== origin && client.readyState === 1) {
          client.send(message);
        }
      });
    });
  }

  // 3. Manage Clients for this room
  const clients = map.setIfUndefined(clientSets, docName, () => new Set());
  clients.add(conn);

  // 4. Handle Incoming Messages
  conn.on('message', (message: ArrayBuffer) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(message));
      const messageType = decoding.readVarUint(decoder);
      
      switch (messageType) {
        case messageSync:
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          sync.readSyncMessage(decoder, encoder, doc, conn);
          if (encoding.length(encoder) > 1) {
            conn.send(encoding.toUint8Array(encoder));
          }
          break;
        case messageAwareness:
          awarenessProtocol.applyAwarenessUpdate((doc as any).awareness, decoding.readVarUint8Array(decoder), conn);
          break;
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  conn.on('close', () => {
    clients.delete(conn);
    if (clients.size === 0) {
      docs.delete(docName);
      clientSets.delete(docName);
    }
  });

  // 5. INITIAL HANDSHAKE
  // Step A: Send Sync Step 1 (This triggers the frontend to respond and finish the sync)
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, messageSync);
  sync.writeSyncStep1(syncEncoder, doc);
  conn.send(encoding.toUint8Array(syncEncoder));

  // Step B: Send Awareness state
  const awarenessStates = (doc as any).awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(awarenessEncoder, awarenessProtocol.encodeAwarenessUpdate((doc as any).awareness, Array.from(awarenessStates.keys())));
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }
};