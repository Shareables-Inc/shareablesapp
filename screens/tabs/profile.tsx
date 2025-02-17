import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  Platform
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/stackParams.types";
import Colors from "../../utils/colors";
import { StatusBar } from "expo-status-bar";
import { Menu, NotepadText, SquarePen } from "lucide-react-native";
import { auth, db, storage } from "../../firebase/firebaseConfig";
import { useUserGetByUid } from "../../hooks/useUser";
import { usePostsByUser, useNumberOfPosts } from "../../hooks/usePost";
import { useUserCounts } from "../../hooks/useUserFollowing";
import SkeletonUserProfile from "../../components/skeleton/skeletonProfile";
import FastImage from "react-native-fast-image";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/auth.context";
import { Fonts } from "../../utils/fonts";
import type {Post} from "../../models/post";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.12;

const ProfileScreen = () => {
  // All hooks are called unconditionally at the top
  const userId = auth.currentUser?.uid;
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { data: userProfile, isLoading: userLoading } = useUserGetByUid(userId!);
  const {
    data: postsData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
  } = usePostsByUser(userId!);
  const postsArray: Post[] = useMemo(
    () => postsData?.pages.flatMap((page) => page.posts) ?? [],
    [postsData]
  );
  const {
    data: totalReviewCount,
    isLoading: numberLoading,
    refetch: refetchNumber,
  } = useNumberOfPosts(userId!);
  const {
    data: userCounts,
    isLoading: countsLoading,
    refetch: refetchUserCounts,
  } = useUserCounts(userId!);
  const { isFollowing, isToggling, toggleFollow } = useAuth().user
    ? { isFollowing: false, isToggling: false, toggleFollow: async () => {} }
    : { isFollowing: false, isToggling: false, toggleFollow: async () => {} };

  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isHeaderVisible, setHeaderVisible] = useState(false);
  const [updatedProfilePicture, setUpdatedProfilePicture] = useState<string | null>(null);

  // Define the scroll handler
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setHeaderVisible(offsetY > HEADER_HEIGHT);
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 20;
      if (
        layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUserCounts(),
        refetchPosts(),
        refetchNumber(),
      ]);
    } catch (error) {
      console.error("Error refreshing profile:", error);
      Alert.alert(t("general.error"), t("profile.profile.refreshError"));
    } finally {
      setRefreshing(false);
    }
  };

  const { topPosts, recentPosts } = useMemo(() => {
    if (postsArray.length === 0) return { topPosts: [] as Post[], recentPosts: [] as Post[] };
    const sortedByRating = [...postsArray].sort(
      (a, b) =>
        Number(b.ratings?.overall || 0) - Number(a.ratings?.overall || 0)
    );
    const sortedByDate = [...postsArray].sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
    return {
      topPosts: sortedByRating.slice(0, 5),
      recentPosts: sortedByDate,
    };
  }, [postsArray]);

  

  const navigateToExpandedPost = (post: Post) => {
    navigation.navigate("ExpandedPost", { postId: post.id });
  };

  const columnCount = 2;
  const columnWidth = (width * 0.89) / columnCount;
  // Explicitly type columnItems as Post[][]
  const columnItems: Post[][] = Array.from({ length: columnCount }, () => []);
  recentPosts.forEach((post, index) => {
    columnItems[index % columnCount].push(post);
  });

  const renderColumn = (items: Post[], columnIndex: number) => (
    <View style={{ flex: 1, marginHorizontal: 5 }}>
      {items.map((post, index) => {
        const isOddColumn = columnIndex % 2 !== 0;
        const imageHeight =
          isOddColumn
            ? index % 3 === 0
              ? 150
              : index % 3 === 1
              ? 200
              : 250
            : index % 3 === 0
            ? 250
            : index % 3 === 1
            ? 200
            : 150;
        return (
          <TouchableOpacity
            key={post.id}
            style={{ marginBottom: 10 }}
            onPress={() => navigateToExpandedPost(post)}
            activeOpacity={1}
          >
            <FastImage
              source={{ uri: post.imageUrls[0] }}
              style={{
                width: columnWidth,
                height: imageHeight,
                borderRadius: 10,
                marginTop: 5,
              }}
            />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.restaurantNameReview} numberOfLines={1} ellipsizeMode="tail">
                {post.establishmentDetails.name}
              </Text>
              <Text style={styles.dash}> - </Text>
              <Text style={styles.scoreReview}>{post.ratings.overall}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const uploadImage = async (uri: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert(t("general.error"), t("profile.profile.notAuthenticated"));
      return;
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profilePictures/${userId}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            console.error("Image upload error:", error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  };


  const compressImage = async (uri: string): Promise<string> => {
    try {
      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600 } }], // Resize to a maximum width of 600px
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } // Compress to 70% quality
      );
      return manipulatedImage.uri; // Return the new URI of the compressed image
    } catch (error) {
      console.error("Image compression failed:", error);
      throw error;
    }
  };
  
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6, 
    });
  
    if (!result.canceled) {
      try {
        // Compress the image before upload
        const compressedUri = await compressImage(result.assets[0].uri);
  
        // Upload the compressed image
        const downloadURL = await uploadImage(compressedUri);
        if (downloadURL) {
          setUpdatedProfilePicture(downloadURL);
        }
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, "users", userId);
          await setDoc(
            userDocRef,
            { profilePicture: downloadURL },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert(t("general.error"), t("profile.profile.imageError"));
      }
    }
  };
  

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert(t("profile.profile.cameraPermission"));
        }
      }
    })();
  }, []);


  // Instead of an early return, conditionally render the content inside the same tree
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={true}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.tags} />
      }
    >
      <StatusBar style="auto" />
      {/* If data is still loading, show the skeleton */}
      {(userLoading || countsLoading || numberLoading) ? (
        <SkeletonUserProfile />
      ) : (
        <>
          {isHeaderVisible && (
            <View style={styles.stickyHeader}>
              <Text style={styles.stickyHeaderText}>
                {`@${userProfile?.username}`}'s {t("profile.profile.profile")}
              </Text>
            </View>
          )}
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.navigate("MainSettings")}>
              <Menu color={Colors.text} size={28} />
            </TouchableOpacity>
          </View>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.detailsSection}>
              <Text style={styles.name}>
                {userProfile?.firstName} {userProfile?.lastName || ""}
              </Text>
              <Text style={styles.username}>@{userProfile?.username}</Text>
              <View style={styles.ovalsContainer}>
                <View style={styles.followerOval}>
                  <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate("FollowerList")}>
                    <Text style={styles.ovalText}>
                      {userCounts?.followerCount}{" "}
                      {userCounts?.followerCount === 1
                        ? t("profile.profile.follower")
                        : t("profile.profile.followers")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.followerOval}>
                  <Text style={styles.ovalText}>
                    {totalReviewCount ?? 0} {t("profile.profile.reviews")}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={1}
              onPress={pickImage}
            >
              <FastImage
                source={{
                  uri: updatedProfilePicture || userProfile?.profilePicture,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.profilePic}
              />
            </TouchableOpacity>
          </View>
          {/* Bio Section */}
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{userProfile?.bio || ""}</Text>
            <TouchableOpacity
              style={styles.editProfileContainer}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View style={styles.iconCircle}>
                <SquarePen size={18} color={Colors.background} />
              </View>
              <Text style={styles.editProfileText}>{t("profile.profile.editProfile")}</Text>
            </TouchableOpacity>
          </View>
          {/* Posts Section */}
          {totalReviewCount && totalReviewCount > 0 ? (
            <>
              {/* Top Picks */}
              <View style={styles.featuredGalleryContainer}>
                <Text style={styles.featuredGalleryText}>
                  {t("profile.profile.topPicks")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScrollView}
                  bounces={true}
                >
                  {topPosts.map((post) => (
                    <View style={styles.imageGalleryContainer} key={post.id}>
                      <TouchableOpacity
                        onPress={() => navigateToExpandedPost(post)}
                        activeOpacity={1}
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
                        <Text
                          style={styles.restaurantTopPicks}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {post.establishmentDetails.name}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.separator} />
              </View>
              {/* All Reviews */}
              <View style={styles.remainingReviewsContainer}>
                <Text style={styles.remainingReviewsText}>
                  {t("profile.profile.allReviews")}
                </Text>
              </View>
              {postsArray.length > 0 ? (
                <View style={styles.gridGallery}>
                  {columnItems.map((items, columnIndex) => (
                    <View key={columnIndex} style={styles.gridColumn}>
                      {renderColumn(items, columnIndex)}
                    </View>
                  ))}
                </View>
              ) : (
                <ActivityIndicator
                  size="large"
                  color={Colors.tags}
                  style={{ margin: 20 }}
                />
              )}
            </>
          ) : (
            <View style={styles.noReviewContainer}>
              <View style={styles.iconContainer}>
                <NotepadText color={Colors.noReviews} size={width * 0.08} />
              </View>
              <Text style={styles.noReviewText}>
                {t("profile.profile.noReviews")}
              </Text>
            </View>
          )}
          {isFetchingNextPage && (
            <ActivityIndicator
              size="large"
              color={Colors.tags}
              style={{ margin: 20 }}
            />
          )}
        </>
      )}
    </ScrollView>
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
    right: width * 0.07,
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  settingsIcon: {
    marginRight: width * 0.05,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: height * 0.02,
    marginTop: height * 0.135,
    paddingHorizontal: width * 0.05
  },
  profilePic: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 90,
    borderColor: Colors.profileBorder,
    borderWidth: 4,
  },
  detailsSection: {
  },
  ovalsContainer: {
    flexDirection: "row",
  },
  followerOval: {
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: width * 0.035,
    paddingVertical: height * 0.007,
    borderRadius: 7,
    marginRight: width * 0.02,
    justifyContent: "center",
  },
  ovalText: {
    color: Colors.text,
    fontSize: width * 0.036,
    fontFamily: Fonts.Regular,
  },
  name: {
    fontSize: width * 0.065,
    color: Colors.text,
    fontFamily: Fonts.Medium,
  },
  username: {
    fontSize: width * 0.045,
    color: Colors.text,
    fontFamily: Fonts.Medium,
    marginBottom: height * 0.01,
  },
  bioContainer: {
    backgroundColor: Colors.background,
    width: width * 0.93,
    alignSelf: "flex-start",
    paddingLeft: width * 0.05,
    flex: 1,
  },
  bioText: {
    fontSize: width * 0.037,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    alignSelf: "flex-start",
  },
  editProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  iconCircle: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.05,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  editProfileText: {
    fontSize: width * 0.035,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
  },  
  featuredGalleryContainer: {
    marginTop: "5%",
  },
  featuredGalleryText: {
    color: Colors.text,
    fontSize: width * 0.055,
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
    marginTop: height * 0.015,
    paddingLeft: "5%",
  },
  galleryImage: {
    width: width * 0.37,
    height: width * 0.47,
    marginRight: width * 0.03,
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
    fontSize: width * 0.055,
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
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: 90,
    marginRight: width * 0.015,
  },
  restaurantTopPicks: {
    color: Colors.highlightText,
    fontSize: width * 0.036,
    fontFamily: Fonts.Medium,
    textAlign: "left",
    flexShrink: 1,
    maxWidth: width * 0.35,
  },
  gridGallery: {
    flexDirection: "row",
    marginHorizontal: "2.5%",
    marginTop: "3%",
  },
  gridColumn: {
    flex: 1,
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
    fontSize: width * 0.055,
    position: "absolute",
    bottom: height * 0.02,
  },
  restaurantNameReview: {
    fontSize: width * 0.037,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
    maxWidth: "70%",
  },
  dash: {
    fontSize: width * 0.037,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
  },
  scoreReview: {
    fontSize: width * 0.037,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
  },
  scoreContainer: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: 90,
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
    fontSize: width * 0.037,
    color: Colors.background,
  },
  noReviewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: "30%",
    marginRight: "1%",
    paddingHorizontal: "5%",
    height: width * 0.4,
    width: width * 0.4,
    backgroundColor: Colors.noReviews,
    borderRadius: 20,
  },
  noReviewText: {
    fontSize: width * 0.055,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    textAlign: "center",
    marginTop: "10%",
  },
  iconContainer: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: 90,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileScreen;
