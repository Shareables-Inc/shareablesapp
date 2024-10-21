import { db, storage } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  increment,
  runTransaction,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  DocumentData,
  startAfter,
} from "firebase/firestore";
import { Post } from "../models/post";
import { getDownloadURL, ref } from "firebase/storage";
import { DocumentSnapshot } from "firebase/firestore";

export class FollowingService {
  private followingCollection = collection(db, "following");
  private userStatsCollection = collection(db, "userStats");
  private postsCollection = collection(db, "posts");

  async followUser(followerId: string, followingId: string): Promise<void> {
    const relationshipId = `${followerId}_${followingId}`;
    const relationshipDocRef = doc(this.followingCollection, relationshipId);

    await runTransaction(db, async (transaction) => {
      transaction.set(relationshipDocRef, {
        followerId,
        followingId,
        createdAt: serverTimestamp(),
      });

      // Update user stats
      const followerStatsRef = doc(this.userStatsCollection, followerId);
      const followingStatsRef = doc(this.userStatsCollection, followingId);

      transaction.set(
        followerStatsRef,
        { followingCount: increment(1) },
        { merge: true }
      );
      transaction.set(
        followingStatsRef,
        { followerCount: increment(1) },
        { merge: true }
      );
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const relationshipId = `${followerId}_${followingId}`;
    const relationshipDocRef = doc(this.followingCollection, relationshipId);

    await runTransaction(db, async (transaction) => {
      transaction.delete(relationshipDocRef);

      // Update user stats
      const followerStatsRef = doc(this.userStatsCollection, followerId);
      const followingStatsRef = doc(this.userStatsCollection, followingId);

      transaction.set(
        followerStatsRef,
        { followingCount: increment(-1) },
        { merge: true }
      );
      transaction.set(
        followingStatsRef,
        { followerCount: increment(-1) },
        { merge: true }
      );
    });
  }

  // New method to get the list of users that follow the current user
  async getFollowersList(userId: string): Promise<string[]> {
    try {
      const followersQuery = query(
        this.followingCollection,
        where("followingId", "==", userId)
      );
      const followersSnapshot = await getDocs(followersQuery);
      return followersSnapshot.docs.map((doc) => doc.data().followerId);
    } catch (error) {
      console.error("Error fetching followers list:", error);
      return [];
    }
  }

  // New method to get the list of users the current user is following
  async getFollowing(userId: string): Promise<string[]> {
    try {
      const followingQuery = query(
        this.followingCollection,
        where("followerId", "==", userId)
      );
      const followingSnapshot = await getDocs(followingQuery);
      return followingSnapshot.docs.map((doc) => doc.data().followingId);
    } catch (error) {
      console.error("Error fetching following list:", error);
      return [];
    }
  }

  

  async getFollowingPosts(
    userId: string,
    lastVisiblePost?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastVisible: DocumentSnapshot | null }> {
    try {
      const followingIds = await this.getFollowing(userId);

      if (followingIds.length === 0) {
        return { posts: [], lastVisible: null };
      }

      // Prepare the query to fetch posts, add pagination
      let postsQuery = query(
        this.postsCollection,
        where("userId", "in", followingIds),
        orderBy("createdAt", "desc"),
        limit(30) // Set the limit to control how many posts are loaded per page
      );

      if (lastVisiblePost) {
        // If a last visible post is provided, start after that document
        postsQuery = query(postsQuery, startAfter(lastVisiblePost));
      }

      // Get posts from all users being followed
      const postsSnapshot = await getDocs(postsQuery);

      if (postsSnapshot.empty) {
        return { posts: [], lastVisible: null };
      }

      const posts = postsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Post)
      );

      // Fetch profile pictures and establishment data in parallel
      const [profilePictures, establishmentData] = await Promise.all([
        this.getProfilePictures(posts.map((post) => post.userId)),
        this.getEstablishmentData(
          posts.map((post) => post.establishmentDetails?.id).filter(Boolean)
        ),
      ]).catch((error) => {
        console.error(
          "Error fetching profile pictures or establishment data:",
          error
        );
        return [{}, {}];
      });

      // Process posts
      const processedPosts = posts.map((post) => ({
        ...post,
        profilePicture: profilePictures[post.userId],
        establishmentDetails: {
          ...post.establishmentDetails,
          averageRating:
            establishmentData[post.establishmentDetails?.id]?.averageRating,
        },
      }));

      // Remove duplicates
      const uniquePosts = this.removeDuplicates(processedPosts);

      // Get the last visible post for pagination
      const lastVisible = postsSnapshot.docs[postsSnapshot.docs.length - 1];

      return { posts: uniquePosts, lastVisible };
    } catch (error) {
      console.error("Error fetching following posts:", error);
      return { posts: [], lastVisible: null };
    }
  }

  private async getProfilePictures(
    userIds: string[]
  ): Promise<Record<string, string>> {
    const profilePictures: Record<string, string> = {};
    await Promise.all(
      userIds.map(async (userId) => {
        const storageRef = ref(storage, `profilePictures/${userId}`);
        profilePictures[userId] = await getDownloadURL(storageRef);
      })
    );
    return profilePictures;
  }

  private async getEstablishmentData(
    establishmentIds: string[]
  ): Promise<Record<string, DocumentData>> {
    const establishmentData: Record<string, DocumentData> = {};

    const validIds = establishmentIds.filter((id) => id !== null);

    if (validIds.length === 0) {
      return establishmentData;
    }

    const batchSize = 10;
    for (let i = 0; i < validIds.length; i += batchSize) {
      const batch = validIds.slice(i, i + batchSize);
      const batchQuery = query(
        collection(db, "establishments"),
        where("id", "in", batch)
      );
      const batchSnapshot = await getDocs(batchQuery);
      batchSnapshot.forEach((doc) => {
        establishmentData[doc.id] = doc.data() || {};
      });
    }

    return establishmentData;
  }

  private removeDuplicates(posts: Post[]): Post[] {
    const uniqueEstablishments = new Map<string, Post>();
    const uniqueImages = new Map<string, Post>();

    posts.forEach((post) => {
      const establishmentId = post.establishmentDetails?.id;
      const imageUrl = post.imageUrls[0];

      if (establishmentId && !uniqueEstablishments.has(establishmentId)) {
        uniqueEstablishments.set(establishmentId, post);
      }

      if (imageUrl && !uniqueImages.has(imageUrl)) {
        uniqueImages.set(imageUrl, post);
      }
    });

    return [
      ...new Set([...uniqueEstablishments.values(), ...uniqueImages.values()]),
    ];
  }

  async getFollowers(userId: string): Promise<string[]> {
    const followersQuery = query(
      this.followingCollection,
      where("followingId", "==", userId)
    );
    const followersSnapshot = await getDocs(followersQuery);
    return followersSnapshot.docs.map((doc) => doc.data().followerId);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const relationshipId = `${followerId}_${followingId}`;
    const relationshipDocRef = doc(this.followingCollection, relationshipId);
    const relationshipDocSnapshot = await getDoc(relationshipDocRef);
    return relationshipDocSnapshot.exists();
  }

  async getFollowingCount(userId: string): Promise<number> {
    const userStatsRef = doc(this.userStatsCollection, userId);
    const userStatsSnapshot = await getDoc(userStatsRef);
    return userStatsSnapshot.exists()
      ? userStatsSnapshot.data()?.followingCount || 0
      : 0;
  }

  async getFollowersCount(userId: string): Promise<number> {
    const userStatsRef = doc(this.userStatsCollection, userId);
    const userStatsSnapshot = await getDoc(userStatsRef);
    return userStatsSnapshot.exists()
      ? userStatsSnapshot.data()?.followerCount || 0
      : 0;
  }
}
