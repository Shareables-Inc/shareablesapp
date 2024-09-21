import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
} from "react-native";
import {
  useNavigation,
  NavigationProp,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { StatusBar } from "expo-status-bar";
import { Fonts } from "../../utils/fonts";
import { auth, db } from "../../firebase/firebaseConfig";
import { ArrowLeft, CircleCheck, Search } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";
import {
  useFollowingActions,
  useUserCounts,
} from "../../hooks/useUserFollowing";
import { useUserGetByUid } from "../../hooks/useUser";
import { usePostsByUser } from "../../hooks/usePost";
import { Post } from "../../models/post";
import { Timestamp } from "firebase/firestore";
import SkeletonUserProfile from "../../components/skeleton/skeletonProfile";
import FastImage from "react-native-fast-image";
const { width, height } = Dimensions.get("window");

const HEADER_HEIGHT = 100;

const UserProfileScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, "UserProfile">>();
  const { userId: postUserId } = route.params;

  const { user } = useAuth();
  const posts = usePostsByUser(postUserId);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Fetch user data
  const { data: userData, isLoading: userDataLoading } =
    useUserGetByUid(postUserId);

  const { topPosts, recentPosts, reviewCount } = useMemo(() => {
    if (!posts.data) return { topPosts: [], recentPosts: [], reviewCount: 0 };
    const sortedByRating = [...posts.data].sort(
      (a, b) =>
        Number(b.ratings?.overall || 0) - Number(a.ratings?.overall || 0)
    );
    const sortedByDate = [...posts.data].sort((a, b) => {
      const aTime =
        a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
      const bTime =
        b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
    return {
      topPosts: sortedByRating.slice(0, 5),
      recentPosts: sortedByDate.slice(0, 9),
      reviewCount: posts.data.length,
    };
  }, [posts]);

  const { isFollowing, isToggling, toggleFollow } = useFollowingActions(
    postUserId,
    user!.uid
  );

  const { data: userCounts, isLoading } = useUserCounts(postUserId);

  const [isHeaderVisible, setHeaderVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setHeaderVisible(offsetY > HEADER_HEIGHT);
      },
    }
  );

  const navigateToExpandedPost = (post: Post) => {
    navigation.navigate("ExpandedPost", {
      postId: post.id,
    });
  };

  const followButtonText = useMemo(() => {
    if (isToggling) return "";
    return isFollowing ? "Following" : "Follow";
  }, [isFollowing, isToggling]);

  // Loading states
  if (userDataLoading) {
    return <SkeletonUserProfile />;
  }

  return (
    <>
      {isHeaderVisible && (
        <View style={styles.stickyHeader}>
          <Text style={styles.stickyHeaderText}>
            {`@${userData!.username}`}'s Profile
          </Text>
        </View>
      )}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <StatusBar style="auto" />

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Search color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <FastImage
              source={{
                uri: userData?.profilePicture,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.profilePic}
            />
            {user!.uid !== postUserId && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={toggleFollow}
                disabled={isToggling}
              >
                {isToggling ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Text style={styles.followButtonText}>
                    {followButtonText}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.detailsSection}>
            <Text style={styles.name}>
              {`${userData!.firstName} ${userData!.lastName}`}
            </Text>
            <Text style={styles.username}>{`@${userData!.username}`}</Text>
            <View style={styles.ovalsContainer}>
              <View style={styles.followerOval}>
                <Text style={styles.ovalText}>
                  {userCounts?.followerCount || 0} Followers
                </Text>
              </View>
              <View style={styles.followerOval}>
                <Text style={styles.ovalText}>{reviewCount} Reviews</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>
            This is a placeholder bio. You can update this bio from your
            settings.
          </Text>
        </View>

        <View style={styles.featuredGalleryContainer}>
          <Text style={styles.featuredGalleryText}>Top Picks</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryScrollView}
            bounces={true}
          >
            {topPosts?.map((post, index) => (
              <View style={styles.imageGalleryContainer} key={index}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => navigateToExpandedPost(post)}
                >
                  <FastImage
                    source={{
                      uri: post.imageUrls[0],
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={styles.galleryImage}
                  />
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>{post.ratings.overall}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.profileDetails}>
                  <Text style={styles.restaurantTopPicks}>
                    {post.establishmentDetails.name}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.separator} />
        </View>

        <View style={styles.remainingReviewsContainer}>
          <Text style={styles.remainingReviewsText}>All Reviews</Text>
        </View>

        <View style={styles.gridGallery}>
          {recentPosts?.map((post, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              style={styles.gridColumn}
              onPress={() => navigateToExpandedPost(post)}
            >
              <FastImage
                source={{
                  uri: post.imageUrls[0],
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={[
                  styles.gridImage,
                  {
                    height: index % 3 === 0 ? 250 : index % 3 === 1 ? 200 : 150,
                    width: "100%",
                  },
                ]}
              />
              <Text style={styles.restaurantNameReview}>
                {post.establishmentDetails.name} -{" "}
                <Text style={styles.scoreReview}>{post.ratings.overall}</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    position: "absolute",
    top: height * 0.08,
    right: width * 0.02,
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  backIcon: {
    width: 27,
    height: 27,
    marginRight: width * 0.71,
  },
  settingsIcon: {
    width: 27,
    height: 27,
    marginRight: width * 0.05,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.03,
    marginTop: height * 0.135,
    paddingHorizontal: width * 0.1,
  },
  profileImageContainer: {
    alignItems: "center",
  },
  profilePic: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 90,
    borderColor: Colors.highlightText,
    borderWidth: 4,
  },
  followButton: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 90,
    paddingHorizontal: 15,
    paddingVertical: 5,
    position: "absolute",
    bottom: -5,
  },
  followingButton: {
    backgroundColor: Colors.followed,
  },
  followButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.Regular,
  },
  followingIcon: {
    width: 15,
    height: 15,
  },
  detailsSection: {
    marginLeft: width * 0.055,
  },
  ovalsContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  followerOval: {
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: "center",
  },
  ovalText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.Regular,
  },
  name: {
    fontSize: 26,
    color: Colors.text,
    fontFamily: Fonts.Medium,
  },
  username: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.Medium,
    marginBottom: height * 0.01,
  },
  bioContainer: {
    paddingHorizontal: width * 0.1,
    backgroundColor: Colors.background,
  },
  bioText: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    textAlign: "center",
  },
  featuredGalleryContainer: {
    marginTop: "5%",
  },
  featuredGalleryText: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.SemiBold,
    marginTop: "1%",
    marginLeft: "5%",
  },
  separator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: "40%",
    alignSelf: "center",
    opacity: 0.2,
    marginTop: "8%",
  },
  galleryScrollView: {
    marginTop: 10,
    paddingLeft: "5%",
  },
  galleryImage: {
    width: 140,
    height: 180,
    marginRight: 12,
    borderRadius: 10,
  },
  remainingReviewsContainer: {
    marginTop: "4%",
    backgroundColor: Colors.background,
    width: "100%",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 10,
  },
  remainingReviewsText: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.SemiBold,
    marginTop: "1%",
    marginLeft: "5%",
  },
  imageGalleryContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: height * 0.01,
    marginLeft: -(width * 0.05),
    width: "80%",
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 90,
    marginRight: 5,
  },
  restaurantTopPicks: {
    color: Colors.highlightText,
    fontSize: 14,
    fontFamily: Fonts.Medium,
    textAlign: "left",
  },
  gridGallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginLeft: "3%",
    marginRight: "3%",
    marginTop: "5%",
  },
  gridColumn: {
    flexDirection: "column",
    position: "relative",
    width: "48.5%",
    marginBottom: 15,
  },
  gridImage: {
    borderRadius: 10,
    resizeMode: "cover",
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: HEADER_HEIGHT,
    backgroundColor: Colors.header,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  stickyHeaderText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 22,
    position: "absolute",
    bottom: 10,
  },
  restaurantNameReview: {
    color: Colors.charcoal,
    fontSize: 15,
    fontFamily: Fonts.Medium,
    marginTop: 4,
    textAlign: "left",
    width: "80%",
  },
  scoreReview: {
    color: Colors.highlightText,
    fontSize: 15,
    fontFamily: Fonts.Medium,
  },
  scoreContainer: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: 20,
    backgroundColor: Colors.highlightText,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: width * 0.013,
    right: width * 0.045,
    opacity: 0.95,
  },
  scoreText: {
    fontFamily: Fonts.Bold,
    fontSize: 15,
    color: Colors.background,
  },
});

export default UserProfileScreen;
