import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { RootStackParamList } from "../../types/stackParams.types";
import { Post } from "../../models/post";
import FastImage from "react-native-fast-image";

const { width, height } = Dimensions.get("window");

interface ThreePhotoScrollProps {
  post: Post;
}

const ThreePhotoScroll: React.FC<ThreePhotoScrollProps> = ({ post }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleImagePress = () => {
    navigation.navigate("ExpandedPost", { postId: post.id });
  };

  const handleProfilePress = () => {
    navigation.navigate("UserProfile", { userId: post.userId });
  };

  return (
    <View
      style={[styles.postCard, { width: width * 0.97, height: width * 1.3625 }]}
    >
      <TouchableOpacity activeOpacity={1} onPress={handleProfilePress}>
        <View style={styles.userContainer}>
          <TouchableOpacity activeOpacity={1} onPress={handleProfilePress}>
            <Image
              source={{ uri: post.profilePicture }}
              style={styles.userImage}
            />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.username} reviewed</Text>
            
            {/* Split the establishment name and location */}
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
                {post.establishmentDetails.city}, {post.establishmentDetails.country}
              </Text>
            </View>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{post.ratings.overall}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.imageContainerUnder}>
        <ScrollView
          horizontal
          pagingEnabled
          onScroll={handleScroll}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
          bounces={false}
        >
          {post.imageUrls.map((photo, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              onPress={handleImagePress}
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
          {post.imageUrls.map((_, index) => (
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
  imageContainerUnder: {
    width: width * 0.97,
    height: width * 1.2125,
    overflow: "hidden",
    borderRadius: 18,
  },
  fullWidthImage: {
    height: width * 1.2125,
    width: width * 0.97,
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

export default React.memo(ThreePhotoScroll);
