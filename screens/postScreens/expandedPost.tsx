import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Modal from "react-native-modal";
import { StatusBar } from "expo-status-bar";
import { TextInput } from "react-native-gesture-handler";
import {
  useNavigation,
  RouteProp,
  NavigationProp,
} from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ArrowLeft,
  Heart,
  Sparkle,
  Utensils,
  X,
  HandPlatter,
} from "lucide-react-native";

import { useAuth } from "../../context/auth.context";
import { RootStackParamList } from "../../types/stackParams.types";
import FastImage from "react-native-fast-image";
import { usePostById } from "../../hooks/usePost";
import {
  useGetUserLikes,
  useRemoveLike,
  useToggleLike,
} from "../../hooks/useLikes";
import ExpandedPostSkeleton from "../../components/skeleton/expandedPostSkeleton";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.13;

type ExpandedPostScreenRouteProp = RouteProp<
  RootStackParamList,
  "ExpandedPost"
>;

type ExpandedPostScreenProps = {
  route: ExpandedPostScreenRouteProp;
};

const ExpandedPostScreen = ({ route }: ExpandedPostScreenProps) => {
  const { user, userProfile } = useAuth();
  const { postId } = route.params as { postId: string };
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { data: expandedPost, isLoading, refetch } = usePostById(postId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const {
    data: userLikes,
    isLoading: isUserLikesLoading,
    refetch: refetchUserLikes,
  } = useGetUserLikes(user!.uid);
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: removeLike } = useRemoveLike();

  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  const { data: postData } = usePostById(postId);
  const [realTimeLikeCount, setRealTimeLikeCount] = useState(0);

  const [optimisticLikeCount, setOptimisticLikeCount] = useState(0);
  const [optimisticIsLiked, setOptimisticIsLiked] = useState(false);

  useEffect(() => {
    if (postData) {
      setOptimisticLikeCount(postData.likeCount);
    }
  }, [postData]);

  useEffect(() => {
    if (userLikes) {
      setOptimisticIsLiked(userLikes.some((like) => like.postId === postId));
    }
  }, [userLikes, postId]);

  useEffect(() => {
    if (postId) {
      const postRef = doc(db, "posts", postId);
      const unsubscribe = onSnapshot(postRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const postData = docSnapshot.data();
          setRealTimeLikeCount(postData.likeCount || 0);
        }
      });

      // Cleanup function
      return () => unsubscribe();
    }
  }, [postId]);

  const handleLike = async () => {
    const newIsLiked = !optimisticIsLiked;

    // Optimistically update UI
    setOptimisticIsLiked(newIsLiked);

    if (user) {
      if (newIsLiked) {
        toggleLike(
          { postId: postId, userId: user.uid },
          {
            onError: () => {
              // Revert optimistic update on error
              setOptimisticIsLiked(!newIsLiked);
            },
          }
        );
      } else {
        removeLike(
          { postId: postId, userId: user.uid },
          {
            onError: () => {
              // Revert optimistic update on error
              setOptimisticIsLiked(!newIsLiked);
            },
          }
        );
      }
    }
  };

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { x: any } };
  }) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(currentIndex);
  };

  const [isHeaderVisible, setHeaderVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleScrollHeader = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setHeaderVisible(offsetY > HEADER_HEIGHT + 200);
      },
    }
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const openRestaurantProfile = () => {
    if (expandedPost?.establishmentDetails.id) {
      navigation.navigate("RestaurantProfile", {
        establishmentId: expandedPost?.establishmentDetails.id,
      });
    }
  };

  const [fullscreenImageVisible, setFullscreenImageVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fullScreenOpacity = useRef(new Animated.Value(0)).current;

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const handleMapRestaurantCard = (establishmentId: string) => {};

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 2,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.moveY > 300) {
          closeFullscreenImage();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const openFullscreenImage = (imageSource: string) => {
    setSelectedImage(imageSource);
    setImageViewerOpen(true);
    setFullscreenImageVisible(true);
    Animated.timing(fullScreenOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFullscreenImage = () => {
    Animated.timing(fullScreenOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setFullscreenImageVisible(false);
      setImageViewerOpen(false);
      pan.setValue({ x: 0, y: 0 });
    });
  };

  useEffect(() => {
    const fetchComments = async () => {
      const q = query(
        collection(db, "comments"),
        where("postId", "==", postId),
        orderBy("postId", "asc"),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const commentsData: any[] = [];
        querySnapshot.forEach((doc) => {
          commentsData.push(doc.data());
        });
        setComments(commentsData);
      });

      return () => unsubscribe();
    };

    fetchComments();
  }, [postId]);

  const getDaysAgo = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) {
      return "Just now"; // Fallback if timestamp is not yet set or not a Firestore Timestamp
    }

    const now = new Date();
    const commentDate = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
    const diffTime = Math.abs(now.getTime() - commentDate.getTime());

    // Check if the comment is within the last 10 minutes (600,000 milliseconds)
    const tenMinutes = 1000 * 60 * 10;
    if (diffTime < tenMinutes) {
      return "now";
    }

    // Check if the comment is within the last 24 hours (86,400,000 milliseconds)
    const oneDay = 1000 * 60 * 60 * 24;
    if (diffTime < oneDay) {
      return "today";
    }

    // Calculate the number of days ago
    const diffDays = Math.floor(diffTime / oneDay);
    return diffDays + "d"; // Show number of days followed by "d"
  };

  const handleAddComment = async () => {
    try {
      if (comment.trim() === "") {
        // Prevent adding empty comments
        return;
      }

      if (user?.uid && postId) {
        const commentData = {
          postId: postId,
          userId: user.uid,
          userName: userProfile!.username,
          userProfilePicture: userProfile!.profilePicture,
          comment: comment.trim(),
          createdAt: serverTimestamp(), // Use Firestore serverTimestamp()
        };

        await addDoc(collection(db, "comments"), commentData);
        setComments([...comments, commentData]);
        setComment(""); // Clear the input after adding the comment
      } else {
        console.error("Post ID or currentUser is undefined");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <>
      {isHeaderVisible && (
        <View style={styles.stickyHeader}>
          <Text style={styles.stickyHeaderText}>
            {expandedPost?.username}'s Review
          </Text>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: Colors.background }}
      >
        <StatusBar style="auto" />

        <Modal
          isVisible={fullscreenImageVisible}
          backdropOpacity={1}
          onBackdropPress={closeFullscreenImage}
          onBackButtonPress={closeFullscreenImage}
          style={styles.fullscreenModal}
        >
          <View style={styles.fullscreenContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeFullscreenImage}
              activeOpacity={1}
            >
              <X style={styles.closeIcon} color={Colors.background} size={30} />
            </TouchableOpacity>
            <ScrollView
              horizontal
              pagingEnabled
              onScroll={(e) => {
                const newIndex = Math.floor(
                  e.nativeEvent.contentOffset.x / width
                );
                setCurrentIndex(newIndex);
              }}
              showsHorizontalScrollIndicator={false}
            >
              {expandedPost?.imageUrls.map((imageUrl, index) => (
                <Animated.View
                  key={index}
                  {...panResponder.panHandlers}
                  style={[
                    styles.fullscreenImageContainer,
                    { transform: [{ translateY: pan.y }] },
                  ]}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.fullscreenImage}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        </Modal>

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onScroll={handleScrollHeader}
          scrollEventThrottle={16}
        >
          <View style={styles.imagesAndDotsContainer}>
            <View style={styles.topIconContainer}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.iconWrapper}
                activeOpacity={0.8}
              >
                <ArrowLeft color={Colors.text} size={25} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              onScroll={handleScroll}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleScroll}
              bounces={false}
            >
              {expandedPost?.imageUrls.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={1}
                  onPress={() => openFullscreenImage(imageUrl)}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.fullWidthImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.dotsContainer}>
              {expandedPost?.imageUrls.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentIndex === index
                      ? styles.activeDot
                      : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.restaurantInfo}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openRestaurantProfile}
              >
                <Text style={styles.restaurantName}>
                  {expandedPost?.establishmentDetails.name}
                </Text>
              </TouchableOpacity>
              <Text style={styles.restaurantAddress}>
                {expandedPost?.establishmentDetails.city},{" "}
                {expandedPost?.establishmentDetails.country}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.likeButtonContainer}
                activeOpacity={0.8}
                onPress={handleLike}
              >
                <View style={styles.heartContainer}>
                  <Heart
                    size={24}
                    color={
                      optimisticIsLiked ? Colors.highlightText : Colors.text
                    }
                  />
                </View>
                <Text style={styles.likeCount}>{realTimeLikeCount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.lineSeparatorHeader} />

          <View style={styles.userInfoContainer}>
            <View style={styles.userImageAndTags}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() =>
                  navigation.navigate("UserProfile", {
                    userId: expandedPost?.userId || "",
                  })
                }
              >
                <FastImage
                  source={{
                    uri: expandedPost?.profilePicture,
                    priority: FastImage.priority.normal,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  style={styles.userImage}
                />
              </TouchableOpacity>

              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>
                  {expandedPost?.username}'s Review
                </Text>
                <Text style={styles.overallRating}>
                  Overall Score: {expandedPost?.ratings.overall}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.reviewContainer}>
            <Text style={styles.reviewText}>{expandedPost?.review}</Text>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.ratingItem}>
              <View style={styles.ratingType}>
                <Sparkle color={Colors.text} size={26} />
                <Text
                  style={[
                    styles.ratingScore,
                    {
                      color:
                        (expandedPost?.ratings?.ambiance ?? 0) > 7
                          ? Colors.highlightText
                          : Colors.text,
                    },
                  ]}
                >
                  {expandedPost?.ratings.ambiance + ".0"}
                </Text>
              </View>
            </View>
            <View style={styles.ratingItem}>
              <View style={styles.ratingType}>
                <Utensils color={Colors.text} size={26} />
                <Text
                  style={[
                    styles.ratingScore,
                    {
                      color:
                        (expandedPost?.ratings?.foodQuality ?? 0) > 7
                          ? Colors.highlightText
                          : Colors.text,
                    },
                  ]}
                >
                  {(expandedPost?.ratings?.foodQuality ?? 0) + ".0"}
                </Text>
              </View>
            </View>
            <View style={styles.ratingItem}>
              <View style={styles.ratingType}>
                <HandPlatter color={Colors.text} size={26} />
                <Text
                  style={[
                    styles.ratingScore,
                    {
                      color:
                        (expandedPost?.ratings?.service ?? 0) > 7
                          ? Colors.highlightText
                          : Colors.text,
                    },
                  ]}
                >
                  {expandedPost?.ratings.service + ".0"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {expandedPost?.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.lineSeparator} />

          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
            </View>

            {comments.map((comment, index) => (
              <View key={index} style={styles.commentContainer}>
                <Image
                  source={{ uri: comment.userProfilePicture }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentDetails}>
                  <Text style={styles.commentUsername}>
                    @{comment.userName}{" "}
                    <Text style={styles.timestampText}>
                      {comment.createdAt
                        ? getDaysAgo(comment.createdAt)
                        : "now"}
                    </Text>
                  </Text>
                  <Text style={styles.commentText}>{comment.comment}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.lineSeparatorBottom} />

        <View style={styles.addCommentContainer}>
          <Image
            source={{
              uri: userProfile?.profilePicture || "fallback_image_url",
            }}
            style={styles.addCommentAvatar}
          />
          <TextInput
            style={styles.addCommentInput}
            placeholder="add a comment..."
            placeholderTextColor={Colors.placeholderText}
            value={comment}
            onChangeText={setComment}
            onSubmitEditing={handleAddComment}
          />
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  locationIcon: {
    width: width * 0.06,
    height: width * 0.06,
    marginRight: width * 0.02,
    marginBottom: height * 0.02,
    resizeMode: "contain",
  },
  topIconContainer: {
    position: "absolute",
    left: width * 0.08,
    top: height * 0.08,
    zIndex: 10,
  },
  iconWrapper: {
    width: width * 0.08,
    height: width * 0.08,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 90,
  },
  imagesAndDotsContainer: {
    position: "relative",
    height: height * 0.35,
  },
  fullWidthImage: {
    height: height * 0.35,
    width: width,
    resizeMode: "cover",
  },
  dotsContainer: {
    position: "absolute",
    bottom: height * 0.015,
    left: width * 0,
    right: width * 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: 90,
    marginHorizontal: width * 0.013,
    backgroundColor: "lightgray",
  },
  activeDot: {
    backgroundColor: Colors.background,
  },
  inactiveDot: {
    backgroundColor: Colors.scrollDots,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    backgroundColor: Colors.background,
    flex: 1,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
    color: Colors.highlightText,
    marginBottom: height * 0.005,
  },
  restaurantAddress: {
    fontSize: width * 0.038,
    color: Colors.text,
    fontFamily: Fonts.Regular,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 90,
  },
  heartContainer: {
    marginRight: width * 0.02,
  },
  likeCount: {
    fontSize: width * 0.035,
    color: Colors.text,
    fontFamily: Fonts.Medium,
  },
  lineSeparatorHeader: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    marginBottom: height * 0.015,
    width: "90%",
    alignSelf: "center",
    opacity: 0.2,
  },
  lineSeparator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    marginBottom: height * 0.015,
    marginTop: height * 0.03,
    width: "90%",
    alignSelf: "center",
    opacity: 0.2,
  },
  userInfoContainer: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.015,
    paddingTop: height * 0.01,
    backgroundColor: Colors.background,
    flex: 1,
  },
  userImageAndTags: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  userImage: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: 90,
    marginRight: width * 0.04,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: width * 0.05,
    alignItems: "center",
    flex: 1,
  },
  tag: {
    backgroundColor: Colors.tags,
    opacity: 0.65,
    borderRadius: 10,
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.035,
    marginRight: width * 0.02,
  },
  tagText: {
    fontSize: width * 0.035,
    color: Colors.background,
    fontFamily: Fonts.SemiBold,
  },
  userNameContainer: {
    marginTop: height * 0.01,
    alignItems: "center",
  },
  userName: {
    fontSize: width * 0.045,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
  },
  overallRating: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    alignSelf: "flex-start",
  },
  reviewContainer: {
    paddingHorizontal: "5%",
    paddingBottom: "5%",
    backgroundColor: Colors.background,
  },
  reviewText: {
    fontSize: width * 0.043,
    color: Colors.text,
    lineHeight: height * 0.03,
    fontFamily: Fonts.Regular,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.01,
    width: width * 0.65,
    paddingLeft: width * 0.05,
  },
  ratingItem: {
    alignItems: "center",
    marginBottom: height * 0.01,
  },
  ratingType: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingScore: {
    fontSize: width * 0.045,
    fontFamily: Fonts.Bold,
    color: Colors.text,
    marginLeft: width * 0.02,
  },
  commentsSection: {
    backgroundColor: Colors.background,
    paddingBottom: height * 0.01,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.01,
    backgroundColor: Colors.background,
  },
  commentsTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
  },
  commentContainer: {
    flexDirection: "row",
    paddingHorizontal: "5%",
    marginTop: "5%",
    alignItems: "flex-start",
    width: "100%",
  },
  commentUserContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentAvatar: {
    width: width * 0.085,
    height: width * 0.085,
    borderRadius: 90,
  },
  commentUsername: {
    color: Colors.text,
    fontSize: width * 0.035,
    fontFamily: Fonts.Medium,
    marginRight: width * 0.01,
  },
  timestampText: {
    fontSize: width * 0.03,
    color: Colors.placeholderText,
    fontFamily: Fonts.Regular,
  },
  commentDetails: {
    flex: 1,
    marginLeft: width * 0.03,
  },
  commentTextContainer: {
    marginLeft: width * 0.05,
    paddingRight: width * 0.05,
    flex: 1,
    justifyContent: "center",
  },
  commentText: {
    fontSize: width * 0.038,
    color: Colors.text,
    lineHeight: height * 0.02,
    fontFamily: Fonts.Regular,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: "2%",
    marginTop: "1%",
    marginLeft: "5%",
    marginRight: "5%",
    backgroundColor: Colors.background,
  },
  addCommentAvatar: {
    width: width * 0.115,
    height: width * 0.115,
    borderRadius: 90,
    marginRight: width * 0.035,
    borderColor: Colors.profileBorder,
    borderWidth: 1,
  },
  addCommentInput: {
    flex: 0.95,
    fontSize: width * 0.04,
    fontFamily: Fonts.Medium,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    height: height * 0.045,
    paddingLeft: width * 0.035,
    alignSelf: "center",
  },
  stickyHeader: {
    position: "absolute",
    top: height * 0,
    width: "100%",
    height: HEADER_HEIGHT,
    backgroundColor: Colors.header,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  stickyHeaderText: {
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.05,
    position: "absolute",
    bottom: height * 0.025,
  },
  stickyHeaderSubText: {
    fontFamily: Fonts.Regular,
    color: Colors.highlightText,
    fontSize: width * 0.04,
    position: "absolute",
    bottom: height * 0.012,
  },
  lineSeparatorBottom: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    marginBottom: height * 0.006,
    width: "100%",
    alignSelf: "center",
    opacity: 0.2,
  },
  heartIcon: {
    width: width * 0.045,
    height: width * 0.045,
    resizeMode: "contain",
    justifyContent: "center",
    marginRight: width * 0.015,
  },
  fullscreenModal: {
    margin: width * 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImageContainer: {
    width: width, // Full screen width
    height: height, // Full screen height
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: width,
    height: height,
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: height * 0.1,
    left: width * 0.06,
    height: width * 0.1,
    width: width * 0.1,
    borderRadius: 90,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    alignSelf: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  activeButton: {
    tintColor: Colors.highlightText,
  },
  inactiveButton: {
    tintColor: Colors.text,
  },
});

export default ExpandedPostScreen;
