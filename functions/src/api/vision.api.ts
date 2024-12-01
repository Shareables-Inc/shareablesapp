import * as functions from "firebase-functions";
import * as vision from "@google-cloud/vision";

// Initialize Vision API client
const client = new vision.ImageAnnotatorClient();

export const analyzeImage = functions.https.onCall(
  async (request: functions.https.CallableRequest<{ imageUri: string }>) => {
    const { imageUri } = request.data;

    if (!imageUri) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Image URI is required."
      );
    }

    try {
      // Call the Vision API to perform SafeSearch Detection
      const [result] = await client.safeSearchDetection(imageUri);
      const safeSearch = result.safeSearchAnnotation;

      // Handle missing SafeSearch annotation
      if (!safeSearch) {
        console.error("Missing SafeSearch annotation in Vision API response.");
        throw new functions.https.HttpsError(
          "internal",
          "SafeSearch annotation is missing from Vision API response."
        );
      }

      // Log SafeSearch results for debugging purposes
      console.log("SafeSearch results:", JSON.stringify(safeSearch));

      // Determine if the image is safe based on Vision API results
      const isSafe =
        safeSearch.adult !== "LIKELY" &&
        safeSearch.adult !== "VERY_LIKELY" &&
        safeSearch.violence !== "LIKELY" &&
        safeSearch.violence !== "VERY_LIKELY";

      // Return structured response
      return {
        isSafe,
        safeSearch,
      };
    } catch (error: any) {
      console.error("Error analyzing image:", error.message || error);

      // Handle specific error cases for more clarity
      if (error.code === 7) {
        // Vision API quota exceeded
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Vision API quota exceeded. Try again later."
        );
      }

      // Default to internal error
      throw new functions.https.HttpsError(
        "internal",
        `Error analyzing image: ${error.message || "Unknown error"}`
      );
    }
  }
);
