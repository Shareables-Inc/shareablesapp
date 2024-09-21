import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../../utils/colors";

const { width, height } = Dimensions.get("window");

interface SkeletonProps {
  width: number;
  height: number;
  circle?: boolean;
  borderRadius?: number;
  style?: any;
}

const SkeletonUserProfile = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Skeleton width={27} height={27} />
        <Skeleton width={27} height={27} />
      </View>

      <View style={styles.profileSection}>
        <Skeleton width={width * 0.28} height={width * 0.28} circle />
        <View style={styles.detailsSection}>
          <Skeleton width={150} height={26} />
          <Skeleton width={100} height={18} style={styles.username} />
          <View style={styles.ovalsContainer}>
            <Skeleton width={100} height={30} borderRadius={8} />
            <Skeleton
              width={100}
              height={30}
              borderRadius={8}
              style={styles.secondOval}
            />
          </View>
        </View>
      </View>

      <Skeleton width={width * 0.8} height={40} style={styles.bioSkeleton} />

      <Skeleton width={150} height={22} style={styles.sectionTitle} />
      <View style={styles.galleryContainer}>
        {[...Array(3)].map((_, index) => (
          <Skeleton
            key={index}
            width={140}
            height={180}
            borderRadius={10}
            style={styles.galleryImage}
          />
        ))}
      </View>

      <Skeleton width={150} height={22} style={styles.sectionTitle} />
      <View style={styles.gridGallery}>
        {[...Array(6)].map((_, index) => (
          <Skeleton
            key={index}
            width={width * 0.44}
            height={index % 3 === 0 ? 250 : index % 3 === 1 ? 200 : 150}
            borderRadius={10}
            style={styles.gridImage}
          />
        ))}
      </View>
    </View>
  );
};

const Skeleton = ({
  width,
  height,
  circle,
  borderRadius,
  style,
}: SkeletonProps) => {
  return (
    <LinearGradient
      colors={["#f0f0f0", "#e0e0e0", "#f0f0f0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        {
          width,
          height,
          borderRadius: circle ? width / 2 : borderRadius || 4,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View style={{ flex: 1, backgroundColor: "transparent" }} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: height * 0.08,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.03,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.1,
    marginBottom: height * 0.03,
  },
  detailsSection: {
    marginLeft: width * 0.055,
  },
  username: {
    marginTop: 8,
    marginBottom: height * 0.01,
  },
  ovalsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  secondOval: {
    marginLeft: 8,
  },
  bioSkeleton: {
    alignSelf: "center",
    marginBottom: height * 0.03,
  },
  sectionTitle: {
    marginLeft: width * 0.05,
    marginBottom: 10,
  },
  galleryContainer: {
    flexDirection: "row",
    paddingLeft: width * 0.05,
    marginBottom: height * 0.03,
  },
  galleryImage: {
    marginRight: 12,
  },
  gridGallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.03,
  },
  gridImage: {
    marginBottom: 15,
  },
});

export default SkeletonUserProfile;
