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
    console.log("Original Image URI:", imageUri);

    // Encode the image URI
    const encodedImageUri = encodeURI(imageUri);
    console.log("Encoded Image URI:", encodedImageUri);

    // Call the Cloud Function
    const response = await analyzeImage({ imageUri: encodedImageUri });

    const safeSearch = response.data.safeSearch;

    if (!safeSearch) {
      console.error("SafeSearch results are missing.");
      return { isSafe: false, reason: "Missing SafeSearch data" };
    }

    console.log("SafeSearch results:", safeSearch);

    const objectionableLevels = ["LIKELY", "VERY_LIKELY"];

    // Check for objectionable content
    const isObjectionable =
      objectionableLevels.includes(safeSearch.adult || "UNKNOWN") ||
      objectionableLevels.includes(safeSearch.violence || "UNKNOWN") ||
      objectionableLevels.includes(safeSearch.racy || "UNKNOWN");

    if (isObjectionable) {
      return { isSafe: false, reason: "Detected objectionable content" };
    }

    return { isSafe: true };
  } catch (error: any) {
    console.error("Error analyzing image:", error.message || error);
    return { isSafe: false, reason: error.message || "Unknown error" };
  }
};


