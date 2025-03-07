import 'dotenv/config';

export default ({ config }) => {
  const isProduction = process.env.EAS_BUILD_PROFILE === "production";

  return {
    ...config,
    expo: {
      name: "Shareables",
      slug: "shareablesapp",
      version: "1.1.6",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      userInterfaceStyle: "light",
      plugins: [
        [
          "@rnmapbox/maps",
          {
            RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
            RNMapboxMapsVersion: "11.6.0"
          }
        ],
        [
          "expo-location",
          {
            locationAlwaysAndWhenInUsePermission: "Allow Shareables to use your location to determine what restaurants surround you on the map page."
          }
        ],
        "expo-font"
      ],
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      assetBundlePatterns: [
        "assets/images/*"
      ],
      ios: {
        supportsTablet: false,
        bundleIdentifier: isProduction
          ? "com.shareablesinc.shareables"
          : "com.shareablesinc.shareablesdev",
        buildNumber: "3",
        googleServicesFile: process.env.EXPO_GOOGLE_SERVICES_FILE_IOS,
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
          LSApplicationQueriesSchemes: [
            "maps",
            "comgooglemaps",
            "waze",
            "instagram-stories"
          ],
          NSContactsUsageDescription: "This app uses your contacts to recommend users to follow. We do not store this data.",
          NSPhotoLibraryUsageDescription: "This app uses your photo library to allow you to make posts. We only store the photos that you select for posting.",
          NSCameraUsageDescription: "This app uses your camera to either add photos to your post or create a new profile image.",
          UIBackgroundModes: [
            "fetch",
            "remote-notification"
          ],
          NSLocationAlwaysAndWhenInUseUsageDescription: "Allow Shareables to use your location to determine what restaurants surround you on the map page.",
          NSLocationAlwaysUsageDescription: "Allow Shareables to access your location to determine what restaurants surround you on the map page.",
          NSLocationWhenInUseUsageDescription: "Allow Shareables to access your location to determine what restaurants surround you on the map page."
        }
      },
      android: {
        package: isProduction
          ? "com.shareablesinc.shareables"
          : "com.shareablesinc.shareablesdev",
        googleServicesFile: process.env.EXPO_GOOGLE_SERVICES_FILE_ANDROID,
        adaptiveIcon: {
          backgroundColor: "#ffffff"
        },
        permissions: [
          "READ_CONTACTS",
          "READ_EXTERNAL_STORAGE",
          "WRITE_EXTERNAL_STORAGE",
          "ACCESS_COARSE_LOCATION",
          "ACCESS_FINE_LOCATION",
          "CAMERA",
          "INTERNET",
          "VIBRATE",
          "WAKE_LOCK"
        ]
      },
      web: {
        favicon: "./assets/images/favicon.png"
      },
      extra: {
        firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
        jiraApiToken: process.env.EXPO_PUBLIC_JIRA_API_TOKEN,
        googleCloudVisionApiKey: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY,
        eas: {
          projectId: 'ef6370a3-a025-4a4c-920d-69ff87de0a82'
        }
      },
      owner: "shareables"
    }
  };
};
