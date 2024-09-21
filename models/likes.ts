import { Timestamp } from "firebase/firestore";

export interface Likes {
  lastUpdated: Timestamp; // Timestamp of when the user last liked a post
  postId: string;
  userId: string;
}
