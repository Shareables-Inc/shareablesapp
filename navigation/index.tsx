import React, { useEffect, useRef, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/auth.context";
import MainTabNavigator from "./mainTabNavigator";
import { RootStackParamList } from "../types/stackParams.types";
import LoginScreen from "../screens/loginScreens/login";
import SignUpScreen from "../screens/loginScreens/signUp";
import LoadingScreen from "../screens/loadingScreen";
import FollowFriendsScreen from "../screens/loginScreens/followFriends";
import InviteContactsScreen from "../screens/loginScreens/inviteContacts";
import TopCuisinesScreen from "../screens/loginScreens/topCuisines";
import NotificationsScreen from "../screens/notificationScreens/notifications";
import LocationSelectionScreen from "../screens/postScreens/locationSelection";
import ReviewScreen from "../screens/postScreens/postReview";
import TagsSelectionScreen from "../screens/postScreens/tagsSelection";
import UserProfileScreen from "../screens/postScreens/userProfile";
import RestaurantProfileScreen from "../screens/restaurantScreens/restaurantProfile";
import AccountSettingsScreen from "../screens/settingsScreens/accountSettings";
import ChangePasswordScreen from "../screens/settingsScreens/changePassword";
import EditProfileScreen from "../screens/settingsScreens/editProfile";
import MainSettingsScreen from "../screens/settingsScreens/mainSettings";
import NotificationsSettingsScreen from "../screens/settingsScreens/notificationsSettings";
import PrivacySettingsScreen from "../screens/settingsScreens/privacySettings";
import ReportBugScreen from "../screens/settingsScreens/reportBug";
import RequestFeatureScreen from "../screens/settingsScreens/requestFeature";
import NameInputScreen from "../screens/loginScreens/nameInput";
import VerifyEmailScreen from "../screens/loginScreens/verifyEmail";
import UsernameInputScreen from "../screens/loginScreens/usernameInput";
import ExpandedPost from "../screens/postScreens/expandedPost";
import FollowersListScreen from "../screens/postScreens/followerList";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { Subscription } from "expo-notifications";
import config from "../config";
import useNotificationStore, {
  NotificationStoreProps,
} from "../store/useNotificationStore";
import SkeletonMain from "../components/skeleton/skeletonMain";
const Stack = createStackNavigator<RootStackParamList>();

const NotificationHandler = () => {
  const navigation = useNavigation();
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const notificationStore = useNotificationStore();

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const shouldShowAlert = appState
        ? appState === "background" ||
          appState === "inactive" ||
          appState === "active"
        : true;
      return {
        shouldShowAlert,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });

  const handleNotificationClick = async (response: any) => {
    try {
      const postId = response?.notification?.request?.content?.data?.postId;
      const screen = response?.notification?.request?.content?.data?.screen;
      const userId = response?.notification?.request?.content?.data?.userId;

      if (screen) {
        switch (screen) {
          case "ExpandedPost":
            navigation.navigate("ExpandedPost", { postId });
            break;
          case "UserProfile":
            navigation.navigate("UserProfile", { userId });
            break;
          default:
            break;
        }
      }
    } catch (e) {
      console.error(e, "handleNotificationClick");
    }
  };

  useEffect(() => {
    const projectId = config.eas.projectId;

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const { request } = notification;
        const { content } = request;
        const { data, title, body } = content;

        if (request.content && title && body) {
          const newNotification: NotificationStoreProps = {
            id: request.content.data.id,
            title,
            screen: data?.screen,
            message: body,
            createdAt: new Date(),
            data: {
              userId: data?.userId,
              postId: data?.postId,
              profilePicture: data?.profilePicture,
            }, // Include additional data if needed
          };

          notificationStore.addNotification(newNotification);
       
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationClick
      );

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current as Subscription
      );
      Notifications.removeNotificationSubscription(
        responseListener.current as Subscription
      );
    };
  }, [navigation]);

  return null;
};

const MainTabNavigatorWithNotifications = () => (
  <>
    <NotificationHandler />
    <MainTabNavigator />
  </>
);

const linking = {
  prefixes: ['shareables://'], 
  config: {
    screens: {
      RestaurantProfile: 'restaurant/:restaurantId', 
    },
  },
};


export const MainApp = () => {
  const { user, userProfile, profileLoading, loading } = useAuth();

  if (loading || profileLoading) {
    return <SkeletonMain/>;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        ) : !user.emailVerified ? (
          <>
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        ) : !userProfile?.onboardingComplete ? (
          <>
            <Stack.Screen name="NameInput" component={NameInputScreen} />
            <Stack.Screen
              name="UsernameInput"
              component={UsernameInputScreen}
            />
            <Stack.Screen name="TopCuisines" component={TopCuisinesScreen} />
            <Stack.Screen
              name="InviteContacts"
              component={InviteContactsScreen}
            />
            <Stack.Screen
              name="FollowFriends"
              component={FollowFriendsScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="MainTabNavigator"
              component={MainTabNavigatorWithNotifications}
            />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen 
              name="MainSettings" 
              component={MainSettingsScreen} 
            />
            <Stack.Screen 
              name="ReportBug" 
              component={ReportBugScreen} 
            />
            <Stack.Screen
              name="RequestFeature"
              component={RequestFeatureScreen}
            />
            <Stack.Screen
              name="AccountSettings"
              component={AccountSettingsScreen}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen
              name="NotificationsSettings"
              component={NotificationsSettingsScreen}
            />
            <Stack.Screen
              name="PrivacySettings"
              component={PrivacySettingsScreen}
            />
            <Stack.Screen
              name="LocationSelection"
              component={LocationSelectionScreen}
            />
            <Stack.Screen
              name="TagsSelection"
              component={TagsSelectionScreen}
            />
            <Stack.Screen name="ExpandedPost" component={ExpandedPost} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen
              name="RestaurantProfile"
              component={RestaurantProfileScreen}
            />
            <Stack.Screen name="FollowerList" component={FollowersListScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
