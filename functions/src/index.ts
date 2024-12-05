import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {
  CommentNotification,
  FollowerNotification,
  LikeNotification,
  PostNotification,
} from "./notification";
import { Comment } from "./comment";
import { Likes } from "./likes";
import { Follower } from "./follower";
import { UserProfile } from "./user";
import { Post } from "./post";
import { v4 as uuidv4 } from "uuid";
import { sendPushNotifications } from "./api/expo.api";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as functions from "firebase-functions";

// Initialize Firebase Admin SDK
admin.initializeApp();

const client = new ImageAnnotatorClient();

// Cloud Function to Analyze Images
export const analyzeImage = functions.https.onCall(
  async (request: functions.https.CallableRequest<{ imageUri: string }>) => {
    const { imageUri } = request.data;

    // Validate input
    if (!imageUri) {
      throw new functions.https.HttpsError("invalid-argument", "Image URI is required.");
    }

    try {
      console.log("Original Image URI:", imageUri);

      // Encode the image URI
      const encodedImageUri = encodeURI(imageUri);
      console.log("Encoded Image URI:", encodedImageUri);

      // Perform SafeSearch Detection
      const [result] = await client.safeSearchDetection(encodedImageUri);

      if (!result) {
        console.error("No response from Vision API.");
        throw new functions.https.HttpsError("internal", "No response from Vision API.");
      }

      const safeSearch = result.safeSearchAnnotation;

      if (!safeSearch) {
        console.error("SafeSearch annotation missing in Vision API response.");
        throw new functions.https.HttpsError(
          "internal",
          "SafeSearch annotation is missing from Vision API response."
        );
      }

      console.log("SafeSearch results:", JSON.stringify(safeSearch));
      return { safeSearch };
    } catch (error: any) {
      console.error("Error analyzing image:", error.message || error);

      if (error.code === 7) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Vision API quota exceeded. Try again later."
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        `Error analyzing image: ${error.message || "Unknown error"}`
      );
    }
  }
);



export const sendCommentNotification = onDocumentCreated(
  "comments/{commentId}",
  async (event) => {
    const comment = event.data?.data() as Comment | undefined;
    const commentId = event.id;
    if (!comment) {
      return;
    }

    try {
      // Fetch the post data to get the owner's user ID
      const postRef = admin.firestore().collection("posts").doc(comment.postId);
      const postDoc = await postRef.get();
      const postData = postDoc.data();

      if (!postData) {
        return;
      }

      if (!postData.userId) {
        return;
      }

      // Don't send notification if the commenter is the post owner
      if (comment.userId === postData.userId) {
        return;
      }

      // Fetch the user's FCM token
      const userRef = admin
        .firestore()
        .collection("users")
        .doc(postData.userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      if (!userData || !userData.fcmToken) {
        return;
      }

      // check if the user has enabled comment notifications
      if (!userData.commentOnPostNotification) {
        return;
      }

      // Prepare the notification message
      const message: CommentNotification = {
        to: userData.fcmToken,
        sound: "default",
        title: `${comment.userName} commented on your review`,
        body: `${comment.comment.substring(
          0,
          50
        )}...`,
        data: {
          id: uuidv4(),
          screen: "ExpandedPost",
          postId: comment.postId,
          commentId,
          profilePicture: comment.userProfilePicture,
        },
      };

      // Send the notification
      await sendPushNotifications(message);
    } catch (error) {
      // Error handling without logger
    }
  }
);

export const sendFollowNotification = onDocumentCreated(
  "following/{followingId}",
  async (event) => {
    const followingData = event.data?.data() as Follower | undefined;

    if (!followingData) {
      return;
    }

    try {
      // Fetch the follower's user data to get their username
      const followerRef = admin
        .firestore()
        .collection("users")
        .doc(followingData.followerId);
      const followerDoc = await followerRef.get();
      const followerUserData = followerDoc.data();

      if (!followerUserData || !followerUserData.username) {
        return;
      }

      // Fetch the followed user's FCM token
      const followedUserRef = admin
        .firestore()
        .collection("users")
        .doc(followingData.followingId);
      const followedUserDoc = await followedUserRef.get();
      const followedUserData = followedUserDoc.data();

      if (!followedUserData || !followedUserData.fcmToken) {
        return;
      }

      // check if the user has enabled new follower notifications
      if (!followedUserData.newFollowerNotification) {
        return;
      }

      // Prepare the notification message
      const message: FollowerNotification = {
        to: followedUserData.fcmToken,
        sound: "default",
        title: `${followerUserData.username} started following you`,
        body: `They trust your taste in food!`,
        data: {
          id: uuidv4(),
          screen: "UserProfile",
          userId: followingData.followerId,
          profilePicture: followerUserData.profilePicture,
        },
      };

      // Send the notification
      await sendPushNotifications(message);
    } catch (error) {
      // Error handling without logger
    }
  }
);

export const sendLikeNotification = onDocumentCreated(
  "likes/{likeId}",
  async (event) => {
    const likeData = event.data?.data() as Likes | undefined;

    if (!likeData) {
      return;
    }

    try {
      // grab the post
      const postRef = admin
        .firestore()
        .collection("posts")
        .doc(likeData.postId);
      const postDoc = await postRef.get();
      const postData = postDoc.data();

      if (!postData) {
        return;
      }

      // grab the post owner id and the liker id
      const postOwnerId = postData.userId;
      const likerId = likeData.userId;

      // don't send a notification if the liker is the post owner
      if (likerId === postOwnerId) {
        return;
      }

      // Fetch the post owner's FCM token
      const ownerRef = admin.firestore().collection("users").doc(postOwnerId);
      const ownerDoc = await ownerRef.get();
      const ownerData = ownerDoc.data();

      if (!ownerData || !ownerData.fcmToken) {
        return;
      }

      // check if the user has enabled like notifications
      if (!ownerData.likeNotification) {
        return;
      }

      // Fetch the liker's username
      const likerRef = admin.firestore().collection("users").doc(likerId);
      const likerDoc = await likerRef.get();
      const likerData = likerDoc.data();

      if (!likerData || !likerData.username) {
        return;
      }

      // Prepare the notification message
      const message: LikeNotification = {
        to: ownerData.fcmToken,
        sound: "default",
        title: "Your review was worth some love!",
        body: `${likerData.username} liked your post`,
        data: {
          id: uuidv4(),
          screen: "ExpandedPost",
          postId: likeData.postId,
          profilePicture: likerData.profilePicture,
        },
      };

      // Send the notification
      await sendPushNotifications(message);
    } catch (error) {
      // Error handling without logger
    }
  }
);

export const sendFollowedUserPostNotification = onDocumentCreated(
  "posts/{postId}",
  async (event) => {
    const postId = event.params?.postId;
    const postData = event.data?.data() as Post | undefined;

    if (!postData) {
      console.log(`Post ${postId} data is missing.`);
      return;
    }

    if (!postData.userId) {
      console.log(`Post ${postId} has no userId.`);
      return;
    }

    // Delay for 5 minutes
    console.log(`Delaying notifications for post ${postId} by 5 minutes.`);
    await new Promise((resolve) => setTimeout(resolve, 300000)); // 5 minutes = 300,000 ms

    // Fetch the user who made the post
    const userRef = admin.firestore().collection("users").doc(postData.userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() as UserProfile | undefined;

    if (!userData) {
      console.log(`User ${postData.userId} does not exist.`);
      return;
    }

    console.log(`Fetching followers of user ${postData.userId}`);

    // Grab all followers of the user
    const followersRef = admin
      .firestore()
      .collection("following")
      .where("followingId", "==", postData.userId);
    const followersDoc = await followersRef.get();
    const followersData = followersDoc.docs.map((doc) => doc.data());

    if (followersData.length === 0) {
      console.log(`User ${postData.userId} has no followers.`);
      return;
    }

    console.log(`User ${postData.userId} has ${followersData.length} followers`);

    // Fetch FCM tokens for all followers
    const followerUsernames = await Promise.all(
      followersData.map(async (follower) => {
        const followerRef = admin
          .firestore()
          .collection("users")
          .doc(follower.followerId);
        const followerDoc = await followerRef.get();
        const followerData = followerDoc.data();
        return {
          username: followerData?.username,
          fcmToken: followerData?.fcmToken,
        };
      })
    );

    console.log("Fetched FCM tokens for followers:", followerUsernames);

    // Check if the user has enabled friend posts notifications
    if (!userData.friendPostsNotification) {
      console.log(`User ${postData.userId} has disabled friend posts notifications.`);
      return;
    }

    // Check if the post still exists after the delay
    const postRef = admin.firestore().collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      console.log(`Post ${postId} was deleted. Skipping notification.`);
      return;
    }

    console.log(`Post ${postId} still exists. Preparing to send notifications.`);

    // Prepare notifications for each follower
    const notifications: PostNotification[] = [];

    for (const follower of followerUsernames) {
      if (follower.fcmToken) {
        const message: PostNotification = {
          to: follower.fcmToken,
          sound: "default",
          title: `${userData.username} posted`,
          body: `Check out their latest review!`,
          data: {
            id: uuidv4(),
            screen: "ExpandedPost",
            postId: postData.id,
            profilePicture: userData.profilePicture,
          },
        };
        notifications.push(message);
      } else {
        console.log(`Follower ${follower.username} has no FCM token.`);
      }
    }

    if (notifications.length === 0) {
      console.log("No notifications to send, skipping.");
      return;
    }

    console.log(`Sending ${notifications.length} notifications for post ${postId}.`);

    // Send the notifications
    try {
      await sendPushNotifications(notifications);
      console.log("Notifications sent successfully.");
    } catch (error) {
      console.error("Error sending notifications: ", error);
    }
  }
);



export const scheduledDeleteIncompletePosts = onSchedule(
  {
    schedule: "0 4 * * *", // Run at 4:00 AM every day
    timeZone: "America/Toronto" // Set the timezone to EST (Toronto)
  },
  async (event) => {
    const postsRef = admin.firestore().collection('posts');
    const establishmentsRef = admin.firestore().collection('establishments');
    
    try {
      // Step 1: Find and delete posts with empty imageUrls
      const incompletePostsSnapshot = await postsRef
        .where('imageUrls', '==', [])
        .get();

      const batch = admin.firestore().batch();

      incompletePostsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        console.log(`Deleted post ${doc.id} due to empty imageUrls.`);
      });

      await batch.commit();

      // Step 2: Find and delete establishments with postCount of 0
      const establishmentsSnapshot = await establishmentsRef
        .where('postCount', '==', 0)
        .get();

      if (!establishmentsSnapshot.empty) {
        const establishmentBatch = admin.firestore().batch();

        establishmentsSnapshot.forEach((doc) => {
          establishmentBatch.delete(doc.ref);
          console.log(`Deleted establishment ${doc.id} due to postCount being 0.`);
        });

        await establishmentBatch.commit();
      } else {
        console.log('No establishments with postCount of 0 found.');
      }
    } catch (error) {
      console.error('Error deleting incomplete posts or empty establishments:', error);
    }
  }
);

export const incrementLikeCount = onDocumentCreated(
  "/likes/{likeId}",
  async (event) => {
    const likeData = event.data;

    if (!likeData) {
      return;
    }

    const postId = likeData.data().postId;

    if (!postId) {
      return;
    }

    try {
      const postRef = admin.firestore().collection("posts").doc(postId);

      await postRef.update({
        likeCount: admin.firestore.FieldValue.increment(1),
      });
    } catch (error) {
      // Error handling without logger
    }
  }
);

export const decrementLikeCount = onDocumentDeleted(
  "/likes/{likeId}",
  async (event) => {
    const likeData = event.data;

    if (!likeData) {
      return;
    }

    const postId = likeData.data().postId;

    if (!postId) {
      return;
    }

    try {
      const postRef = admin.firestore().collection("posts").doc(postId);
      await postRef.update({
        likeCount: admin.firestore.FieldValue.increment(-1),
      });
    } catch (error) {
      // Error handling without logger
    }
  }
);