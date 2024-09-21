import { FieldValue } from "firebase/firestore";
import { Post } from "./post";

export interface Establishment extends FirebaseEstablishment {
  id: string;
}

export type FirebaseEstablishment = {
  mapboxId: string;
  name: string;
  address: string;
  averageRating: string;
  city: string;
  country: string;
  description?: string;
  postCount: number;
  email?: string;
  hours?: {
    friday?: {
      open: string;
      close: string;
    };
    monday?: {
      open: string;
      close: string;
    };
    saturday?: {
      open: string;
      close: string;
    };
    sunday?: {
      open: string;
      close: string;
    };
    thursday?: {
      open: string;
      close: string;
    };
    tuesday?: {
      open: string;
      close: string;
    };
    wednesday?: {
      open: string;
      close: string;
    };
  };
  latitude: number;
  longitude: number;
  phone?: string;
  postal_code: string;
  priceRange?: string;
  status?: string;
  tags: string[];
  website?: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

export type EstablishmentCard = Establishment & {
  priceRange: string;
  distance: string;
  tags: string[];
  gallery?: Post[];
  status: string | null;
  website: string | null;
  postCount: number;
  fewImagePostReview: Post[];
};

export type EstablishmentListCard = {
  id: string;
  name: string;
  averageRating: number;
  location: {
    city: string;
    country: string;
    address: string;
    postalCode: string;
  };
  priceRange: string;
  tags: string[];
  distance: string;
};

export interface FeaturedEstablishment
  extends Omit<Establishment, "tags" | "createdAt"> {
  images?: string[];
  tags: string[];
  priceRange?: string;
  createdAt: string | FieldValue;
}
