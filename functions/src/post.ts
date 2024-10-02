import { FieldValue } from "firebase-admin/firestore";

export interface Post extends FirebasePost {
  id: string;
}

interface FirebasePost {
  id: string;
  userId: string;
  profilePicture: string;
  username: string;
  establishmentDetails: EstablishmentDetails;
  ratings: {
    overall: string; // Overall rating (0-5)
    ambiance: number; // Ambiance rating (0-5)
    foodQuality: number; // Food quality rating (0-5)
    service: number; // Service rating (0-5)
  };
  review: string;
  imageUrls: string[]; // Array of image URLs associated with the post
  tags: string[]; // Array of tags associated with the post
  saveCount: number;
  likeCount: number;
  imageComponent: string;
  createdAt: FieldValue; // Timestamp when the post was created
  updatedAt: FieldValue;
}

interface EstablishmentDetails {
  id: string;
  address: string;
  averageRating: number;
  city: string;
  country: string;
  hours?: string[];
  name: string;
  longitude: number;
  latitude: number;
  priceRange: number;
  status: string;
  website: string;
}
