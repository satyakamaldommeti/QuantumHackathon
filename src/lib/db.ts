import app from './firebase';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const db = getFirestore(app);
const storage = getStorage(app);

/**
 * Save a chat message to Firestore under `chats/{userId}/messages`.
 * message: { role: 'user'|'assistant', content: string }
 */
export async function saveChatMessage(userId: string, message: { role: string; content: string }) {
  if (!userId) throw new Error('userId is required');
  const col = collection(db, 'chats', userId, 'messages');
  const docRef = await addDoc(col, {
    ...message,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get chat history for a user (most recent first).
 */
export async function getChatHistory(userId: string, limitCount = 100) {
  if (!userId) return [];
  const col = collection(db, 'chats', userId, 'messages');
  const q = query(col, orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  const items: any[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return items.reverse(); // oldest first
}

/**
 * Upload a document file to Firebase Storage and save metadata in `documents/{userId}`.
 * Returns metadata including downloadUrl and documentId.
 */
export async function uploadDocument(userId: string, file: File, metadata: { title?: string; description?: string } = {}) {
  if (!userId) throw new Error('userId is required');
  const path = `documents/${userId}/${Date.now()}_${file.name}`;
  const ref = storageRef(storage, path);

  const uploadTask = uploadBytesResumable(ref, file);

  await new Promise<void>((resolve, reject) => {
    uploadTask.on('state_changed', null, (err) => reject(err), () => resolve());
  });

  const downloadUrl = await getDownloadURL(ref);

  const col = collection(db, 'documents', userId, 'items');
  const docRef = await addDoc(col, {
    title: metadata.title || file.name,
    description: metadata.description || '',
    fileName: file.name,
    storagePath: path,
    downloadUrl,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, downloadUrl, storagePath: path };
}

/**
 * Save or update user profile under `profiles/{userId}`.
 */
export async function saveProfile(userId: string, profileData: Record<string, any>) {
  if (!userId) throw new Error('userId is required');
  const ref = doc(db, 'profiles', userId);
  await setDoc(ref, {
    ...profileData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export default db;
