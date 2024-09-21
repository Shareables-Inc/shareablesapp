import { Timestamp } from "firebase/firestore";

export interface Likes {
  userId: string;
  postId: string;
  lastUpdated: Timestamp;
}
