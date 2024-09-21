import React from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Colors from "../utils/colors";
import FastImage from "react-native-fast-image";

const { width, height } = Dimensions.get("window");

interface Post {
  photos: string[];
}

interface TwoPhotoGridProps {
  post: Post;
  onRePick: () => void;
}

const TwoPhotoGridPost: React.FC<TwoPhotoGridProps> = ({ post, onRePick }) => (
  <TouchableOpacity
    onPress={onRePick}
    activeOpacity={1}
    style={styles.postCard}
  >
    <View style={styles.upperImagesContainer}>
      <FastImage
        source={{
          uri: post.photos[0],
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={styles.topLeftImage}
      />
      <FastImage
        source={{
          uri: post.photos[1],
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={styles.topRightImage}
      />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  postCard: {
    width: height * 0.35 * 0.8,
    height: height * 0.35,
    backgroundColor: Colors.background,
    alignSelf: "center",
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: height * 0.02,
    zIndex: 1,
  },
  upperImagesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
  },
  topLeftImage: {
    width: "42%", // Adjusted width to maintain the separation
    height: height * 0.35 * 0.5, // 4:5 aspect ratio
    resizeMode: "cover",
    borderRadius: 10,
    marginRight: "2%",
  },
  topRightImage: {
    width: "55%", // Adjusted width to maintain the separation
    height: height * 0.35 * 0.5, // 4:5 aspect ratio
    resizeMode: "cover",
    borderRadius: 10,
  },
});

export default TwoPhotoGridPost;
