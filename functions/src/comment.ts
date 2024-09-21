import { Timestamp } from "firebase/firestore";

export interface Comment {
  comment: string;
  createdAt: Timestamp;
  postId: string;
  userId: string;
  userName: string;
  userProfilePicture: string;
}
