import { getFunctions, httpsCallable } from "firebase/functions";

export const checkImageForObjectionableContent = async (
  imageUri: string
): Promise<boolean> => {
  const functions = getFunctions();
  const analyzeImage = httpsCallable<{ imageUri: string }, { isSafe: boolean; safeSearch?: Record<string, string> }>(
    functions,
    "analyzeImage"
  );

  try {
    const response = await analyzeImage({ imageUri });

    // Ensure the response contains the expected structure
    if (response.data && typeof response.data.isSafe === "boolean") {
      if (!response.data.isSafe) {
        console.warn("Objectionable content detected:", response.data.safeSearch || "Details unavailable");
      }
      return response.data.isSafe;
    } else {
      console.error("Unexpected response structure from Vision API:", response.data);
      throw new Error("Unexpected response structure from Vision API.");
    }
  } catch (error: any) {
    console.error("Error analyzing image:", error.message || error);
    return false; // Default to rejecting the image on error
  }
};
