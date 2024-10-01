import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import Colors from "../../utils/colors";

const { width, height } = Dimensions.get("window");

const SkeletonMain: React.FC = () => {
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
      {/* Top Oval and Notification Bell Skeleton */}
      <View style={styles.topSection}>
        <AnimatedView style={[styles.ovalSkeleton, { opacity: fadeAnim }]} />
        <AnimatedView
          style={[styles.notificationBellSkeleton, { opacity: fadeAnim }]}
        />
      </View>

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

      {/* Tab Bar Skeleton */}
      <View style={styles.tabBarSkeleton}>
        <View style={styles.tabItem}>
          <AnimatedView style={[styles.tabIconSkeleton, { opacity: fadeAnim }]} />
        </View>
        <View style={styles.tabItem}>
          <AnimatedView style={[styles.tabIconSkeleton, { opacity: fadeAnim }]} />
        </View>
        <View style={styles.tabItem}>
          <AnimatedView style={[styles.tabIconSkeleton, { opacity: fadeAnim }]} />
        </View>
        <View style={styles.tabItem}>
          <AnimatedView style={[styles.tabIconSkeleton, { opacity: fadeAnim }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    marginTop: height * 0.08,
    paddingHorizontal: width * 0.03,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, 
  },
  ovalSkeleton: {
    width: width * 0.4,
    height: 35,
    borderRadius: 20,
    backgroundColor: Colors.skeleton,
  },
  notificationBellSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.skeleton,
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
  tabBarSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: Colors.background,
    height: 80,
    width: width, 
    borderTopWidth: 1,
    borderTopColor: Colors.skeleton,
    position: "absolute",
    bottom: 0,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconSkeleton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: Colors.skeleton,
    marginBottom: 5,
  },
});

export default SkeletonMain;
