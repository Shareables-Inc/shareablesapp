import React, { useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
} from "react-native";

interface LoadingScreenProps {
  message?: string;
  indicatorColor?: string;
  indicatorSize?: number | "small" | "large";
  containerStyle?: ViewStyle;
  messageStyle?: TextStyle;
  logoSource: any; // Source of the logo image
  logoSize?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Just a moment...",
  containerStyle,
  messageStyle,
  logoSource,
  logoSize = 100,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  const bounceInterpolation = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Image
        source={logoSource}
        style={[
          styles.logo,
          { width: logoSize, height: logoSize },
          { transform: [{ translateY: bounceInterpolation }] },
        ]}
      />

      {message && <Text style={[styles.message, messageStyle]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  logo: {
    marginBottom: 20,
  },
  indicator: {
    marginVertical: 20,
  },
  message: {
    fontSize: 18,
    color: "#333333",
  },
});

export default LoadingScreen;
