import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next"; // Import translation hook
import FastImage from "react-native-fast-image";
import { doc, onSnapshot } from "firebase/firestore";

import { Binoculars, Home, CirclePlus, UserCircle } from "lucide-react-native";
import Colors from "../utils/colors";
import { Fonts } from "../utils/fonts";
import { auth, db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/auth.context";

import PostStack from "../navigation/postStack";
import ProfileStack from "../navigation/profileStack";
import HomeStack from "./homeStack";
import SearchScreen from "../screens/tabs/explore";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { t } = useTranslation(); // Translation hook
  const { userProfile } = useAuth();
  const [profilePicture, setProfilePicture] = useState(
    userProfile?.profilePicture || ""
  );

  useEffect(() => {
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
        tabBarActiveTintColor: Colors.tags,
        tabBarInactiveTintColor: Colors.placeholderText,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: Fonts.Light,
          fontSize: 11,
          marginTop: 3,
        },
        tabBarStyle: { backgroundColor: Colors.background },
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          let iconSize = size;
          let iconStyle = {};

          if (route.name === t("tabNavigator.home")) {
            icon = <Home size={iconSize} color={color} />;
          } else if (route.name === t("tabNavigator.post")) {
            icon = <CirclePlus size={iconSize} color={color} />;
          } else if (route.name === t("tabNavigator.profile")) {
            iconSize = 27;
            iconStyle = {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
              borderWidth: 2,
              borderColor: focused
                ? Colors.tags
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
          } else if (route.name === t("tabNavigator.explore")) {
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
      initialRouteName={t("tabNavigator.home")} // Use translated name
    >
      <Tab.Screen name={t("tabNavigator.home")} component={HomeStack} />
      <Tab.Screen name={t("tabNavigator.post")} component={PostStack} />
      <Tab.Screen name={t("tabNavigator.explore")} component={SearchScreen} />
      <Tab.Screen name={t("tabNavigator.profile")} component={ProfileStack} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  activeTabIconContainer: {
    borderRadius: 90,
  },
});

export default MainTabNavigator;
