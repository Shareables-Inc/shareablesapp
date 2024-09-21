import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/tabs/profile";
import ExpandedPost from "../screens/postScreens/expandedPost";
import UserProfileScreen from "../screens/postScreens/userProfile";
import RestaurantProfileScreen from "../screens/restaurantScreens/restaurantProfile";
import { Post } from "../models/post";

export type ProfileStackParamList = {
  ProfilePage: undefined;
  ExpandedPost: { post: Post };
  UserProfile: { userId: string; post: Post };
  RestaurantProfile: {
    establishmentId: string;
    establishmentName: string;
    city: string;
    country: string;
    priceRange: number;
    status: string;
    website: string;
    hours: string[];
    averageRating: number;
  };
};

const ProfileStack = () => {
  const Stack = createStackNavigator<ProfileStackParamList>();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilePage" component={ProfileScreen} />
      <Stack.Screen name="ExpandedPost" component={ExpandedPost} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
