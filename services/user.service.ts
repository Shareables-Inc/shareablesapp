// create a service to get the user profile from the database
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  QueryDocumentSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { UserProfile } from "../models/userProfile";

export class UserService {
  private userCollection = collection(db, "users");

  public async getUserByUid(userId: string) {
    const docRef = doc(this.userCollection, userId);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() ? this.documentToUserProfile(docSnap) : null;
  }

  public async getUserByUsername(username: string) {
    const q = query(this.userCollection, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.documentToUserProfile(doc));
  }

  public async updateUserPreferences(
    userId: string,
    preferences: {
      notifications: boolean;
      reviewReminders: boolean;
      newFollowers: boolean;
      likesOnPosts: boolean;
      commentsOnPosts: boolean;
      friendPosts: boolean;
    }
  ) {
    const userDoc = await this.getUserByUid(userId);

    try {
      if (userDoc) {
        const {
          reviewReminders,
          newFollowers,
          likesOnPosts,
          commentsOnPosts,
          friendPosts,
        } = preferences;
        const updatedUser = {
          ...userDoc,
          reviewReminder: reviewReminders,
          newFollowerNotification: newFollowers,
          likeNotification: likesOnPosts,
          commentOnPostNotification: commentsOnPosts,
          friendPostsNotification: friendPosts,
        };

        const userDocRef = doc(this.userCollection, userId);
        await updateDoc(userDocRef, updatedUser);
        return updatedUser;
      }
    } catch (error) {
      console.error("Error updating user preferences", error);
    }

    return null;
  }

  private documentToUserProfile(
    doc: QueryDocumentSnapshot<DocumentData>
  ): UserProfile {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    } as unknown as UserProfile;
  }
}
