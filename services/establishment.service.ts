// create a class that will handle the establishment api
import {
  Establishment,
  EstablishmentCard,
  FeaturedEstablishment,
} from "../models/establishment";
import { db, storage } from "../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  orderBy,
  serverTimestamp,
  limit,
  Timestamp,
  runTransaction,
  Query,
} from "firebase/firestore";
import { Post } from "../models/post";
import { getDownloadURL, ref } from "firebase/storage";

export class EstablishmentService {
  private establishmentsCollection = collection(db, "establishments");
  private postsCollection = collection(db, "posts");

  async createEstablishment(establishment: Establishment, postRating?: number) {
    // Extract the id field and create the document without it
    const { id, ...establishmentWithoutId } = establishment;
  
    // Default values for post count and average rating
    const initialPostCount = postRating ? 1 : 0;
    const initialAverageRating = postRating || 0.0;
  
    // Add the document to Firestore
    const establishmentDoc = await addDoc(this.establishmentsCollection, {
      ...establishmentWithoutId,
      postCount: initialPostCount, // Start at 1 if a postRating exists, otherwise 0
      averageRating: initialAverageRating, // Start with the first post's rating or 0
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  
    // Update the document with its id
    await updateDoc(establishmentDoc, { id: establishmentDoc.id });
  
    console.log("Establishment created with ID:", establishmentDoc.id);
  
    return establishmentDoc.id;
  }
  

  async getEstablishmentByMapboxId(
    mapboxId: string
  ): Promise<Establishment | null> {
    const establishmentsQuery = query(
      this.establishmentsCollection,
      where("mapboxId", "==", mapboxId)
    );
   
    const establishmentsSnapshot = await getDocs(establishmentsQuery);
 
    if (establishmentsSnapshot.empty) {
      return null;
    }

    if (establishmentsSnapshot.docs.length > 1) {
      return null;
    }

    return establishmentsSnapshot.docs[0].data() as Establishment;
  }

  async getEstablishmentByNameAndAddress(
    name: string,
    address: string
  ): Promise<Establishment[] | null> {
    const establishmentsQuery = query(
      this.establishmentsCollection,
      where("name", "==", name),
      where("address", "==", address)
    );
    const establishmentsSnapshot = await getDocs(establishmentsQuery);

    if (establishmentsSnapshot.empty) {
      return null;
    }

    return establishmentsSnapshot.docs.map(
      (doc) => doc.data() as Establishment
    );
  }

  async getEstablishmentsByMapboxId(
    mapboxId: string
  ): Promise<Establishment[]> {
    const establishmentsQuery = query(
      this.establishmentsCollection,
      where("mapboxId", "==", mapboxId)
    );
    const establishmentsSnapshot = await getDocs(establishmentsQuery);

    if (establishmentsSnapshot.empty) {
      return [];
    }

    return establishmentsSnapshot.docs.map(
      (doc) => doc.data() as Establishment
    );
  }

  async getFeaturedEstablishments(
    city: string,
    selectedTag?: string
  ): Promise<FeaturedEstablishment[]> {
    try {
      let establishmentsQuery: Query;
      if (selectedTag) {
        establishmentsQuery = query(
          this.establishmentsCollection,
          where("city", "==", city),
          where("tags", "array-contains", selectedTag),
          orderBy("updatedAt", "desc"),
          limit(10) // Limit to 10 establishments
        );
      } else {
        establishmentsQuery = query(
          this.establishmentsCollection,
          where("city", "==", city),
          orderBy("updatedAt", "desc"),
          limit(10) // Limit to 10 establishments
        );
      }
  
      const establishmentsSnapshot = await getDocs(establishmentsQuery);
      const establishmentIds = establishmentsSnapshot.docs.map((doc) => doc.id);
  
      if (establishmentIds.length === 0) {
        return [];
      }
  
      // Query posts based on the establishment IDs
      const postsQuery = query(
        this.postsCollection,
        where("establishmentDetails.id", "in", establishmentIds),
        orderBy("createdAt", "desc"),
        limit(10) // Limit posts to 10
      );
  
      const postsSnapshot = await getDocs(postsQuery);
  
      // Filter the posts to only include those with images
      const filteredPosts = postsSnapshot.docs.filter((doc) => {
        const postData = doc.data() as Post;
        return postData.imageUrls && postData.imageUrls.length > 0;
      });
  
      const uniqueEstablishments = new Map();
      filteredPosts.forEach((doc) => {
        const post = doc.data() as Post;
        const establishmentId = post.establishmentDetails.id;
        const existing = uniqueEstablishments.get(establishmentId);
        if (existing) {
          existing.images.push(...post.imageUrls);
        } else {
          uniqueEstablishments.set(establishmentId, {
            id: establishmentId,
            images: [...post.imageUrls],
          });
        }
      });
  
      const result = establishmentsSnapshot.docs.map((doc) => {
        const establishment = doc.data() as Establishment;
        const postData = uniqueEstablishments.get(establishment.id) || {};
        return {
          ...establishment,
          ...postData,
          tags: establishment.tags || [],
        } as FeaturedEstablishment;
      });
  
      return result;
    } catch (error) {
      console.error("Error fetching featured establishments:", error);
      return [];
    }
  }
  
  
  

  async getEstablishmentById(establishmentId: string) {
    const establishmentDoc = doc(
      this.establishmentsCollection,
      establishmentId
    );
    const establishmentSnapshot = await getDoc(establishmentDoc);

    return establishmentSnapshot.data() as Establishment;
  }

  async getEstablishmentCardData(
    establishmentId: string
  ): Promise<EstablishmentCard | null> {
    const establishmentDoc = doc(
      this.establishmentsCollection,
      establishmentId
    );
    const establishmentSnapshot = await getDoc(establishmentDoc);

    if (!establishmentSnapshot.exists()) {
      return null;
    }

    const establishmentData = establishmentSnapshot.data() as Establishment;

    // Query for posts related to this establishment
    const postsQuery = query(
      collection(db, "posts"),
      where("establishmentDetails.id", "==", establishmentId),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const postsSnapshot = await getDocs(postsQuery);

    // get the profile picture of the user who posted the post
    const profilePicture = await Promise.all(
      postsSnapshot.docs.slice(0, 5).map(async (doc) => {
        const postData = doc.data() as Post;
        const storageRef = ref(storage, `profilePictures/${postData.userId}`);
        const userProfilePicture = await getDownloadURL(storageRef);
        return {
          profilePicture: userProfilePicture,
          postId: doc.id,
        };
      })
    );

    // map the profile picture to the that post that equals the post id
    const gallery = postsSnapshot.docs
      .filter(doc => doc.data().imageUrls && doc.data().imageUrls.length > 0)
      .slice(0, 5)
      .map((doc) => {
      const postData = doc.data() as Post;
      return {
        ...postData,
        profilePicture:
          profilePicture.find((image) => image.postId === doc.id)
            ?.profilePicture || "",
      };
    });

    // map the profile picture to the post for the few image post review
    const fewImagePostReview = postsSnapshot.docs.slice(0, 5).map((doc) => {
      const postData = doc.data() as Post;
      return {
        ...postData,
        profilePicture:
          profilePicture.find((image) => image.postId === doc.id)
            ?.profilePicture || "",
      };
    });

    return {
      id: establishmentData.id,
      name: establishmentData.name,
      averageRating: establishmentData.averageRating,
      city: establishmentData.city,
      country: establishmentData.country,
      address: establishmentData.address,
      postal_code: establishmentData.postal_code,
      latitude: establishmentData.latitude,
      longitude: establishmentData.longitude,
      priceRange: establishmentData.priceRange || 0,
      distance: "N/A", // This would need to be calculated based on user's location
      tags: establishmentData.tags,
      gallery: gallery.length > 0 ? gallery : undefined,
      postCount: establishmentData.postCount,
      fewImagePostReview: fewImagePostReview,
      status: establishmentData.status || "",
      website: establishmentData.website || "",
      mapboxId: establishmentData.mapboxId || "",
      createdAt: establishmentData.createdAt || "",
      updatedAt: establishmentData.updatedAt || "",
    };
  }
}
