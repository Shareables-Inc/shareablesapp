import React, { useEffect } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import Colors from "../../utils/colors";

const { width, height } = Dimensions.get("window");

const ExpandedPostSkeleton = () => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
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
        <View style={styles.header}>
          <AnimatedBox style={styles.avatar} />
          <View style={styles.headerText}>
            <AnimatedBox style={styles.username} />
            <AnimatedBox style={styles.location} />
          </View>
        </View>
        <AnimatedBox style={styles.caption} />
        <AnimatedBox style={styles.caption} />
        <View style={styles.actions}>
          <AnimatedBox style={styles.actionButton} />
          <AnimatedBox style={styles.actionButton} />
          <AnimatedBox style={styles.actionButton} />
        </View>
        <View style={styles.comments}>
          <AnimatedBox style={styles.comment} />
          <AnimatedBox style={styles.comment} />
          <AnimatedBox style={styles.comment} />
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
    height: height * 0.4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  username: {
    height: 16,
    width: "40%",
    marginBottom: 4,
  },
  location: {
    height: 14,
    width: "60%",
  },
  caption: {
    height: 16,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  comments: {
    marginTop: 16,
  },
  comment: {
    height: 16,
    marginBottom: 12,
  },
});

export default ExpandedPostSkeleton;
