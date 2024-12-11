import { getFunctions, httpsCallable } from "firebase/functions";

// Define a more specific type for SafeSearch annotations
type SafeSearchAnnotation = {
  adult?: "VERY_LIKELY" | "LIKELY" | "POSSIBLE" | "UNLIKELY" | "VERY_UNLIKELY" | "UNKNOWN";
  violence?: "VERY_LIKELY" | "LIKELY" | "POSSIBLE" | "UNLIKELY" | "VERY_UNLIKELY" | "UNKNOWN";
  racy?: "VERY_LIKELY" | "LIKELY" | "POSSIBLE" | "UNLIKELY" | "VERY_UNLIKELY" | "UNKNOWN";
};

export const checkImageForObjectionableContent = async (
  imageUri: string
): Promise<{ isSafe: boolean; reason?: string }> => {
  const functions = getFunctions(undefined, "us-central1"); // Specify region if necessary
  const analyzeImage = httpsCallable<
    { imageUri: string },
    { safeSearch: SafeSearchAnnotation }
  >(functions, "analyzeImage");

  try {
    console.log("Image URI:", imageUri);

    // Call the Cloud Function with raw URI (no double-encoding)
    const response = await analyzeImage({ imageUri });

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

