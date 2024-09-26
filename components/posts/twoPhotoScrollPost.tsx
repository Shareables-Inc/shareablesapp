import React, { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Colors from "../../utils/colors";
import FastImage from "react-native-fast-image";

const { width, height } = Dimensions.get("window");

interface Post {
  photos: string[];
}

interface TwoPhotoScrollProps {
  post: Post;
  onRePick: () => void;
}

const TwoPhotoScrollPost: React.FC<TwoPhotoScrollProps> = ({
  post,
  onRePick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (height * 0.35 * 0.8)); // Update to use correct width
    setCurrentIndex(index);
  };

  return (
    <View style={styles.postCard}>
      <ScrollView
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {post.photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            onPress={onRePick}
            style={styles.imageWrapper}
            activeOpacity={1}
          >
            <FastImage
              source={{
                uri: photo,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.fullWidthImage}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dotsContainer}>
        {post.photos.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    width: height * 0.35 * 0.8,
    height: height * 0.35,
    backgroundColor: Colors.background,
    alignSelf: "center",
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 1,
  },
  scrollView: {
    width: height * 0.35 * 0.8,
    height: height * 0.35,
    zIndex: 2,
  },
  contentContainer: {
    width: height * 0.35 * 0.8 * 2, // Ensure the content container width is twice the width of the scroll view
  },
  imageWrapper: {
    width: height * 0.35 * 0.8,
    height: height * 0.35,
  },
  fullWidthImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dotsContainer: {
    position: "absolute",
    bottom: height * 0.015,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  dot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: 30,
    marginHorizontal: width * 0.013,
    backgroundColor: "lightgray",
  },
  activeDot: {
    backgroundColor: Colors.background,
  },
  inactiveDot: {
    backgroundColor: Colors.scrollDots,
  },
});

export default TwoPhotoScrollPost;
