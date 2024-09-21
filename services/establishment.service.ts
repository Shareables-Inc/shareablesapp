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
import { useQuery } from "@tanstack/react-query";
import { Post } from "../models/post";
import { getDownloadURL, ref } from "firebase/storage";

export class EstablishmentService {
  private establishmentsCollection = collection(db, "establishments");
  private postsCollection = collection(db, "posts");

  async createEstablishment(establishment: Establishment) {
    // Create the document without the id field
    const { id, ...establishmentWithoutId } = establishment;

    // Add the document to Firestore
    const establishmentDoc = await addDoc(
      this.establishmentsCollection,
      establishmentWithoutId
    );

    // Update the document with its id
    await updateDoc(establishmentDoc, { id: establishmentDoc.id });

    return establishmentDoc.id;
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

  async getEstablishments(
    establishmentIds: string[]
  ): Promise<Establishment[]> {
    const establishmentsQuery = query(
      this.establishmentsCollection,
      where("id", "in", establishmentIds)
    );
    const establishmentsSnapshot = await getDocs(establishmentsQuery);

    return establishmentsSnapshot.docs.map(
      (doc) => doc.data() as Establishment
    );
  }
  async getFeaturedEstablishments(
    city: string,
    selectedTag?: string
  ): Promise<FeaturedEstablishment[]> {
    try {
      console.log(`Starting getFeaturedEstablishments for city: ${city}`);
      return await runTransaction(db, async () => {
        const now = Timestamp.now();
        const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
        const thirtyDaysAgo = new Timestamp(
          now.seconds - thirtyDaysInSeconds,
          now.nanoseconds
        );
        console.log(`Thirty days ago: ${thirtyDaysAgo.toDate()}`);

        let establishmentsQuery: Query;
        if (selectedTag) {
          establishmentsQuery = query(
            this.establishmentsCollection,
            where("city", "==", city),
            where("updatedAt", ">=", thirtyDaysAgo),
            where("tags", "array-contains", selectedTag),
            orderBy("updatedAt", "desc"),
            limit(10)
          );
        } else {
          establishmentsQuery = query(
            this.establishmentsCollection,
            where("city", "==", city),
            where("updatedAt", ">=", thirtyDaysAgo),
            orderBy("updatedAt", "desc"),
            limit(10)
          );
        }

        const establishmentsSnapshot = await getDocs(establishmentsQuery);
        console.log(`Found ${establishmentsSnapshot.size} establishments`);

        const establishmentIds = establishmentsSnapshot.docs.map(
          (doc) => doc.id
        );
        console.log(`Establishment IDs: ${JSON.stringify(establishmentIds)}`);

        if (establishmentIds.length === 0) {
          console.log("No establishments found, returning empty array");
          return []; // No establishments found
        }

        // Query posts based on the establishment IDs fetched above
        const postsQuery = query(
          this.postsCollection,
          where("establishmentDetails.id", "in", establishmentIds),
          orderBy("createdAt", "desc"),
          limit(20)
        );

        const postsSnapshot = await getDocs(postsQuery);
        console.log(`Found ${postsSnapshot.size} posts`);

        // Process posts and associate them with establishments
        const uniqueEstablishments = new Map();
        postsSnapshot.docs.forEach((doc) => {
          const post = doc.data() as Post;
          const establishmentId = post.establishmentDetails.id;
          if (!uniqueEstablishments.has(establishmentId)) {
            uniqueEstablishments.set(establishmentId, {
              id: establishmentId,
              images: post.imageUrls,
            });
          }
        });
        console.log(
          `Processed ${uniqueEstablishments.size} unique establishments from posts`
        );

        // Combine establishment data with post data
        const result = establishmentsSnapshot.docs.map((doc) => {
          const establishment = doc.data() as Establishment;

          // extract the tags from the establishment and sort alphabetically
          const sortedTags = establishment.tags?.sort((a, b) =>
            a.localeCompare(b)
          );

          const postData = uniqueEstablishments.get(establishment.id) || {};
          console.log(
            `Processing establishment: ${
              establishment.id
            }, Tags: ${JSON.stringify(sortedTags)}`
          );

          return {
            ...establishment,
            ...postData,
            tags: sortedTags,
          } as FeaturedEstablishment;
        });

        console.log(`Returning ${result.length} featured establishments`);
        return result;
      });
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

    console.log("establishmentSnapshot", establishmentSnapshot);
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
      limit(10)
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
    const gallery = postsSnapshot.docs.slice(0, 5).map((doc) => {
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
      priceRange: establishmentData.priceRange || "No Price Range",
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
