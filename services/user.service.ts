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
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { UserProfile } from "../models/userProfile";

export class UserService {
  private userCollection = collection(db, "users");

  // Existing method to get user profile by UID
  public async getUserByUid(userId: string) {
    const docRef = doc(this.userCollection, userId);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() ? this.documentToUserProfile(docSnap) : null;
  }

  // Existing method to get user by username
  public async getUserByUsername(username: string) {
    const q = query(this.userCollection, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.documentToUserProfile(doc));
  }

  // New method to subscribe to real-time updates for a user's profile
  public subscribeToUserByUid(userId: string, callback: (userProfile: UserProfile | null) => void) {
    const userDocRef = doc(this.userCollection, userId);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(this.documentToUserProfile(docSnap));
      } else {
        callback(null);
      }
    });
  }

  // Existing method to update user profile information
  public async updateUserProfile(
    userId: string,
    updatedData: Partial<{ firstName: string; lastName: string; profilePicture: string }>
  ) {
    try {
      const userDocRef = doc(this.userCollection, userId);
      await updateDoc(userDocRef, updatedData);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to update user profile: ${error.message}`);
        throw new Error(`Failed to update user profile: ${error.message}`);
      } else {
        console.error('Failed to update user profile: Unknown error');
        throw new Error('Failed to update user profile: Unknown error');
      }
    }
  }

  // Existing method to update user preferences
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

  // Method to convert Firestore document to UserProfile model
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
