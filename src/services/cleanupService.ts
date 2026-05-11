import { collection, query, where, getDocs, writeBatch, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Clean up expired contacts from the database.
 * This runs client-side but safely because security rules only allow
 * deleting documents where expiresAt < request.time.
 */
export async function cleanupExpiredContacts() {
  try {
    const now = Timestamp.now();
    const usersRef = collection(db, 'users');
    
    // We limit to avoid hitting quota/memory issues in one go
    // Passive cleanup will eventually get them all
    const q = query(
      usersRef, 
      where('expiresAt', '<', now),
      limit(50) 
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }
    
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`[Protocol Cleanup] Purged ${snapshot.size} expired records.`);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error("[Protocol Cleanup] Failed to purge expired records:", error);
    return { success: false, error };
  }
}
