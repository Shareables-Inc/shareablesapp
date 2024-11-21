import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";

const { width, height } = Dimensions.get("window");

const TabSelector = ({ activeTab, onTabChange, animation }) => {
  // Adjust slider translation based on the width of the tabs
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.205], // Adjust the slider's movement range based on screen width
  });

  return (
    <View style={styles.tabContainer}>
      <Animated.View style={[styles.slider, { transform: [{ translateX }] }]} />
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange("Feed")}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.tabText, activeTab === "Feed" && styles.activeTabText]}
        >
          Feed
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange("Discover")}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "Discover" && styles.activeTabText,
          ]}
        >
          Map
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 30,
    padding: width * 0.02, 
    shadowColor: Colors.charcoal,
    shadowOffset: {
      width: 0,
      height: 2, 
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    opacity: 0.9,
    marginTop: height * 0.005,
  },
  slider: {
    position: "absolute",
    top: width * 0.01,
    left: width * 0.01,
    width: width * 0.21, 
    height: width * 0.08,
    backgroundColor: Colors.charcoal,
    opacity: 0.9,
    borderRadius: 30,
  },
  tab: {
    width: width * 0.2, 
    paddingVertical: width * 0.007,
    alignItems: "center",
  },
  tabText: {
    color: Colors.charcoal,
    fontSize: width * 0.04, 
    fontFamily: Fonts.SemiBold,
  },
  activeTabText: {
    color: Colors.background,
    fontSize: width * 0.04, 
    fontFamily: Fonts.SemiBold,
  },
});

export default TabSelector;
