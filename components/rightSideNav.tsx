import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Bell, Mail } from "lucide-react-native"; // Assuming you're using lucide-react-native for icons
import Svg, { Path } from "react-native-svg";

const RightNavIcons = () => {
  return (
    <View style={styles.rightNavContainer}>
     
    </View>
  );
};

const styles = StyleSheet.create({
  rightNavContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconButton: {
    padding: 8,
  },
});

export default RightNavIcons;
