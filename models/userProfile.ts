import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string;
  createdAt: Timestamp;
  email: string;
  favoriteCuisines: string[];
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePicture: string;
  username: string;
  onboardingComplete: boolean;
  contactsPermission: boolean;
  fcmToken?: string;
  reviewReminder: boolean;
  newFollowerNotification: boolean;
  likeNotification: boolean;
  commentOnPostNotification: boolean;
  friendPostsNotification: boolean;
  bio?: string;
  location: string;
}
