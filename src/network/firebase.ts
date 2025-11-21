import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database, ref, set, onValue, off, push, remove, update, serverTimestamp } from 'firebase/database';
import { firebaseConfig } from './firebase-config.js';

let app: FirebaseApp | null = null;
let database: Database | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (app) return app;
  
  try {
    // Check if config is set
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('[FIREBASE] ⚠️ Firebase config not set! Please update firebase-config.ts');
      return null;
    }
    
    app = initializeApp(firebaseConfig);
    console.log('[FIREBASE] ✓ Firebase initialized');
    return app;
  } catch (error) {
    console.error('[FIREBASE] ❌ Error initializing Firebase:', error);
    return null;
  }
}

export async function getFirebaseDatabase(): Promise<Database | null> {
  if (database) return database;
  
  const appInstance = await getFirebaseApp();
  if (!appInstance) return null;
  
  try {
    database = getDatabase(appInstance);
    console.log('[FIREBASE] ✓ Database connection established');
    return database;
  } catch (error) {
    console.error('[FIREBASE] ❌ Error connecting to database:', error);
    return null;
  }
}

// Helper functions for Firebase operations
export const FirebaseHelpers = {
  // Set a value at a path
  async set(path: string, value: any): Promise<boolean> {
    const db = await getFirebaseDatabase();
    if (!db) return false;
    
    try {
      await set(ref(db, path), value);
      return true;
    } catch (error) {
      console.error(`[FIREBASE] Error setting ${path}:`, error);
      return false;
    }
  },
  
  // Update multiple paths at once
  async update(updates: { [path: string]: any }): Promise<boolean> {
    const db = await getFirebaseDatabase();
    if (!db) return false;
    
    try {
      await update(ref(db, '/'), updates);
      return true;
    } catch (error) {
      console.error('[FIREBASE] Error updating:', error);
      return false;
    }
  },
  
  // Push a new item to a list
  async push(path: string, value: any): Promise<string | null> {
    const db = await getFirebaseDatabase();
    if (!db) return null;
    
    try {
      const newRef = push(ref(db, path));
      await set(newRef, value);
      return newRef.key;
    } catch (error) {
      console.error(`[FIREBASE] Error pushing to ${path}:`, error);
      return null;
    }
  },
  
  // Remove a path
  async remove(path: string): Promise<boolean> {
    const db = await getFirebaseDatabase();
    if (!db) return false;
    
    try {
      await remove(ref(db, path));
      return true;
    } catch (error) {
      console.error(`[FIREBASE] Error removing ${path}:`, error);
      return false;
    }
  },
  
  // Listen to changes at a path
  on(path: string, callback: (data: any) => void): () => void {
    getFirebaseDatabase().then(db => {
      if (!db) return;
      
      const dbRef = ref(db, path);
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
      });
    });
    
    // Return unsubscribe function
    return () => {
      getFirebaseDatabase().then(db => {
        if (!db) return;
        off(ref(db, path));
      });
    };
  },
  
  // Listen to child changes (for lists) - returns all children when any changes
  onChildAdded(path: string, callback: (key: string, data: any) => void): () => void {
    let unsubscribe: (() => void) | null = null;
    
    getFirebaseDatabase().then(db => {
      if (!db) return;
      
      const dbRef = ref(db, path);
      unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          Object.keys(data).forEach(key => {
            callback(key, data[key]);
          });
        }
      });
    });
    
    // Return unsubscribe function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      getFirebaseDatabase().then(db => {
        if (!db) return;
        off(ref(db, path));
      });
    };
  },
  
  // Get server timestamp
  getServerTimestamp(): any {
    return serverTimestamp();
  }
};

