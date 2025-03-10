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

        // Update post
        transaction.set(
          postRef,
          {
            ...updateData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Update establishment
        const establishmentData = establishmentDoc.data();
        const currentPostCount = establishmentData.postCount || 0;
        const currentAverageRating = 0;
        const currentOverallRating = parseFloat(
          updateData.ratings?.overall || "0"
        );

        const newPostCount = currentPostCount + 1;
        const newTotalRating =
          currentAverageRating * currentPostCount + currentOverallRating;
        const newAverageRating = newTotalRating / newPostCount;

        const clampedAverageRating = Math.max(
          0,
          Math.min(10, newAverageRating)
        ).toFixed(1);

        // add the new tags made from the post to the establishment but make sure there are no duplicates
        const currentTags = establishmentData.tags || [];
        const newTags = updateData.tags || [];
        const updatedTags = [...currentTags, ...newTags];

        // remove duplicates
        const uniqueTags = Array.from(new Set(updatedTags));

        transaction.update(establishmentRef, {
          averageRating: clampedAverageRating,
          postCount: increment(1),
          tags: uniqueTags,
          updatedAt: serverTimestamp(),
        });
      });

      console.log("Post and establishment updated successfully");
    } catch (error) {
      console.error("Error updating post and establishment:", error);
      throw error;
    }
  }

  async updatePostRestaurant(
    postId: string,
    establishmentId: string,
    updateData: Partial<Post>
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(this.postsCollection, postId);
        const establishmentRef = doc(this.establishmentsCollection, establishmentId);
  
        const postDoc = await transaction.get(postRef);
        const establishmentDoc = await transaction.get(establishmentRef);
  
        if (!postDoc.exists()) {
          throw new Error("Post does not exist!");
        }
  
        if (!establishmentDoc.exists()) {
          throw new Error("Establishment does not exist!");
        }
  
        // Update the post document
        transaction.set(
          postRef,
          {
            ...updateData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
  
        // Update establishment only with non-cumulative fields (e.g. tags)
        const establishmentData = establishmentDoc.data();
        const currentTags = establishmentData.tags || [];
        const newTags = updateData.tags || [];
        // Remove duplicates by merging the arrays and converting to a Set
        const uniqueTags = Array.from(new Set([...currentTags, ...newTags]));
  
        transaction.update(establishmentRef, {
          tags: uniqueTags,
          updatedAt: serverTimestamp(),
        });
      });
  
      console.log("Post review updated successfully (without modifying cumulative ratings).");
    } catch (error) {
      console.error("Error updating post review:", error);
      throw error;
    }
  }
  

  async editPost(
    postId: string,
    establishmentId: string,
    updateData: Partial<Post>
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(this.postsCollection, postId);
        const establishmentRef = doc(this.establishmentsCollection, establishmentId);
  
        const postDoc = await transaction.get(postRef);
        const establishmentDoc = await transaction.get(establishmentRef);
  
        if (!postDoc.exists()) {
          throw new Error("Post does not exist!");
        }
  
        if (!establishmentDoc.exists()) {
          throw new Error("Establishment does not exist!");
        }
  
        const establishmentData = establishmentDoc.data();
        const currentPostCount = establishmentData.postCount || 0;
        const currentAverageRating = establishmentData.averageRating || 0.0;
        const newOverallRating = parseFloat(updateData.ratings?.overall || "0");
  
        // Fetch the existing post's overall rating
        const existingPostRating = parseFloat(postDoc.data().ratings?.overall || "0");
  
        // Debugging logs
        console.log("currentPostCount:", currentPostCount);
        console.log("currentAverageRating:", currentAverageRating);
        console.log("newOverallRating:", newOverallRating);
        console.log("existingPostRating:", existingPostRating);
  
        // Calculate the new total rating
        const totalRatingWithoutExisting = currentAverageRating * currentPostCount - existingPostRating;
        const newTotalRating = totalRatingWithoutExisting + newOverallRating;
        const newAverageRating = newTotalRating / currentPostCount;
  
        // Ensure proper rounding
        const roundedAverageRating = parseFloat(newAverageRating.toFixed(1));
  
        // Debugging logs
        console.log("totalRatingWithoutExisting:", totalRatingWithoutExisting);
        console.log("newTotalRating:", newTotalRating);
        console.log("newAverageRating:", newAverageRating);
        console.log("roundedAverageRating:", roundedAverageRating);
  
        // Add new tags while ensuring no duplicates
        const currentTags = establishmentData.tags || [];
        const newTags = updateData.tags || [];
        const updatedTags = Array.from(new Set([...currentTags, ...newTags]));
  
        // Update the post
        transaction.set(
          postRef,
          {
            ...updateData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
  
        // Update the establishment document
        transaction.update(establishmentRef, {
          averageRating: roundedAverageRating,
          tags: updatedTags,
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

  async getPostsByUserPaginated(
    userId: string,
    pageSize = 6,
    pageParam?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ posts: Post[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined }> {
    try {
      let q = query(
        this.postsCollection,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
  
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }
  
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return { posts: [], lastVisible: undefined };
      }
  
      let posts: Post[] = querySnapshot.docs.map((doc) => this.documentToPost(doc));
  
      // Fetch profile pictures in parallel instead of sequentially
      const profilePicturePromises = posts.map(async (post) => {
        const storageRef = ref(storage, `profilePictures/${post.userId}`);
        try {
          return { userId: post.userId, url: await getDownloadURL(storageRef) };
        } catch (error) {
          console.error("Error fetching profile picture:", error);
          return { userId: post.userId, url: "https://example.com/default-profile.jpg" }; 
        }
      });
  
      const profilePictures = await Promise.all(profilePicturePromises);
  
      // Map fetched URLs back to posts
      const profilePictureMap = new Map(profilePictures.map((p) => [p.userId, p.url]));
      posts = posts.map((post) => ({
        ...post,
        profilePicture: profilePictureMap.get(post.userId) || "https://example.com/default-profile.jpg",
      }));
  
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
  
      return { posts, lastVisible: newLastVisible };
    } catch (error) {
      console.error("Error fetching user posts:", error);
      return { posts: [], lastVisible: undefined };
    }
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

