import { FirebasePost, Post } from "../models/post";
import { db, storage } from "../firebase/firebaseConfig";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { PostComment } from "../models/postComments";
import { getDownloadURL, ref } from "firebase/storage";

export interface TopPoster {
  userId: string;
  username: string;
  profilePicture: string;
  postCount: number;
  mostLikedPost: {
    id: string;
    imageUrl: string;
    likeCount: number;
  };
}

export class PostService {
  private postsCollection = collection(db, "posts");
  private establishmentsCollection = collection(db, "establishments");
  private userCollection = collection(db, "users");

  async getPostsPaginated(
    pageSize = 15,
    lastVisible?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    posts: Post[];
    lastVisible: QueryDocumentSnapshot<DocumentData> | undefined;
  }> {
    let q = query(
      this.postsCollection,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(this.documentToPost);
    // after you grab the posts, you need to grab the profile picture of the user
    //using the userID+jpeg and download the url
    for (const post of posts) {
      const storageRef = ref(storage, `profilePictures/${post.userId}`);
      const url = await getDownloadURL(storageRef);
      post.profilePicture = url;
    }

    console.log("posts", posts);

    const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { posts, lastVisible: newLastVisible };
  }

  async createPost(postData: FirebasePost): Promise<string> {
    const newPost: Omit<Post, "id"> = {
      ...postData,
    };

    const docRef = await addDoc(this.postsCollection, newPost);

    // attach the postID to the post
    await updateDoc(doc(this.postsCollection, docRef.id), {
      id: docRef.id,
    });

    return docRef.id;
  }

  async getPost(postId: string): Promise<Post | null> {
    const docRef = doc(this.postsCollection, postId);
    const docSnap = await getDoc(docRef);
    const post = docSnap.exists() ? this.documentToPost(docSnap) : null;

    if (post) {
      const storageRef = ref(storage, `profilePictures/${post.userId}`);
      const url = await getDownloadURL(storageRef);
      post.profilePicture = url;
    }
    return post;
  }

  async updatePost(
    postId: string,
    establishmentId: string,
    updateData: Partial<Post>
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(this.postsCollection, postId);
        const establishmentRef = doc(
          this.establishmentsCollection,
          establishmentId
        );
  
        const postDoc = await transaction.get(postRef);
        const establishmentDoc = await transaction.get(establishmentRef);
  
        if (!postDoc.exists()) {
          throw new Error("Post does not exist!");
        }
  
        if (!establishmentDoc.exists()) {
          throw new Error("Establishment does not exist!");
        }
  
        // Sanitize tags
        const sanitizedTags = (updateData.tags || []).filter((tag) => tag !== undefined && tag !== null);
  
        // Sanitize accessibility flags
        const sanitizedAccessibility = {
          vegetarian: updateData.accessibility?.vegetarian ?? false,
          vegan: updateData.accessibility?.vegan ?? false,
          familyFriendly: updateData.accessibility?.familyFriendly ?? false,
        };
  
        // Update post
        transaction.set(
          postRef,
          {
            ...updateData,
            tags: sanitizedTags, // Use sanitized tags
            accessibility: sanitizedAccessibility, // Add sanitized accessibility
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
  
        // Update establishment
        const establishmentData = establishmentDoc.data();
        const currentPostCount = establishmentData.postCount || 0;
        const currentAverageRating = establishmentData.averageRating || 0;
        const currentOverallRating = parseFloat(
          updateData.ratings?.overall || "0"
        );
  
        const newPostCount = currentPostCount + 1;
        const newTotalRating =
          currentAverageRating * currentPostCount + currentOverallRating;
        const newAverageRating = newTotalRating / newPostCount;
  
        const clampedAverageRating = Math.max(
          1,
          Math.min(10, newAverageRating)
        ).toFixed(1);
  
        // Add the sanitized tags to the establishment without duplicates
        const currentTags = establishmentData.tags || [];
        const updatedTags = Array.from(new Set([...currentTags, ...sanitizedTags]));
  
        // Update accessibility statistics in the establishment
        const updatedAccessibility = {
          vegetarianCount: sanitizedAccessibility.vegetarian
            ? (establishmentData.vegetarianCount || 0) + 1
            : establishmentData.vegetarianCount || 0,
          veganCount: sanitizedAccessibility.vegan
            ? (establishmentData.veganCount || 0) + 1
            : establishmentData.veganCount || 0,
          familyFriendlyCount: sanitizedAccessibility.familyFriendly
            ? (establishmentData.familyFriendlyCount || 0) + 1
            : establishmentData.familyFriendlyCount || 0,
        };
  
        transaction.update(establishmentRef, {
          averageRating: clampedAverageRating,
          postCount: increment(1),
          tags: updatedTags, // Use sanitized tags
          ...updatedAccessibility, // Update accessibility counts
          updatedAt: serverTimestamp(),
        });
      });
  
      console.log("Post and establishment updated successfully");
    } catch (error) {
      console.error("Error updating post and establishment:", error);
      throw error;
    }
  }
  

  async deletePost(postId: string): Promise<void> {
    const docRef = doc(this.postsCollection, postId);
    await deleteDoc(docRef);
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    const q = query(this.postsCollection, where("userId", "==", userId));

    const querySnapshot = await getDocs(q);

    // retrieve the averageRating of the establishment from the establishment collection
    const posts = querySnapshot.docs.map(this.documentToPost);
    for (const post of posts) {
      const establishmentRef = doc(
        db,
        "establishments",
        post.establishmentDetails.id
      );
      const establishmentSnap = await getDoc(establishmentRef);
      const establishment = establishmentSnap.data();
      post.establishmentDetails.averageRating = establishment?.averageRating;
    }
    return posts;
  }

  async getMostRecentPosts(userId: string): Promise<Post[]> {
    const q = query(
      this.postsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.documentToPost);
  }

  async getTopPosters(limit: number = 4): Promise<TopPoster[]> {
    try {
      // First, get the posts grouped by userId and count them
      const postsQuery = query(this.postsCollection, orderBy("userId"));
      const postSnapshot = await getDocs(postsQuery);

      const userPostCounts = new Map<string, number>();
      const userMostLikedPosts = new Map<string, Post>();

      postSnapshot.forEach((doc) => {
        const postData = doc.data() as FirebasePost;
        const userId = postData.userId;
        userPostCounts.set(userId, (userPostCounts.get(userId) || 0) + 1);

        // Update most liked post for this user if necessary
        const currentMostLiked = userMostLikedPosts.get(userId);
        if (
          !currentMostLiked ||
          (postData.likeCount || 0) > (currentMostLiked.likeCount || 0)
        ) {
          userMostLikedPosts.set(userId, { ...postData, id: doc.id });
        }
      });

      // Sort users by post count and get top 4
      const topUserIds = Array.from(userPostCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([userId]) => userId);

      // Fetch user details for top posters
      return await Promise.all(
        topUserIds.map(async (userId) => {
          const userDoc = await getDoc(doc(this.userCollection, userId));
          const userData = userDoc.data();

          // Fetch profile picture
          const storageRef = ref(storage, `profilePictures/${userId}`);
          const profilePicture = await getDownloadURL(storageRef);

          const mostLikedPost = userMostLikedPosts.get(userId);
          let mostLikedPostData = {
            id: "",
            imageUrl: "",
            likeCount: 0,
          };

          if (mostLikedPost) {
            mostLikedPostData = {
              id: mostLikedPost.id,
              imageUrl: mostLikedPost.imageUrls[0] || "",
              likeCount: mostLikedPost.likeCount || 0,
            };
          }

          return {
            userId,
            username: userData?.username || "Unknown User",
            profilePicture,
            postCount: userPostCounts.get(userId) || 0,
            mostLikedPost: mostLikedPostData,
          };
        })
      );
    } catch (error) {
      console.error("Error fetching top posters:", error);
      return [];
    }
  }

  async getNumberOfPosts(userId: string): Promise<number> {
    const q = query(this.postsCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length;
  }

  async getTopPosts(): Promise<Post[]> {
    const q = query(
      this.postsCollection,
      orderBy("likes.count", "desc"),
      limit(5)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.documentToPost);
  }

  private documentToPost(doc: QueryDocumentSnapshot<DocumentData>): Post {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt,
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : data.updatedAt,
    } as unknown as Post;
  }

  private documentToPostComment(
    doc: QueryDocumentSnapshot<DocumentData>
  ): PostComment {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as unknown as PostComment;
  }
}
