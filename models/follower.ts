import { FieldValue } from "firebase/firestore";

interface Following {
  followerId: string;
  followingId: string;
  createdAt: FieldValue;
}

// Collection: userStats
interface UserStats {
  userId: string;
  followerCount: number;
  followingCount: number;
}
