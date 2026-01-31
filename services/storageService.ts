
import { ChatSession } from '../types.ts';

const DB_NAME = 'UltrawanDB';
const STORE_HANDLES = 'Handles';
const STORE_SESSIONS = 'Sessions';
const STORE_MEMORY = 'Memory';

export class StorageService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2); // Version 2 to add session/memory stores
      request.onupgradeneeded = (e: any) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_HANDLES)) db.createObjectStore(STORE_HANDLES);
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) db.createObjectStore(STORE_SESSIONS);
        if (!db.objectStoreNames.contains(STORE_MEMORY)) db.createObjectStore(STORE_MEMORY);
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_HANDLES, 'readonly');
      const store = tx.objectStore(STORE_HANDLES);
      const request = store.get('root');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async setDirectory(handle: FileSystemDirectoryHandle) {
    this.directoryHandle = handle;
    const db = await this.getDB();
    const tx = db.transaction(STORE_HANDLES, 'readwrite');
    tx.objectStore(STORE_HANDLES).put(handle, 'root');
  }

  async verifyPermission(): Promise<boolean> {
    try {
      const handle = await this.getStoredHandle();
      if (!handle) return false;
      this.directoryHandle = handle;
      
      // @ts-ignore
      const query = await (handle as any).queryPermission({ mode: 'readwrite' });
      if (query === 'granted') return true;
      
      // @ts-ignore
      const request = await (handle as any).requestPermission({ mode: 'readwrite' });
      return request === 'granted';
    } catch (e) {
      console.warn("Folder access restricted. Falling back to Browser Storage.");
      return false;
    }
  }

  async saveFile(path: string, fileName: string, content: string) {
    if (this.directoryHandle) {
      try {
        const dirHandle = await this.directoryHandle.getDirectoryHandle(path, { create: true });
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch (e) {
        console.error(`Physical storage failed for ${fileName}, falling back to Browser Storage`, e);
      }
    }

    // Fallback: Use IndexedDB
    const db = await this.getDB();
    const storeName = path === 'sessions' ? STORE_SESSIONS : STORE_MEMORY;
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(content, fileName);
  }

  async loadAllSessions(): Promise<ChatSession[]> {
    const sessions: ChatSession[] = [];

    if (this.directoryHandle) {
      try {
        const dirHandle = await this.directoryHandle.getDirectoryHandle('sessions', { create: true });
        // @ts-ignore
        for await (const entry of dirHandle.values()) {
          const handle = entry as any;
          if (handle.kind === 'file' && handle.name.endsWith('.json')) {
            const file = await handle.getFile();
            const text = await file.text();
            sessions.push(JSON.parse(text));
          }
        }
        if (sessions.length > 0) return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
      } catch (e) {
        console.warn("Physical session load failed, checking Browser Storage.");
      }
    }

    // Fallback/Union: Load from IndexedDB
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.getAll();
      request.onsuccess = () => {
        const dbSessions = request.result.map(s => typeof s === 'string' ? JSON.parse(s) : s);
        const all = [...sessions, ...dbSessions];
        // Deduplicate by ID
        const unique = Array.from(new Map(all.map(s => [s.id, s])).values());
        resolve(unique.sort((a, b) => b.lastUpdated - a.lastUpdated));
      };
    });
  }

  async deleteSession(sessionId: string) {
    if (this.directoryHandle) {
      try {
        const dirHandle = await this.directoryHandle.getDirectoryHandle('sessions', { create: true });
        await dirHandle.removeEntry(`${sessionId}.json`);
      } catch (e) {}
    }
    const db = await this.getDB();
    const tx = db.transaction(STORE_SESSIONS, 'readwrite');
    tx.objectStore(STORE_SESSIONS).delete(`${sessionId}.json`);
  }

  async listMemoryFiles(): Promise<string[]> {
    const files: string[] = [];
    if (this.directoryHandle) {
      try {
        const dirHandle = await this.directoryHandle.getDirectoryHandle('memory', { create: true });
        // @ts-ignore
        for await (const entry of dirHandle.values()) {
          const handle = entry as any;
          if (handle.kind === 'file') files.push(handle.name.replace('.md', ''));
        }
      } catch {}
    }
    
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MEMORY, 'readonly');
      const store = tx.objectStore(STORE_MEMORY);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const dbFiles = request.result.map(k => k.toString().replace('.md', ''));
        resolve(Array.from(new Set([...files, ...dbFiles])));
      };
    });
  }

  async syncSession(session: ChatSession) {
    await this.saveFile('sessions', `${session.id}.json`, JSON.stringify(session, null, 2));
  }
}

export const storage = new StorageService();
