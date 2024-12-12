import axios from "axios";

export const analyzeImageWithVisionAPI = async (
  imageUri: string
): Promise<{ isSafe: boolean; reason?: string }> => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY;
  const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  try {
    const requestData = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUri, // Use the public URL directly
            },
          },
          features: [
            {
              type: "SAFE_SEARCH_DETECTION",
            },
          ],
        },
      ],
    };

    const response = await axios.post(apiUrl, requestData);
    const safeSearch = response.data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      console.error("SafeSearch results are missing.");
      return { isSafe: false, reason: "Missing SafeSearch data" };
    }

    const objectionableLevels = ["LIKELY", "VERY_LIKELY"];
    const isAdultContent = objectionableLevels.includes(safeSearch.adult || "UNKNOWN");
    const isViolentContent = objectionableLevels.includes(safeSearch.violence || "UNKNOWN");

    // Allow flexibility for racy content, but block if it's also adult or violent
    const isRacyContent = objectionableLevels.includes(safeSearch.racy || "UNKNOWN");
    if (isAdultContent || isViolentContent || (isRacyContent && (isAdultContent || isViolentContent))) {
      return { isSafe: false, reason: "Detected objectionable content" };
    }

    // Log details for transparency
    console.log("SafeSearch Analysis:", {
      adult: safeSearch.adult,
      violence: safeSearch.violence,
      racy: safeSearch.racy,
    });

    return { isSafe: true };
  } catch (error: unknown) {
    console.error(
      "Error analyzing image:",
      error instanceof Error ? error.message : error
    );
    return { isSafe: false, reason: error instanceof Error ? error.message : "Unknown error" };
  }
};
