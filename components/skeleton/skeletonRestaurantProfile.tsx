import React from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import Colors from "../../utils/colors";

const { width, height } = Dimensions.get("window");

export const SkeletonRestaurantProfile = () => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const AnimatedBox = ({ style }) => (
    <View style={[styles.skeletonBox, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
            backgroundColor: "rgba(255, 255, 255, 0.3)",
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBox style={styles.image} />
      <View style={styles.content}>
        <AnimatedBox style={styles.title} />
        <AnimatedBox style={styles.subtitle} />
        <AnimatedBox style={styles.rating} />
        <AnimatedBox style={styles.button} />
        <AnimatedBox style={styles.button} />
        <View style={styles.galleryContainer}>
          <AnimatedBox style={styles.galleryItem} />
          <AnimatedBox style={styles.galleryItem} />
          <AnimatedBox style={styles.galleryItem} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skeletonBox: {
    backgroundColor: Colors.inputBackground,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: height * 0.2,
  },
  content: {
    padding: 16,
  },
  title: {
    height: 30,
    marginBottom: 8,
    width: "70%",
  },
  subtitle: {
    height: 20,
    marginBottom: 16,
    width: "50%",
  },
  rating: {
    height: 50,
    width: 50,
    borderRadius: 25,
    alignSelf: "flex-end",
    marginTop: -50,
  },
  button: {
    height: 40,
    marginBottom: 8,
    borderRadius: 20,
  },
  galleryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  galleryItem: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 12,
  },
});
