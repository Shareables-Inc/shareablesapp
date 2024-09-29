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
} from "firebase/firestore";
import { Post } from "../models/post";
import { getDownloadURL, ref } from "firebase/storage";

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

  async getFollowing(userId: string): Promise<string[]> {
    const followingQuery = query(
      this.followingCollection,
      where("followerId", "==", userId)
    );
    const followingSnapshot = await getDocs(followingQuery);
    return followingSnapshot.docs.map((doc) => doc.data().followingId);
  }

  // Get all followerIDs that the user is following
  // Get all posts from the followerIDs
  // Return an array of the posts limited to 10
  async getFollowingPosts(userId: string): Promise<Post[]> {
    try {
      // Get users that the current user is following
      const followingSnapshot = await getDocs(
        query(this.followingCollection, where("followerId", "==", userId))
      );

      if (followingSnapshot.empty) {
        return [];
      }

      const followingIds = followingSnapshot.docs.map(
        (doc) => doc.id.split("_")[1]
      );

      if (followingIds.length === 0) {
        return [];
      }

      // Get posts from all users being followed
      const postsSnapshot = await getDocs(
        query(
          this.postsCollection,
          where("userId", "in", followingIds),
          orderBy("createdAt", "desc"),
          limit(10)
        )
      );

      if (postsSnapshot.empty) {
        return [];
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

      console.log(
        `Found ${uniquePosts.length} unique posts from followed users`
      );

      console.log("Unique posts:", uniquePosts);
      return uniquePosts;
    } catch (error) {
      console.error("Error fetching following posts:", error);
      return [];
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
      console.log("No valid establishment IDs provided");
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
