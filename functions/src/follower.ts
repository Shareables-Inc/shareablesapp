import { Timestamp } from "firebase/firestore";

export interface Follower {
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}
