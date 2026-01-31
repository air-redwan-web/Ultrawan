
import { ChatSession } from '../types.ts';

const DB_NAME = 'UltrawanDB';
const STORE_NAME = 'Handles';

export class StorageService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  async getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => {
          const store = request.result.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
          const getRequest = store.get('root');
          getRequest.onsuccess = () => resolve(getRequest.result || null);
          getRequest.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async setDirectory(handle: FileSystemDirectoryHandle) {
    this.directoryHandle = handle;
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, 'root');
    };
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
      console.error("Permission verification failed", e);
      return false;
    }
  }

  async saveFile(path: string, fileName: string, content: string) {
    if (!this.directoryHandle) return;
    try {
      const dirHandle = await this.directoryHandle.getDirectoryHandle(path, { create: true });
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (e) {
      console.error(`Failed to save file: ${fileName}`, e);
    }
  }

  async loadAllSessions(): Promise<ChatSession[]> {
    if (!this.directoryHandle) return [];
    try {
      const sessions: ChatSession[] = [];
      const dirHandle = await this.directoryHandle.getDirectoryHandle('sessions', { create: true });
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        const handle = entry as any;
        if (handle.kind === 'file' && handle.name.endsWith('.json')) {
          try {
            const file = await handle.getFile();
            const text = await file.text();
            sessions.push(JSON.parse(text));
          } catch (e) {
            console.warn("Skipping malformed session file:", handle.name);
          }
        }
      }
      return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
    } catch (e) {
      console.error("Failed to load sessions", e);
      return [];
    }
  }

  async deleteSession(sessionId: string) {
    if (!this.directoryHandle) return;
    try {
      const dirHandle = await this.directoryHandle.getDirectoryHandle('sessions', { create: true });
      await dirHandle.removeEntry(`${sessionId}.json`);
    } catch (e) {
      console.error(`Failed to delete session: ${sessionId}`, e);
    }
  }

  async listMemoryFiles(): Promise<string[]> {
    if (!this.directoryHandle) return [];
    try {
      const dirHandle = await this.directoryHandle.getDirectoryHandle('memory', { create: true });
      const files: string[] = [];
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        const handle = entry as any;
        if (handle.kind === 'file') files.push(handle.name.replace('.md', ''));
      }
      return files;
    } catch {
      return [];
    }
  }

  async syncSession(session: ChatSession) {
    await this.saveFile('sessions', `${session.id}.json`, JSON.stringify(session, null, 2));
  }
}

export const storage = new StorageService();
