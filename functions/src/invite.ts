import { Timestamp } from "firebase-admin/firestore";

export interface Invite {
  userId: string;
  userName: string;
  establishmentName: string;
  establishmentId: string;
  timestamp: Timestamp;
}

