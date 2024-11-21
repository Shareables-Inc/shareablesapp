import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  TouchableWithoutFeedback,
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
import { CircleArrowLeft, CircleCheck, NotepadText, Ellipsis, UserX, CircleAlert, Send } from "lucide-react-native";
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
import { useAuth } from "../../context/auth.context";
import { sendReportToJira } from '../../helpers/userReport';
import { useIsUserBlocked, useBlockActions } from "../../hooks/useUserBlocks";



const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = 100;

const UserProfileScreen = () => {
  const { user } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "UserProfile">>();
  const { userId: postUserId } = route.params;
  const posts = usePostsByUser(postUserId);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { data: userData, isLoading: userDataLoading } = useUserGetByUid(postUserId);
  const { data: userCounts, isLoading: countsLoading, refetch: refetchUserCounts } = useUserCounts(postUserId);
  const { isFollowing, isToggling, toggleFollow } = useFollowingActions(postUserId, user!.uid);

  const [isHeaderVisible, setHeaderVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const { data: isBlocked, isLoading: isBlockedLoading } = useIsUserBlocked(user!.uid, postUserId);
  const { toggleBlock, isBlocking } = useBlockActions(user!.uid, postUserId);



  const reportOptions = [
    "Inappropriate content",
    "They are pretending to be someone else",
    "They may be under the age of 19",
    "Spam or advertising",
    "Hate speech or discrimination",
    "Harassment or bullying",
    "Sharing false information",
    "Violence or threats",
    "Privacy violation",
    "Scam or fraud",
  ];
  

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchUserCounts(), posts.refetch()]);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      await toggleFollow();
      refetchUserCounts(); 
    } catch (error) {
      console.error("Error toggling follow state:", error);
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

  const navigateToExpandedPost = (post: Post) => {
    navigation.navigate("ExpandedPost", {
      postId: post.id,
    });
  };

  const handleBlockUser = async () => {
    setBottomSheetVisible(false);
    Alert.alert(
      "Block User",
      isBlocked
        ? "Are you sure you want to unblock this user?"
        : "Are you sure you want to block this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isBlocked ? "Unblock" : "Block",
          onPress: async () => {
            try {
              if (!isBlocked) {
                // If blocking, also unfollow the user
                if (isFollowing) {
                  await toggleFollow(); // Unfollow the user
                }
              }
              await toggleBlock(); // Block or unblock the user
              Alert.alert(
                isBlocked ? "User Unblocked" : "User Blocked",
                `You have successfully ${
                  isBlocked ? "unblocked" : "blocked"
                } this user.`
              );
            } catch (error) {
              console.error("Error toggling block state:", error);
              Alert.alert("Error", "Failed to update block state. Please try again.");
            }
          },
        },
      ]
    );
  };
  
  

  const handleReportUser = () => {
    setBottomSheetVisible(false);
    setReportModalVisible(true);
  };

  const sendReport = async () => {
    if (selectedReason) {
      const reportTitle = `User Report: ${userData?.username || "Unknown User"}`;
      const reportDescription = `Report Reason: ${selectedReason}\nReported User: @${userData?.username}`;
  
      try {
        await sendReportToJira(reportTitle, reportDescription);
        Alert.alert("Report Sent", "Thank you for your report. We will review it shortly.");
        setReportModalVisible(false);
        setSelectedReason(null); // Reset selection
      } catch (error) {
        console.error("Error sending report:", error);
        Alert.alert("Error", "Failed to send report. Please try again later.");
      }
    } else {
      Alert.alert("Error", "Please select a reason for reporting.");
    }
  };
  
  

  const renderReportOptions = () => (
    reportOptions.map((option, index) => (
      <TouchableOpacity
        key={index}
        style={styles.reportOption}
        onPress={() => setSelectedReason(option)}
        activeOpacity={1}
      >
        <View style={[styles.radioCircle, selectedReason === option && styles.selectedRadio]}>
          {selectedReason === option && <View style={styles.radioInnerCircle} />}
        </View>
        <Text style={styles.reportOptionText}>{option}</Text>
      </TouchableOpacity>
    ))
  );
  
    // Custom Masonry Grid layout
    const columnCount = 2;
    const columnWidth = (width * 0.89) / columnCount;
    const columnItems = Array.from({ length: columnCount }, () => []);
  
    recentPosts.forEach((post, index) => {
      columnItems[index % columnCount].push(post);
    });

  const renderColumn = (items, columnIndex) => {
    return (
      <View style={{ flex: 1, marginHorizontal: 5 }}>
        {items.map((post, index) => {
          const isOddColumn = columnIndex % 2 !== 0;
          const imageHeight = isOddColumn
            ? (index % 3 === 0 ? 150 : index % 3 === 1 ? 200 : 250)
            : (index % 3 === 0 ? 250 : index % 3 === 1 ? 200 : 150);

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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={styles.restaurantNameReview}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
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
  };
  

  if (userDataLoading || countsLoading) {
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
        bounces={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.tags}
          />
        }
      >
        <StatusBar style="auto" />
  
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
            <CircleArrowLeft color={Colors.text} size={28} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setBottomSheetVisible(true)}
            activeOpacity={1}
          >
            <Ellipsis color={Colors.text} size={28} style={{ marginLeft: width * 0.75 }} />
          </TouchableOpacity>
        </View>
  
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.detailsSection}>
            <Text style={styles.name}>
              {userData
                ? userData.lastName
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.firstName
                : ""}
            </Text>
            <Text style={styles.username}>{`@${userData!.username}`}</Text>
            <View style={styles.ovalsContainer}>
              <View style={styles.followerOval}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() =>
                    navigation.navigate("FollowerList", { userId: postUserId })
                  }
                >
                  <Text style={styles.ovalText}>
                    {userCounts?.followerCount} Followers
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.followerOval}>
                <Text style={styles.ovalText}>{reviewCount} Reviews</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileImageContainer}>
            <FastImage
              source={{
                uri: userData?.profilePicture,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.profilePic}
            />
            {postUserId !== user!.uid && !isBlocked && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleToggleFollow}
                disabled={isToggling}
              >
                {isToggling ? (
                  <ActivityIndicator color={Colors.background} />
                ) : isFollowing ? (
                  <CircleCheck color={Colors.background} size={22} />
                ) : (
                  <Text style={styles.followButtonText}>Follow</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
  
        {/* Bio Section */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>
            {userData?.bio ? userData.bio : ""}
          </Text>
        </View>
  
        {/* Conditional Rendering for Blocked or Unblocked State */}
        {isBlocked ? (
          // Blocked State
          <View style={styles.noReviewContainer}>
            <View style={styles.iconContainer}>
              <UserX color={Colors.background} size={width * 0.08} />
            </View>
            <Text style={styles.noReviewText}>This account is blocked</Text>
          </View>
        ) : (
          // Unblocked State
          <>
            {reviewCount > 0 ? (
              <>
                {/* Top Picks */}
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
                            <Text style={styles.scoreText}>
                              {post.ratings.overall}
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
  
                {/* All Reviews */}
                <View style={styles.remainingReviewsContainer}>
                  <Text style={styles.remainingReviewsText}>All Reviews</Text>
                </View>
  
                {/* Posts Grid */}
                <View style={styles.gridGallery}>
                  {columnItems.map((items, index) => (
                    <View key={index} style={styles.gridColumn}>
                      {renderColumn(items, index)}
                    </View>
                  ))}
                </View>
              </>
            ) : (
              // No Reviews State
              <View style={styles.noReviewContainer}>
                <View style={styles.iconContainer}>
                  <NotepadText color={Colors.noReviews} size={width * 0.08} />
                </View>
                <Text style={styles.noReviewText}>No reviews yet</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Sheet for Block/Report options */}
      <Modal
        transparent
        visible={isBottomSheetVisible}
        animationType="slide"
        onRequestClose={() => setBottomSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBottomSheetVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleBlockUser}
            >
              <UserX color={Colors.text} size={20} />
              <Text style={styles.optionText}>
                {isBlocked ? "Unblock User" : "Block User"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleReportUser}
            >
              <CircleAlert color={Colors.text} size={20} />
              <Text style={styles.optionText}>Report User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>


      {/* Report Reasons Modal */}
      <Modal
        transparent
        visible={isReportModalVisible}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)} // Handles back button behavior on Android
      >
        {/* Overlay for clicking outside to dismiss */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setReportModalVisible(false)} // Closes modal on outside click
        >
          {/* Prevent closing when interacting with modal content */}
          <TouchableWithoutFeedback>
            <View style={styles.reportModal}>
              <Text style={styles.reportTitle}>Report</Text>
              <Text style={styles.reportDescription}>
                What do you want to report? (Select 1 below)
              </Text>
              <Text style={styles.reportInstruction}>
                Your report will remain anonymous. If there’s an immediate threat, please contact your local emergency services right away.
              </Text>
              {renderReportOptions()}
              <TouchableOpacity
                style={styles.sendReportButton}
                onPress={sendReport}
                activeOpacity={1}
              >
                <Send color={Colors.text} size={20} />
                <Text style={styles.sendReportButtonText}>Send Report</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

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
    left: width * 0.05,
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
  },
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
    paddingBottom: width * 0.1,
    paddingTop: width * 0.05
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    width: "65%",
    backgroundColor: Colors.inputBackground,
    borderRadius: 30,
    marginVertical: 10,
  },
  optionText: {
    color: Colors.text,
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
    marginLeft: width * 0.02,
  },
  reportModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: width * 0.15,
    paddingTop: width * 0.1,
    alignItems: "flex-start",
    paddingHorizontal: "10%"
  },
  reportTitle: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Bold,
    color: Colors.text,
    marginBottom: 15,
  },
  reportDescription: {
    fontSize: width * 0.04,
    fontFamily: Fonts.Bold,
    color: Colors.text,
    textAlign: "left",
  },
  reportInstruction: {
    fontSize: width * 0.035,
    fontFamily: Fonts.Regular,
    color: Colors.text,
    textAlign: "left",
    marginVertical: 10,
  },
  reportOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  reportOptionText: {
    fontSize: width * 0.04,
    fontFamily: Fonts.Regular,
    color: Colors.text,
    marginLeft: 10,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: {
    borderColor: Colors.tags,
  },
  radioInnerCircle: {
    height: 14,
    width: 14,
    borderRadius: 90,
    backgroundColor: Colors.tags,
  },
  sendReportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sendReportButtonText: {
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginLeft: 5,
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
  profileImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative", 
  },
  followButton: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 15,
    position: "absolute",
    bottom: -10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  followingButton: {
    backgroundColor: Colors.followed,
    borderRadius: 30,
  },
  followButtonText: {
    color: Colors.text,
    fontSize: width * 0.035,
    fontFamily: Fonts.Medium,
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
    width: width * 0.9 ,
    alignSelf: "flex-start",
    paddingLeft: width * 0.05,
    flex: 1
  },
  bioText: {
    fontSize: width * 0.037,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    alignSelf: "center",
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
  blockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  blockedText: {
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginTop: 20,
    textAlign: "center",
  },
});

export default UserProfileScreen;
