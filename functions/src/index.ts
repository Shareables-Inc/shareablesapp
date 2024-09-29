import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
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
import { Timestamp } from "firebase-admin/firestore";
// Initialize Firebase Admin SDK
admin.initializeApp();
export const sendCommentNotification = onDocumentCreated(
  "comments/{commentId}",
  async (event) => {
    const comment = event.data?.data() as Comment | undefined;
    const commentId = event.id;
    if (!comment) {
      logger.error("No comment data found");
      return;
    }

    try {
      // Fetch the post data to get the owner's user ID
      const postRef = admin.firestore().collection("posts").doc(comment.postId);
      const postDoc = await postRef.get();
      const postData = postDoc.data();

      if (!postData) {
        logger.error("Post data not found");
        return;
      }

      if (!postData.userId) {
        logger.error("Post userId not found");
        return;
      }

      // Don't send notification if the commenter is the post owner
      if (comment.userId === postData.userId) {
        logger.info("Comment author is post owner, skipping notification");
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
        logger.error("User data or FCM token not found");
        return;
      }

      // check if the user has enabled comment notifications
      if (!userData.commentOnPostNotification) {
        logger.info("User has disabled comment notifications");
        return;
      }

      // Prepare the notification message
      const message: CommentNotification = {
        to: userData.fcmToken,
        sound: "default",
        tag: Timestamp.now().toDate().toString(),
        title: "New Comment on Your Post",
        body: `${comment.userName} commented: ${comment.comment.substring(
          0,
          100
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
      const response = await sendPushNotifications(message);
      logger.info("Notification sent successfully", response);
    } catch (error) {
      logger.error("Error sending notification", error);
    }
  }
);

// this is a notifcation for a when a user is get a new follower
export const sendFollowNotification = onDocumentCreated(
  "following/{followingId}",
  async (event) => {
    const followingData = event.data?.data() as Follower | undefined;

    if (!followingData) {
      logger.error("No following data found");
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
        logger.error("Follower user data or username not found");
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
        logger.error("Followed user data or FCM token not found");
        return;
      }

      // check if the user has enabled new follower notifications
      if (!followedUserData.newFollowerNotification) {
        logger.info("User has disabled new follower notifications");
        return;
      }

      // Prepare the notification message
      const message: FollowerNotification = {
        to: followedUserData.fcmToken,
        sound: "default",
        tag: Timestamp.now().toDate().toString(),
        title: "New Follower",
        body: `${followerUserData.username} started following you!`,
        data: {
          id: uuidv4(),
          screen: "UserProfile",
          userId: followingData.followerId,
          profilePicture: followerUserData.profilePicture,
        },
      };

      // Send the notification
      const response = await sendPushNotifications(message);
      logger.info("Follow notification sent successfully", response);
    } catch (error) {
      logger.error("Error sending follow notification", error);
    }
  }
);

// This notification will handle when your someone likes your post
export const sendLikeNotification = onDocumentCreated(
  "likes/{likeId}",
  async (event) => {
    const likeData = event.data?.data() as Likes | undefined;

    if (!likeData) {
      logger.error("No like data found");
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
        logger.error("Post data not found");
        return;
      }

      // grab the post owner id and the liker id
      const postOwnerId = postData.userId;
      const likerId = likeData.userId;

      // don't send a notification if the liker is the post owner
      if (likerId === postOwnerId) {
        logger.info("Liker is the post owner, skipping notification");
        return;
      }

      // Fetch the post owner's FCM token
      const ownerRef = admin.firestore().collection("users").doc(postOwnerId);
      const ownerDoc = await ownerRef.get();
      const ownerData = ownerDoc.data();

      if (!ownerData || !ownerData.fcmToken) {
        logger.error("Post owner data or FCM token not found");
        return;
      }

      // check if the user has enabled like notifications
      if (!ownerData.likeNotification) {
        logger.info("User has disabled like notifications");
        return;
      }

      // Fetch the liker's username
      const likerRef = admin.firestore().collection("users").doc(likerId);
      const likerDoc = await likerRef.get();
      const likerData = likerDoc.data();

      if (!likerData || !likerData.username) {
        logger.error("Liker data or username not found");
        return;
      }

      // Prepare the notification message
      const message: LikeNotification = {
        to: ownerData.fcmToken,
        sound: "default",
        tag: Timestamp.now().toDate().toString(),
        title: "New Like on Your Post",
        body: `${likerData.username} liked your post!`,

        data: {
          id: uuidv4(),
          screen: "ExpandedPost",
          postId: likeData.postId,
          profilePicture: likerData.profilePicture,
        },
      };

      // Send the notification
      const response = await sendPushNotifications(message);
      logger.info("Like notification sent successfully", response);
    } catch (error) {
      logger.error("Error sending like notification", error);
    }
  }
);

// people who you have followed made a new post
export const sendFollowedUserPostNotification = onDocumentCreated(
  "posts/{postId}",
  async (event) => {
    const postData = event.data?.data() as Post | undefined;
    if (!postData) {
      logger.error("No post data found");
      return;
    }

    if (!postData.userId) {
      logger.error("No post userId found");
      return;
    }

    // get the user who made the post
    const userRef = admin.firestore().collection("users").doc(postData.userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() as UserProfile | undefined;

    if (!userData) {
      logger.error("No user data found");
      return;
    }

    // grab all list of people who are following the user
    const followersRef = admin
      .firestore()
      .collection("following")
      .where("followingId", "==", postData.userId);
    const followersDoc = await followersRef.get();
    const followersData = followersDoc.docs.map((doc) => doc.data());

    // I need to then get the follower's username and fcm token
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

    // check if the user has enabled friend posts notifications
    if (!userData.friendPostsNotification) {
      logger.info("User has disabled friend posts notifications");
      return;
    }

    // send a notification to each follower
    const notifications: PostNotification[] = [];

    for (const follower of followerUsernames) {
      if (follower.fcmToken) {
        const message: PostNotification = {
          to: follower.fcmToken,
          sound: "default",
          tag: Timestamp.now().toDate().toString(),
          title: "Your Friend Made a New Post!",
          body: `${userData.username} made a new post!`,
          data: {
            id: uuidv4(),
            screen: "ExpandedPost",
            postId: postData.id,
            profilePicture: userData.profilePicture,
          },
        };
        notifications.push(message);
      }
    }

    // delay the notification by 1 minute
    await new Promise((resolve) => setTimeout(resolve, 60000));

    const response = await sendPushNotifications(notifications);
    logger.info("Notification sent successfully", response);
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
      logger.error("No postId found in like data");
      return;
    }

    try {
      const postRef = admin.firestore().collection("posts").doc(postId);

      await postRef.update({
        likeCount: admin.firestore.FieldValue.increment(1),
      });
    } catch (error) {
      logger.error("Error incrementing like count:", error);
    }
  }
);

// Function to decrement like count
export const decrementLikeCount = onDocumentDeleted(
  "/likes/{likeId}",
  async (event) => {
    const likeData = event.data;

    if (!likeData) {
      logger.error("No like data found");
      return;
    }

    const postId = likeData.data().postId;

    if (!postId) {
      logger.error("No postId found in like data");
      return;
    }

    try {
      const postRef = admin.firestore().collection("posts").doc(postId);
      await postRef.update({
        likeCount: admin.firestore.FieldValue.increment(-1),
      });
    } catch (error) {
      logger.error("Error decrementing like count:", error);
    }
  }
);
