import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { db } from "../firebase/firebaseConfig";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";

function handleRegistrationError(errorMessage: string) {
  // alert(errorMessage);
  console.log(errorMessage, "error handleRegistrationError");
  // throw new Error(errorMessage);
}

export async function scheduleWeeklyRestaurantNotification() {
  const trigger = new Date();
  trigger.setDate(trigger.getDate() + ((5 + 7 - trigger.getDay()) % 7)); // Next Friday
  trigger.setHours(18, 0, 0, 0); // 6:00 PM

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Discover New Restaurants!",
      body: "It's Friday! Time to explore some new dining options in your area.",
    },
    trigger: {
      weekday: trigger.getDay(), // Friday
      hour: trigger.getHours(),
      minute: trigger.getMinutes(),
      repeats: true,
    },
  });

  console.log("Weekly restaurant notification scheduled");
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
      console.log(pushTokenString);
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
    console.log(pushTokenString);
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
    // get the user's document from the users collection
    const userCollection = collection(db, "users");
    const userRef = doc(userCollection, userId);
    // update the user's fcmToken field with the new token if it is different
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
