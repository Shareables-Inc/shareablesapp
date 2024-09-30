import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
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

// Initialize Firebase Admin SDK
admin.initializeApp();

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
      await sendPushNotifications(message);
    } catch (error) {
      // Error handling without logger
    }
  }
);

export const sendFollowedUserPostNotification = onDocumentCreated(
  "posts/{postId}",
  async (event) => {
    const postData = event.data?.data() as Post | undefined;
    if (!postData) {
      return;
    }

    if (!postData.userId) {
      return;
    }

    // Delay the notification by 5 minutes to ensure full post completion
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));

    // Check if the post has images before sending the notification
    if (!postData.imageUrls || postData.imageUrls.length === 0) {
      logger.info("Post has no images, skipping notification");
      return;
    }

    // get the user who made the post
    const userRef = admin.firestore().collection("users").doc(postData.userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() as UserProfile | undefined;

    if (!userData) {
      return;
    }

    // grab all list of people who are following the user
    const followersRef = admin
      .firestore()
      .collection("following")
      .where("followingId", "==", postData.userId);
    const followersDoc = await followersRef.get();
    const followersData = followersDoc.docs.map((doc) => doc.data());

    // Get the follower's username and FCM token
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
      return;
    }

    // Send a notification to each follower
    const notifications: PostNotification[] = [];

    for (const follower of followerUsernames) {
      if (follower.fcmToken) {
        const message: PostNotification = {
          to: follower.fcmToken,
          sound: "default",
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

    await sendPushNotifications(notifications);
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
