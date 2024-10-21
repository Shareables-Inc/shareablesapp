import 'dotenv/config';

export default {
  expo: {
    name: "Shareables",
    slug: "shareablesapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    plugins: [
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsDownloadToken": process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
          "RNMapboxMapsVersion": "11.6.0"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Shareables to use your location."
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
      bundleIdentifier: "com.shareablesinc.shareables",
      buildNumber: "1.0.3",
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "maps",
          "comgooglemaps",
          "waze"
        ],
        NSContactsUsageDescription: "This app uses contacts to invite friends.",
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to select photos.",
        NSCameraUsageDescription: "This app needs access to your camera to take photos.",
        UIBackgroundModes: [
          "fetch",
          "remote-notification"
        ],
        NSLocationAlwaysAndWhenInUseUsageDescription: "Allow Shareables to use your location.",
        NSLocationAlwaysUsageDescription: "Allow Shareables to access your location",
        NSLocationWhenInUseUsageDescription: "Allow Shareables to access your location"
      },
      googleServicesFile: process.env.EXPO_GOOGLE_SERVICES_FILE_IOS
    },
    android: {
      package: process.env.EXPO_PACKAGE_NAME,
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
      jiraApiToken: process.env.EXPO_PUBLIC_JIRA_API_TOKEN,
      eas: {
        projectId: 'ef6370a3-a025-4a4c-920d-69ff87de0a82',
      }
    },
    owner: "shareables"
  }
};