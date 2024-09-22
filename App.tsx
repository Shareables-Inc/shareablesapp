import React, { useEffect, useState, useRef, useCallback } from "react";
import { Platform, Alert, AppStateStatus, AppState } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { createStackNavigator } from "@react-navigation/stack";
import config from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "./context/auth.context";
import { MainApp } from "./navigation";
import type { RootStackParamList } from "./types/stackParams.types";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryClient } from "./utils/query.client";
import { useLocationStore } from "./store/useLocationStore";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  registerForPushNotificationsAsync,
  updatePushNotificationTokenFirebase,
  scheduleWeeklyRestaurantNotification,
} from "./services/pushNotification.service";
import { QueryKey } from "@tanstack/react-query";

interface CustomManifest {
  extra?: {
    eas?: {
      projectId?: string;
    };
  };
}

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const fetchFonts = () => {
  return Font.loadAsync({
    "Outfit-Bold": require("./assets/fonts/Outfit-Bold.ttf"),
    "Outfit-Regular": require("./assets/fonts/Outfit-Regular.ttf"),
    "Outfit-SemiBold": require("./assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Light": require("./assets/fonts/Outfit-Light.ttf"),
    "Outfit-Medium": require("./assets/fonts/Outfit-Medium.ttf"),
  });
};

// Configure notification handler

const AppContent = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const location = useLocationStore();
  const tokens = useRef<string | null>(null);
  const { user, userProfile } = useAuth();

  // check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    location.fetchLocation();
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        setIsLoggedIn(true);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await fetchFonts();
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      registerForPushNotificationsAsync()
        .then((token) => {
          tokens.current = token ?? null;

          if (token) {
            updatePushNotificationTokenFirebase(token, user.uid);
          }
        })
        .catch((error) => {
          console.error("Failed to register for push notifications:", error);
        });
    }
  }, [user?.uid]);

  useEffect(() => {
    if (userProfile?.reviewReminder) {
      scheduleWeeklyRestaurantNotification();
    }
  }, [userProfile?.reviewReminder]);

  if (!fontsLoaded) {
    return null;
  }

  return <MainApp />;
};

const doNotPersistQueries: QueryKey[] = [["userPosts"]];
const App = () => {
  return (
    <AuthProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Ignore userPosts query from cache
              return !query.queryKey.includes("userPosts");
            },
          },
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <AppContent />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </PersistQueryClientProvider>
    </AuthProvider>
  );
};

export default App;