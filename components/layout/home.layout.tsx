import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TabSelector from "../posts/tabSelector";
import { Bell, Navigation } from "lucide-react-native";
import Colors from "../../utils/colors";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
} from "@react-navigation/native";
import { useLocationStore } from "../../store/useLocationStore";
import { RootStackParamList } from "../../types/stackParams.types";
import useNotificationStore from "../../store/useNotificationStore";
import { Fonts } from "../../utils/fonts";
interface HomeLayoutProps {
  children: React.ReactNode;
  activeTab: "Feed" | "Discover";
  onTabChange: (tab: "Feed" | "Discover") => void;
}

const { height, width } = Dimensions.get("window");

const HomeLayout = ({ children, activeTab, onTabChange }: HomeLayoutProps) => {
  const insets = useSafeAreaInsets();
  const notificationStore = useNotificationStore();
  const notificationCount = notificationStore.notifications.length;

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const animation = useRef(
    new Animated.Value(activeTab === "Feed" ? 0 : 1)
  ).current;
  const { returnToCurrentLocation } = useLocationStore();
  const handleTabChange = useCallback(
    (tab: "Feed" | "Discover") => {
      onTabChange(tab);
      Animated.timing(animation, {
        toValue: tab === "Feed" ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    },
    [onTabChange, animation]
  );

  useEffect(() => {
    animation.setValue(activeTab === "Feed" ? 0 : 1);
  }, [activeTab, animation]);

  const handleNotificationPress = () => {
    navigation.navigate("Notifications");
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TabSelector
          activeTab={activeTab}
          onTabChange={handleTabChange}
          animation={animation}
        />
        <View style={styles.notificationContainer}>
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={[styles.iconButton]}
          >
            <Bell
              fill={Colors.background}
              color={Colors.background}
              size={24}
            />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {activeTab === "Discover" && (
            <TouchableOpacity
              onPress={returnToCurrentLocation}
              style={[styles.iconButton, styles.rightButton]}
            >
              <Navigation color={Colors.background} size={24} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View
        style={[styles.content, activeTab === "Feed" && styles.feedContent]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  iconButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: Colors.tags,
    borderRadius: 90,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: Colors.background,
    fontSize: 10,
    fontFamily: Fonts.Bold,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: width * 0.03,
  },
  content: {
    flex: 1,
  },
  feedContent: {
    paddingTop: height * 0.125,
  },
  notificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: Colors.charcoal,
    opacity: 0.8,
    marginTop: height * 0.005,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rightButton: {
    paddingHorizontal: 10,
  },
  divider: {
    width: 1, // Thickness of the divider
    backgroundColor: Colors.background, // White divider color
    marginHorizontal: 10, // Adjust to add spacing around the divider
  },
});

export default React.memo(HomeLayout);
