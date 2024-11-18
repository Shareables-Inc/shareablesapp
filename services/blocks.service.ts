import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

export class BlocksService {
  private blocksCollection = collection(db, "userBlocks");

  // Block a user
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    const blockId = `${blockerId}_${blockedId}`;
    const blockDocRef = doc(this.blocksCollection, blockId);

    await setDoc(blockDocRef, {
      blockerId,
      blockedId,
      createdAt: serverTimestamp(),
    });
  }

  // Unblock a user
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const blockId = `${blockerId}_${blockedId}`;
    const blockDocRef = doc(this.blocksCollection, blockId);

    await deleteDoc(blockDocRef);
  }

  // Check if a user is blocked
  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blockId = `${blockerId}_${blockedId}`;
    const blockDocRef = doc(this.blocksCollection, blockId);
    const blockDocSnapshot = await getDoc(blockDocRef);
    return blockDocSnapshot.exists();
  }

  // Get all users blocked by a specific user
  async getBlockedUsers(blockerId: string): Promise<string[]> {
    const blocksQuery = query(
      this.blocksCollection,
      where("blockerId", "==", blockerId)
    );
    const blocksSnapshot = await getDocs(blocksQuery);

    return blocksSnapshot.docs.map((doc) => doc.data().blockedId);
  }

  // Get all users who have blocked a specific user
  async getBlockersOfUser(blockedId: string): Promise<string[]> {
    const blocksQuery = query(
      this.blocksCollection,
      where("blockedId", "==", blockedId)
    );
    const blocksSnapshot = await getDocs(blocksQuery);

    return blocksSnapshot.docs.map((doc) => doc.data().blockerId);
  }
}
