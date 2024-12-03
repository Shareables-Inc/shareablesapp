import { getFunctions, httpsCallable } from "firebase/functions";

export const checkImageForObjectionableContent = async (
  imageUri: string
): Promise<{ isSafe: boolean; reason?: string }> => {
  const functions = getFunctions();
  const analyzeImage = httpsCallable<
    { imageUri: string },
    { safeSearch: Record<string, string | null | undefined> }
  >(functions, "analyzeImage");

  try {
    // Call the Cloud Function
    const response = await analyzeImage({ imageUri });

    // Extract SafeSearch results
    const safeSearch = response.data.safeSearch;

    if (!safeSearch) {
      console.error("SafeSearch results are missing.");
      return { isSafe: false, reason: "Missing SafeSearch data" };
    }

    // Define objectionable content levels
    const objectionableLevels = ["LIKELY", "VERY_LIKELY"];

    // Check for objectionable content
    const isObjectionable =
      objectionableLevels.includes(safeSearch.adult || "UNKNOWN") ||
      objectionableLevels.includes(safeSearch.violence || "UNKNOWN") ||
      objectionableLevels.includes(safeSearch.racy || "UNKNOWN");

    if (isObjectionable) {
      return { isSafe: false, reason: "Detected objectionable content" };
    }

    // Image is safe
    return { isSafe: true };
  } catch (error: any) {
    console.error("Error analyzing image:", error.message || error);
    return { isSafe: false, reason: error.message || "Unknown error" };
  }
};
