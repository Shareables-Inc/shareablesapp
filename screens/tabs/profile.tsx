import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/stackParams.types";
import Colors from "../../utils/colors";
import { StatusBar } from "expo-status-bar";
import { Fonts } from "../../utils/fonts";
import { auth, db, storage } from "../../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { Menu, NotepadText, SquarePen } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";
import { usePostsByUser } from "../../hooks/usePost";
import { useUserCounts } from "../../hooks/useUserFollowing";
import { useUserGetByUid } from "../../hooks/useUser";
import { Timestamp } from "firebase/firestore";
import SkeletonUserProfile from "../../components/skeleton/skeletonProfile";
import FastImage from "react-native-fast-image";

const { width, height } = Dimensions.get("window");

const HEADER_HEIGHT = height * 0.12;

const ProfileScreen = () => {
  const userId = auth.currentUser?.uid; // Retrieve the current user's UID
  const { data: userProfile, isLoading: userLoading } = useUserGetByUid(userId!); // Fetch user profile with real-time updates
  const posts = usePostsByUser(userId!);
  const { data: userCounts, isLoading: countsLoading, refetch: refetchUserCounts } = useUserCounts(userId!);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refetch user profile data, user counts, and posts
      await Promise.all([refetchUserCounts(), posts.refetch()]);
    } catch (error) {
      console.error("Error refreshing profile:", error);
      Alert.alert("Error", "Failed to refresh profile. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };
   

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

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isHeaderVisible, setHeaderVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [updatedProfilePicture, setUpdatedProfilePicture] = useState<
    string | null
  >(null);

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

  const uploadImage = async (uri: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const downloadURL = await uploadImage(result.assets[0].uri);
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
        Alert.alert("Error", "Failed to upload image. Please try again.");
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);

  const navigateToExpandedPost = (post) => {
    navigation.navigate("ExpandedPost", {
      postId: post.id,
    });
  };

  if (posts.isLoading || !userProfile) {
    return <SkeletonUserProfile />;
  }

  // Custom Masonry Grid layout
  const columnCount = 2;
  const columnWidth = (width * 0.89) / columnCount;
  const columnItems = Array.from({ length: columnCount }, () => []);

  recentPosts.forEach((post, index) => {
    // Alternate assigning posts to different columns
    columnItems[index % columnCount].push(post as never);
  });

  const renderColumn = (items, columnIndex) => {
    return (
      <View style={{ flex: 1, marginHorizontal: 5 }}>
        {items.map((post, index) => {
          const isOddColumn = columnIndex % 2 !== 0;
          const imageHeight = isOddColumn
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
              key={index}
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
              {/* Corrected View with flexDirection: 'row' */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[styles.restaurantNameReview]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {post.establishmentDetails.name}
                </Text>
                <Text style={styles.dash}> - </Text>
                <Text style={styles.scoreReview}>{post.ratings!.overall}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (posts.isLoading || !userProfile) {
    return <SkeletonUserProfile />;
  }

  return (
    <>
      {isHeaderVisible && (
        <View style={styles.stickyHeader}>
          <Text style={styles.stickyHeaderText}>
            {userProfile.firstName}'s Profile
          </Text>
        </View>
      )}
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={true}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={Colors.tags}
          colors={[Colors.tags]}
          />
      }
    >
      <StatusBar style="auto" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate("MainSettings")}>
          <Menu color={Colors.text} size={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.detailsSection}>
          <Text style={styles.name}>
            {userProfile.firstName} {userProfile.lastName ? userProfile.lastName : ""}
          </Text>
          <Text style={styles.username}>@{userProfile.username}</Text>
          <View style={styles.ovalsContainer}>
            <View style={styles.followerOval}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => navigation.navigate("FollowerList")}
              >
              <Text style={styles.ovalText}>
                {userCounts?.followerCount}
                {userCounts?.followerCount === 1 ? " Follower" : " Followers"}
              </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.followerOval}>
              <Text style={styles.ovalText}>{reviewCount} Reviews</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={pickImage}>
          <FastImage
            source={{
              uri: updatedProfilePicture || userProfile.profilePicture,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.web,
            }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bioContainer}>
        <Text style={styles.bioText}>
          {userProfile.bio ? userProfile.bio : ""}
        </Text>
        <TouchableOpacity
          style={styles.editProfileContainer}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <View style={styles.iconCircle}>
            <SquarePen size={18} color={Colors.background} />
          </View>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>



      {reviewCount > 0 ? (
        <>
          <View style={styles.featuredGalleryContainer}>
            <Text style={styles.featuredGalleryText}>Top Picks</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScrollView}
              bounces={true}
            >
              {topPosts.map((post, index) => (
                <View style={styles.imageGalleryContainer} key={index}>
                  <TouchableOpacity
                    onPress={() => navigateToExpandedPost(post)}
                    key={index}
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
                      <Text style={styles.scoreText}>
                        {post.ratings!.overall}
                      </Text>
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

          <View style={styles.remainingReviewsContainer}>
            <Text style={styles.remainingReviewsText}>All Reviews</Text>
          </View>

          <View style={styles.gridGallery}>
            {columnItems.map((items, index) => (
              <View key={index} style={styles.gridColumn}>
                {renderColumn(items, index)}
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.noReviewContainer}>

          <View style={styles.iconContainer}>
            <NotepadText color={Colors.noReviews} size={width * 0.08}/>
          </View>

          <Text style={styles.noReviewText}>
            No reviews yet
          </Text>
        </View>
      )}
    </ScrollView>
    </>
  );
}

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
    maxWidth: "90%",
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
