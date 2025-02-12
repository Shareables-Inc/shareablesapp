import React, { useTransition } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { Post } from "../../models/post";
import { RootStackParamList } from "../../types/stackParams.types";
import FastImage from "react-native-fast-image";
import { useAuth } from "../../context/auth.context";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

interface TwoPhotoGridProps {
  post: Post;
}

const TwoPhotoGrid: React.FC<TwoPhotoGridProps> = ({ post }) => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();

  const handleImagePress = () => {
    navigation.navigate("ExpandedPost", { postId: post.id });
  };

  const handleProfilePress = () => {
    if (post.userId === user!.uid) {
      // If it's the current user's profile, switch to the profile tab
      navigation.navigate("Profile"); // This should match the name of your Profile tab in the navigation stack
    } else {
      // Navigate to the user's profile screen
      navigation.navigate("UserProfile", { userId: post.userId });
    }
  };

  return (
    <View
      style={[styles.postCard, { width: width * 0.97, height: width * 0.635 }]}
    >
      <TouchableOpacity activeOpacity={1} onPress={handleProfilePress}>
        <View style={styles.userContainer}>
          <FastImage
            source={{
              uri: post.profilePicture,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.userImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.username} {t("feed.feed.reviewed")}</Text>

            {/* Split the restaurant name and location */}
            <View style={styles.locationContainer}>
              <Text
                style={styles.restaurantName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {post.establishmentDetails.name}
              </Text>
              <Text style={styles.pipe}> | </Text>
              <Text style={styles.locationInfo}>
                {post.establishmentDetails.city},{" "}
                {post.establishmentDetails.country}
              </Text>
            </View>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{post.ratings.overall}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleImagePress}
        style={styles.upperImagesContainer}
      >
        <FastImage
          source={{
            uri: post.imageUrls[0],
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.topLeftImage}
        />
        <FastImage
          source={{
            uri: post.imageUrls[1],
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.topRightImage}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: Colors.background,
    alignSelf: "center",
    position: "relative",
    marginTop: height * 0.015,
    marginBottom: height * 0.015,
    borderRadius: 18,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: "2.5%",
  },
  userImage: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 90,
    marginRight: width * 0.035,
    borderColor: Colors.profileBorder,
    borderWidth: 0.75
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: Colors.text,
    fontFamily: Fonts.Medium,
    fontSize: width * 0.045,
  },
  locationContainer: {
    flexDirection: "row", 
    alignItems: "center",
  },
  restaurantName: {
    fontFamily: Fonts.Regular,
    fontSize: width * 0.035,
    color: Colors.text,
    flexShrink: 1, 
    maxWidth: width * 0.39, 
  },
  locationInfo: {
    fontFamily: Fonts.Regular,
    fontSize: width * 0.035,
    color: Colors.text,
  },
  pipe: {
    color: Colors.charcoal,
  },
  scoreContainer: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: 90,
    backgroundColor: Colors.highlightText,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontFamily: Fonts.Bold,
    fontSize: width * 0.04,
    color: Colors.background,
  },
  upperImagesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
  },
  topLeftImage: {
    width: "42.5%",
    height: width * 0.485,
    resizeMode: "cover",
    borderRadius: 18,
    marginRight: "2%",
  },
  topRightImage: {
    width: "55.5%",
    height: width * 0.485,
    resizeMode: "cover",
    borderRadius: 18,
  },
});

export default TwoPhotoGrid;
