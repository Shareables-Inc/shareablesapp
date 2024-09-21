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
  photo: string;
}

interface SinglePhotoProps {
  post: Post;
  onRePick: () => void;
}

const SinglePhotoPost: React.FC<SinglePhotoProps> = ({ post, onRePick }) => (
  <View style={styles.postCard}>
    <TouchableOpacity
      onPress={onRePick}
      style={styles.imageWrapper}
      activeOpacity={1}
    >
      <FastImage
        source={{
          uri: post.photo,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={styles.fullWidthImage}
      />
    </TouchableOpacity>
  </View>
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
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  fullWidthImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});

export default SinglePhotoPost;
