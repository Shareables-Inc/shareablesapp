import React from "react";
import {
  View,
  Image,
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

interface ThreePhotoGridProps {
  post: Post;
  onRePick: () => void;
}

const ThreePhotoGridPost: React.FC<ThreePhotoGridProps> = ({
  post,
  onRePick,
}) => (
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
        <FastImage
          source={{
            uri: post.photos[2],
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.largeBottomImage}
        />
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
    zIndex: 1,
  },
  upperImagesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
  },
  topLeftImage: {
    width: "42.5%", // Adjusted width to maintain the separation
    height: height * 0.35 * 0.47, // 4:5 aspect ratio
    resizeMode: "cover",
    borderRadius: 10,
    marginRight: "2%",
  },
  topRightImage: {
    width: "55.5%", // Adjusted width to maintain the separation
    height: height * 0.35 * 0.47, // 4:5 aspect ratio
    resizeMode: "cover",
    borderRadius: 10,
  },
  largeBottomImage: {
    width: "100%",
    height: height * 0.35 * 0.53, // Remaining height
    resizeMode: "cover",
    borderRadius: 10,
    marginTop: "2%",
  },
});

export default ThreePhotoGridPost;
