import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import Colors from "../../utils/colors";

const LoadingView: React.FC = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={Colors.highlightText} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LoadingView;
