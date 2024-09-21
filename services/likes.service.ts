import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Likes } from "../models/likes";

export class LikesService {
  private likeCollection = "likes";

  // Get the likes for a user (single document per user)
  public async getLikes(userId: string): Promise<Likes[] | null> {
    const likeQuery = query(
      collection(db, this.likeCollection),
      where("userId", "==", userId)
    );
    const likeDocs = await getDocs(likeQuery);

    if (likeDocs.empty) {
      return null;
    }

    const likeDoc = likeDocs.docs.map((doc) => {
      const like = doc.data();
      like.lastUpdated = like.lastUpdated.toDate();
      return like;
    }) as Likes[];

    return likeDoc;
  }

  // Add a like to the user's likes collection
  public async addLike(userId: string, postId: string): Promise<boolean> {
    try {
      await addDoc(collection(db, this.likeCollection), {
        userId,
        postId,
        lastUpdated: serverTimestamp(),
      });
    } catch (error: unknown) {
      throw error;
    }

    return true;
  }

  public async removeLike(userId: string, postId: string): Promise<boolean> {
    // delete the like document and wrap it in a try catch
    try {
      const likeQuery = query(
        collection(db, this.likeCollection),
        where("userId", "==", userId),
        where("postId", "==", postId)
      );
      const likeDocs = await getDocs(likeQuery);
      if (likeDocs.empty) {
        return false;
      }

      const likeDoc = likeDocs.docs[0];
      await deleteDoc(likeDoc.ref);

      return true;
    } catch (error: unknown) {
      throw error;
    }
  }
}
