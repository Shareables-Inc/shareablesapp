import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import Colors from "../../utils/colors";

const { width, height } = Dimensions.get("window");

const SkeletonFeed: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const AnimatedView = Animated.createAnimatedComponent(View);

  return (
    <View style={styles.container}>

      {/* Post Card 1 */}
      <View
        style={[styles.postCard, { width: width * 0.97, height: (width * 1.2125) / 2 }]}
      >
        <View style={styles.userContainer}>
          <AnimatedView
            style={[styles.userImageSkeleton, { opacity: fadeAnim }]}
          />
          <View style={styles.userInfoSkeleton}>
            <AnimatedView
              style={[styles.userNameSkeleton, { opacity: fadeAnim }]}
            />
            <AnimatedView
              style={[styles.restaurantInfoSkeleton, { opacity: fadeAnim }]}
            />
          </View>
          <AnimatedView
            style={[styles.scoreContainerSkeleton, { opacity: fadeAnim }]}
          />
        </View>
        <AnimatedView
          style={[styles.restaurantImageSkeleton, { opacity: fadeAnim }]}
        />
      </View>

      {/* Post Card 2 */}
      <View
        style={[styles.postCard, { width: width * 0.97, height: width * 1.2125 }]}
      >
        <View style={styles.userContainer}>
          <AnimatedView
            style={[styles.userImageSkeleton, { opacity: fadeAnim }]}
          />
          <View style={styles.userInfoSkeleton}>
            <AnimatedView
              style={[styles.userNameSkeleton, { opacity: fadeAnim }]}
            />
            <AnimatedView
              style={[styles.restaurantInfoSkeleton, { opacity: fadeAnim }]}
            />
          </View>
          <AnimatedView
            style={[styles.scoreContainerSkeleton, { opacity: fadeAnim }]}
          />
        </View>
        <AnimatedView
          style={[styles.restaurantImageSkeleton, { opacity: fadeAnim }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    marginTop: "-5%"
  },
  postCard: {
    backgroundColor: Colors.background,
    alignSelf: "center",
    marginTop: "3%",
    marginBottom: "3%",
    borderRadius: 18,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: "2.5%",
  },
  userImageSkeleton: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 90,
    marginRight: width * 0.035,
    backgroundColor: Colors.skeleton,
  },
  userInfoSkeleton: {
    flex: 1,
  },
  userNameSkeleton: {
    width: "70%",
    height: 17,
    backgroundColor: Colors.skeleton,
    marginBottom: 5,
  },
  restaurantInfoSkeleton: {
    width: "90%",
    height: 15,
    backgroundColor: Colors.skeleton,
  },
  scoreContainerSkeleton: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: 90,
    backgroundColor: Colors.skeleton,
    marginRight: 10,
  },
  restaurantImageSkeleton: {
    width: "100%",
    height: "80%",
    backgroundColor: Colors.skeleton,
    borderRadius: 18,
  },
});

export default SkeletonFeed;
