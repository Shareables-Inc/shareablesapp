import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ExpandedPost from "../screens/postScreens/expandedPost";
import RestaurantProfileScreen from "../screens/restaurantScreens/restaurantProfile";
import UserProfileScreen from "../screens/postScreens/userProfile";
import { Post } from "../models/post";
import HomePage from "../screens/tabs/home";

export type HomeStackParamList = {
  HomePage: { activeTab: "Feed" | "Discover" };
  ExpandedPost: { post: Post };
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

  UserProfile: { userId: string };
};

const HomeStack = () => {
  const Stack = createStackNavigator<HomeStackParamList>();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, headerStatusBarHeight: 0 }}
    >
      <Stack.Screen name="HomePage" component={HomePage} />
      <Stack.Screen name="ExpandedPost" component={ExpandedPost} />
      <Stack.Screen
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
      />

      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
