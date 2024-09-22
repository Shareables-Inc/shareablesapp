import { Save, UserSaves } from "../models/save";
import { db } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { MarkerType } from "../components/discover/MapViewWithMarkers";
import { Post } from "../models/post";

export class SaveService {
  private userSavesCollection = "userSaves";

  async createSave(userId: string, saveData: Save): Promise<void> {
    const save: Save = {
      establishmentId: saveData.establishmentId,
      establishmentName: saveData.establishmentName,
      latitude: saveData.latitude,
      longitude: saveData.longitude,
      createdAt: new Date(),
    };

    console.log("saveData", saveData);

    // Check if all required fields are present
    if (
      !save.establishmentId ||
      !save.establishmentName ||
      save.latitude === undefined ||
      save.longitude === undefined
    ) {
      throw new Error("Missing required fields for save");
    }

    const userDocRef = doc(db, this.userSavesCollection, userId);

    try {
      await updateDoc(userDocRef, {
        saves: arrayUnion(save),
        lastUpdated: new Date(),
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "not-found"
      ) {
        // If the document doesn't exist, create it
        await setDoc(userDocRef, {
          userId,
          saves: [save],
          lastUpdated: new Date(),
        });
      } else {
        throw error;
      }
    }
  }

  async getUserSaves(userId: string): Promise<UserSaves | null> {
    const docRef = doc(db, this.userSavesCollection, userId);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() ? (docSnap.data() as UserSaves) : null;
  }

  async removeSave(userId: string, establishmentId: string): Promise<void> {
    if (!establishmentId) {
      console.error("Invalid establishmentId provided:", establishmentId);
      return;
    }

    const userDocRef = doc(db, this.userSavesCollection, userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserSaves;
      console.log("Original saves:", userData.saves);

      const updatedSaves = userData.saves.filter(
        (save) => save.establishmentId !== establishmentId
      );

      console.log("Filtered saves:", updatedSaves);
      console.log("Removed establishmentId:", establishmentId);

      if (updatedSaves.length === userData.saves.length) {
        console.warn(
          "No save was removed. EstablishmentId not found:",
          establishmentId
        );
      } else {
        console.log(
          "Number of saves removed:",
          userData.saves.length - updatedSaves.length
        );
      }

      await updateDoc(userDocRef, {
        saves: updatedSaves,
        lastUpdated: new Date(),
      });

      // Verify the update
      const updatedDoc = await getDoc(userDocRef);
      const updatedData = updatedDoc.data() as UserSaves;
      console.log("Saves after update:", updatedData.saves);
    } else {
      console.warn("User document not found for userId:", userId);
    }
  }

}
