import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image } from "react-native";
import Colors from "../utils/colors";
import PostStack from "../navigation/postStack";
import ProfileStack from "../navigation/profileStack";
import { Fonts } from "../utils/fonts";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Binoculars,
  Home,
  MapPin,
  Search,
  CirclePlus,
  UserCircle,
} from "lucide-react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native";
import HomeTab from "../screens/tabs/home";
import { useAuth } from "../context/auth.context";
import HomeStack from "./homeStack";

import SearchScreen from "../screens/tabs/explore";
import FastImage from "react-native-fast-image";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { userProfile } = useAuth();
  const [profilePicture, setProfilePicture] = useState(
    userProfile?.profilePicture || ""
  );

  // setup a listener to update the user profile picture when the userProfile changes in firebase
  useEffect(() => {
    console.log("LISTER", userProfile?.id);
    if (userProfile?.id) {
      const unsubscribe = onSnapshot(
        doc(db, "users", userProfile.id),
        (doc) => {
          setProfilePicture(doc.data()?.profilePicture);
        }
      );
      return () => unsubscribe();
    }
  }, [userProfile?.id]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.highlightText,
        tabBarInactiveTintColor: Colors.placeholderText,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: Fonts.Light,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: { backgroundColor: Colors.background },
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          let iconSize = size;
          let iconStyle = {};

          if (route.name === "Home") {
            icon = <Home size={iconSize} color={color} />;
          } else if (route.name === "Post") {
            icon = <CirclePlus size={iconSize} color={color} />;
          } else if (route.name === "Profile") {
            iconSize = 30;
            iconStyle = {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
              borderWidth: 2,
              borderColor: focused
                ? Colors.highlightText
                : Colors.placeholderText,
            };
            icon = userProfile?.profilePicture ? (
              <FastImage
                source={{ uri: profilePicture }}
                style={iconStyle}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <UserCircle size={iconSize} color={color} />
            );
          } else if (route.name === "Explore") {
            icon = <Binoculars size={iconSize} color={color} />;
          }

          return (
            <View
              style={[
                styles.tabIconContainer,
                focused && styles.activeTabIconContainer,
              ]}
            >
              {icon}
            </View>
          );
        },
      })}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Post" component={PostStack} />
      <Tab.Screen name="Explore" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  activeTabIconContainer: {
    borderRadius: 90,
  },
});

export default MainTabNavigator;
