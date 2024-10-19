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
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { UserProfile } from "../models/userProfile";

export class UserService {
  private userCollection = collection(db, "users");
  private userStatsCollection = collection(db, "userStats");

  // Cache for top-followed users
  private cachedTopUsers: (UserProfile & { followerCount: number })[] | null = null;
  private cacheTimestamp: number | null = null;
  private CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Method to get user profile by UID
  public async getUserByUid(userId: string) {
    const docRef = doc(this.userCollection, userId);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() ? this.documentToUserProfile(docSnap) : null;
  }

  // Method to get user by username
  public async getUserByUsername(username: string) {
    const q = query(this.userCollection, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => this.documentToUserProfile(doc));
  }

  // Method to get followerCount from userStats collection
  public async getUserFollowerCount(userId: string): Promise<number> {
    const userStatsRef = doc(this.userStatsCollection, userId);
    const docSnap = await getDoc(userStatsRef);
  
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.followerCount || 0;
    } else {
      return 0; // Return 0 if no followerCount is found
    }
  }

  // Method to get top 10 users with the most followers using userStats and cache for 24 hours
  public async getTopFollowedUsers(location?: string): Promise<(UserProfile & { followerCount: number })[]> {
    const now = Date.now();
  
    // Check if cached data exists and is still valid
    if (this.cachedTopUsers && this.cacheTimestamp && (now - this.cacheTimestamp) < this.CACHE_DURATION && !location) {
      console.log("Returning cached top-followed users");
      return this.cachedTopUsers;
    }
  
    try {
      console.log("Fetching top-followed users from Firestore");
  
      // Query userStats collection to get top users with most followers
      let statsQuery = query(
        this.userStatsCollection,
        orderBy("followerCount", "desc"),
        limit(10)
      );
  
      // If a location is provided, filter by location
      if (location) {
        const usersInLocationQuery = query(
          this.userCollection,
          where("location", "==", location) // Filter by location
        );
  
        const usersInLocationSnapshot = await getDocs(usersInLocationQuery);
        const userIdsInLocation = usersInLocationSnapshot.docs.map((doc) => doc.id);
  
        // Add the user IDs filter to the stats query
        if (userIdsInLocation.length > 0) {
          statsQuery = query(
            this.userStatsCollection,
            where("__name__", "in", userIdsInLocation), // Filter userStats based on the user IDs in the location
            orderBy("followerCount", "desc"),
            limit(10)
          );
        } else {
          return []; // If no users in the location, return an empty array
        }
      }
  
      const statsSnapshot = await getDocs(statsQuery);
      const topUserIds = statsSnapshot.docs.map((doc) => doc.id);
  
      // Fetch user profiles and followerCount for these top userIds
      const userProfilesWithFollowerCount: (UserProfile & { followerCount: number })[] = [];
  
      for (const userId of topUserIds) {
        const userProfile = await this.getUserByUid(userId); // Fetch user profile by UID
        const followerCount = await this.getUserFollowerCount(userId); // Fetch follower count
  
        if (userProfile) {
          userProfilesWithFollowerCount.push({ ...userProfile, followerCount }); // Merge follower count
        }
      }
  
      // Cache the data and update the cache timestamp
      if (!location) {
        this.cachedTopUsers = userProfilesWithFollowerCount;
        this.cacheTimestamp = Date.now();
      }
  
      return userProfilesWithFollowerCount;
    } catch (error) {
      console.error("Error fetching top-followed users:", error);
      throw new Error("Failed to fetch top-followed users");
    }
  }

  // Method to subscribe to real-time updates for a user's profile
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

  // Method to update user profile information
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

  // Method to update user preferences
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

  // Optional: Method to manually clear the cache
  public clearCache() {
    this.cachedTopUsers = null;
    this.cacheTimestamp = null;
  }
}
