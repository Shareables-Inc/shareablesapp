import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { db } from "../firebase/firebaseConfig";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";

function handleRegistrationError(errorMessage: string) {
  // Handle error message
}

// Cancel all previously scheduled notifications
async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleWeeklyRestaurantNotification() {
  // Cancel any existing scheduled notifications to prevent duplication
  await cancelAllScheduledNotifications();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Dinner plans?",
      body: "Capture & share your experience with friends!",
    },
    trigger: {
      weekday: 6, 
      hour: 17, 
      minute: 30,
      repeats: true,
    },
  });
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!"
      );
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }
}

async function getDevicePushToken() {
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError("Project ID not found");
  }
  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    return pushTokenString;
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
  }
}

// update the user's fcmToken in the database when it changes
async function updatePushNotificationTokenFirebase(
  token: string,
  userId: string
) {
  try {
    const userCollection = collection(db, "users");
    const userRef = doc(userCollection, userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.data()?.fcmToken !== token) {
      await updateDoc(userRef, {
        fcmToken: token,
      });
    }
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
  }
}

export {
  handleRegistrationError,
  registerForPushNotificationsAsync,
  updatePushNotificationTokenFirebase,
  getDevicePushToken,
};
