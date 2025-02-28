import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { TextInput } from "react-native-gesture-handler";
import { useAuth } from "../../context/auth.context";
import { useEditPost } from "../../hooks/usePost";
import {
  Sparkle,
  Utensils,
  HandPlatter,
  Info,
  CircleArrowLeft,
  Salad,
  WheatOff,
  LeafyGreen,
} from "lucide-react-native";
import { PostService } from "../../services/post.service";
import { useTranslation } from "react-i18next";
import ViewShot from "react-native-view-shot";
import StoryLayout from "../../components/sharing/storyLayout";
import Share from "react-native-share";
import { FontAwesome } from "@expo/vector-icons";
// NEW: Import the establishment service
import { EstablishmentService } from "../../services/establishment.service";

const { width, height } = Dimensions.get("window");

interface ReviewScreenProps {
  route: {
    params: {
      restaurantName: string;
      city: string;
      country: string;
      tags: any;
      postId: string;
      establishmentId: string;
      isEditing?: boolean;
      review?: string;
      ratings?: {
        ambiance?: number;
        foodQuality?: number;
        service?: number;
        overall?: number;
      };
      imageUrls: string;
      isNewEstablishment?: boolean; // NEW flag
    };
  };
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ route }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const postService = new PostService();
  const {
    restaurantName,
    city,
    country,
    tags,
    postId: initialPostId,
    establishmentId,
    isEditing = false,
    review: initialReview = "",
    ratings = {},
    imageUrls,
    isNewEstablishment, // Extract the flag here
  } = route.params;
  const navigation = useNavigation();
  const { mutate: editPost } = useEditPost();

  // Reference for ViewShot component
  const viewShotRef = useRef<any>(null);

  // State variables
  const [review, setReview] = useState<string>(initialReview);
  const [ratingAmbiance, setRatingAmbiance] = useState<number>(
    ratings.ambiance || 0
  );
  const [ratingFoodQuality, setRatingFoodQuality] = useState<number>(
    ratings.foodQuality || 0
  );
  const [ratingService, setRatingService] = useState<number>(
    ratings.service || 0
  );
  const [overallRating, setOverallRating] = useState<number>(
    ratings.overall || 0
  );
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Accessibility ratings state
  const [isHalal, setIsHalal] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isVeg, setIsVeg] = useState(false);

  const toggleInfoModal = () => setInfoModalVisible(!infoModalVisible);

  const handleReviewChange = (text: string) => {
    setReview(text);
  };

  /** Helper to compute overall rating as a number */
  const calculateOverallRating = (
    ambiance: number,
    foodQuality: number,
    service: number
  ): number => {
    return parseFloat(((ambiance + foodQuality + service) / 3).toFixed(1));
  };

  /** Handle changes in ambiance, food, or service rating. */
  const handleRatingChange = (field: string, value: number) => {
    if (field === "ambiance") setRatingAmbiance(value);
    if (field === "foodQuality") setRatingFoodQuality(value);
    if (field === "service") setRatingService(value);

    const newOverall = calculateOverallRating(
      field === "ambiance" ? value : ratingAmbiance,
      field === "foodQuality" ? value : ratingFoodQuality,
      field === "service" ? value : ratingService
    );
    setOverallRating(newOverall);
  };

  /** Toggle the accessibility tags (halal, gluten-free, etc.) */
  const handleAccessibilityToggle = (type: string) => {
    if (type === "halal") setIsHalal(!isHalal);
    if (type === "glutenfree") setIsGlutenFree(!isGlutenFree);
    if (type === "veg") setIsVeg(!isVeg);
  };

  // NEW: Minimal helper to update cumulative ratings using numbers
  const updateEstablishmentCumulativeRating = async (
    establishmentId: string,
    newPostRating: number
  ) => {
    const establishmentService = new EstablishmentService();
    try {
      const estData = await establishmentService.getEstablishmentById(establishmentId);
      const prevTotal =
        typeof estData.totalRating === "string"
          ? Number(estData.totalRating)
          : estData.totalRating || 0;
      let prevCount =
        typeof estData.postCount === "string"
          ? Number(estData.postCount)
          : estData.postCount || 0;
      // If the establishment is new but cached as having a count of 1 with 0 total,
      // adjust the count to 0 so that the first post is counted only once.
      if (prevCount === 1 && prevTotal === 0) {
        prevCount = 0;
      }
      const newTotal = prevTotal + newPostRating;
      const newCount = prevCount + 1;
      const newAverage = (newTotal / newCount).toFixed(1);
      await establishmentService.updateEstablishment(establishmentId, {
        totalRating: newTotal.toString(),
        postCount: newCount,
        averageRating: newAverage.toString(),
      });
      console.log("Establishment ratings updated:", { newTotal, newCount, newAverage });
    } catch (error) {
      console.error("Failed to update cumulative rating:", error);
    }
  };
  

  /** Submit the post or update. */
  const handlePost = async () => {
    if (!review.trim()) {
      Alert.alert(
        t("post.postReview.incompleteReview"),
        t("post.postReview.incompleteReviewMessage")
      );
      return;
    }

    if (ratingAmbiance === 0 || ratingFoodQuality === 0 || ratingService === 0) {
      Alert.alert(
        t("post.postReview.incompleteRatings"),
        t("post.postReview.incompleteRatingsMessage")
      );
      return;
    }

    // Calculate the overall rating as a number.
    const overallRatingCalculated = calculateOverallRating(
      ratingAmbiance,
      ratingFoodQuality,
      ratingService
    );

    try {
      // Update the post.
      editPost(
        {
          id: initialPostId,
          data: {
            review,
            tags,
            ratings: {
              ambiance: ratingAmbiance,
              foodQuality: ratingFoodQuality,
              service: ratingService,
              overall: overallRatingCalculated.toString(), // stored as string if required
            },
            accessibility: {
              halal: isHalal,
              glutenFree: isGlutenFree,
              veg: isVeg,
            },
          },
          establishmentId,
        },
        {
          onSuccess: async () => {
            await updateEstablishmentCumulativeRating(establishmentId, overallRatingCalculated);
            setShareModalVisible(true);
          },
          onError: (error) => {
            console.error("Error in handlePost:", error);
            Alert.alert(
              t("post.postReview.postError"),
              t("post.postReview.postErrorMessage")
            );
          },
        }
      );
    } catch (error) {
      console.error("Error in handlePost:", error);
      Alert.alert(
        t("post.postReview.postError"),
        t("post.postReview.postErrorMessage")
      );
    }
  };

  /** Capture screenshot and share to Instagram Stories. */
  const shareToInstagramStories = async () => {
    try {
      const capturedImage = await viewShotRef.current.capture();
      const base64Image = `data:image/png;base64,${capturedImage}`;
      const shareOptions = {
        social: Share.Social.INSTAGRAM_STORIES,
        method: (Share as any).InstagramStories?.SHARE_BACKGROUND_IMAGE,
        backgroundImage: base64Image,
        appId: "com.shareablesinc.shareables",
      } as any;
      await Share.shareSingle(shareOptions);
    } catch (error) {
      console.error("Error sharing to Instagram Stories:", error);
      Alert.alert("Sharing Error", "Could not share to Instagram Stories.");
    } finally {
      navigation.navigate("MainTabNavigator", { screen: "Home" });
    }
  };

  const handleDontShare = () => {
    navigation.navigate("MainTabNavigator", { screen: "Home" });
  };

  /** If user discards, delete the post and go back. */
  const handleBackPress = useCallback(() => {
    Alert.alert(
      t("post.postReview.discardPost"),
      t("post.postReview.discardPostMessage"),
      [
        { text: t("general.cancel"), style: "cancel" },
        {
          text: t("post.postReview.discard"),
          onPress: async () => {
            try {
              await postService.deletePost(initialPostId);
              console.log("Post deleted successfully");
              navigation.navigate("MainTabNavigator", { screen: "Post" });
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert(t("general.error"), t("post.postReview.discardError"));
            }
          },
        },
      ]
    );
  }, [initialPostId, postService, navigation, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/** Hidden view for capturing the full-size StoryLayout */}
      <View style={{ position: "absolute", top: -9999 }}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 0.9, result: "base64" }}
        >
          <StoryLayout
            imageUrl={imageUrls}
            restaurantName={restaurantName}
            ratingAmbiance={ratingAmbiance}
            ratingFoodQuality={ratingFoodQuality}
            ratingService={ratingService}
            isPreview={false}
          />
        </ViewShot>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBackPress} activeOpacity={1}>
              <CircleArrowLeft color={Colors.text} size={28} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePost} style={styles.postButton}>
              <Text style={styles.postButtonText}>
                {isEditing ? t("post.postReview.update") : t("post.postReview.post")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.reviewInputContainer}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
              <Text style={styles.restaurantInfo}>
                {restaurantName} | {city}, {country}
              </Text>
              <TextInput
                placeholder={t("post.postReview.review")}
                style={styles.reviewInput}
                multiline
                placeholderTextColor={Colors.placeholderText}
                value={review}
                onChangeText={handleReviewChange}
              />
            </KeyboardAvoidingView>

            {/* Ratings Header */}
            <View style={styles.headersContainer}>
              <View style={styles.scoresContainer}>
                <Text style={styles.ratingHeader}>
                  {t("post.postReview.scores")}
                </Text>
                <TouchableOpacity onPress={toggleInfoModal}>
                  <Info style={styles.infoIcon} color={Colors.tags} size={18} />
                </TouchableOpacity>
              </View>
              <View style={styles.overallContainer}>
                <Text style={styles.priceHeader}>
                  {t("post.postReview.overall")}
                </Text>
              </View>
            </View>

            {/* Info Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={infoModalVisible}
              onRequestClose={toggleInfoModal}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>
                    {t("post.postReview.icons")}
                  </Text>
                  <View style={styles.modalContent}>
                    <View style={styles.iconRow}>
                      <Sparkle color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>
                        {t("post.postReview.ambiance")}
                      </Text>
                    </View>
                    <View style={styles.iconRow}>
                      <Utensils color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>
                        {t("post.postReview.food")}
                      </Text>
                    </View>
                    <View style={styles.iconRow}>
                      <HandPlatter color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>
                        {t("post.postReview.service")}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={toggleInfoModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>
                      {t("post.postReview.gotIt")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Share Modal (with scaled-down preview) */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={shareModalVisible}
              onRequestClose={() => setShareModalVisible(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <View style={styles.previewContainer}>
                    <StoryLayout
                      imageUrl={imageUrls}
                      restaurantName={restaurantName}
                      ratingAmbiance={ratingAmbiance}
                      ratingFoodQuality={ratingFoodQuality}
                      ratingService={ratingService}
                      isPreview
                    />
                  </View>
                  <TouchableOpacity onPress={shareToInstagramStories} style={styles.shareButton}>
                    <View style={styles.shareButtonContent}>
                      <FontAwesome
                        name="instagram"
                        size={20}
                        color={Colors.background}
                        style={styles.instagramIcon}
                      />
                      <Text style={styles.shareButtonText}>
                        Share to Instagram
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDontShare} style={styles.shareCancelButton}>
                    <Text style={styles.shareCancelButtonText}>
                      Don't Share
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Optional Preview Modal (full screen) */}
            <Modal
              animationType="slide"
              transparent={false}
              visible={previewModalVisible}
              onRequestClose={() => setPreviewModalVisible(false)}
            >
              <View style={{ flex: 1, backgroundColor: Colors.background }}>
                <TouchableOpacity
                  onPress={() => setPreviewModalVisible(false)}
                  style={{ padding: 15 }}
                >
                  <Text style={{ color: Colors.tags, fontSize: 16 }}>
                    Close Preview
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: Colors.tags,
                    textAlign: "center",
                    marginVertical: 10,
                  }}
                >
                  Preview Modal is Visible
                </Text>
                <StoryLayout
                  imageUrl={imageUrls}
                  restaurantName={restaurantName}
                  ratingAmbiance={ratingAmbiance}
                  ratingFoodQuality={ratingFoodQuality}
                  ratingService={ratingService}
                />
              </View>
            </Modal>

            {/* Ratings */}
            <View style={styles.ratingsContainer}>
              {/* Ambiance */}
              <View style={styles.ratingSection}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.ratingCircle,
                    ratingAmbiance >= 8
                      ? styles.highlightedRatingCircle
                      : styles.defaultRatingCircle,
                  ]}
                  onPress={() =>
                    handleRatingChange(
                      "ambiance",
                      ratingAmbiance === 10 ? 0 : ratingAmbiance + 1
                    )
                  }
                >
                  <Text style={styles.ratingScore}>{ratingAmbiance}</Text>
                </TouchableOpacity>
                <Sparkle
                  color={Colors.charcoal}
                  size={20}
                  style={styles.ratingIcon}
                />
              </View>

              {/* Food Quality */}
              <View style={styles.ratingSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.ratingCircle,
                    ratingFoodQuality >= 8
                      ? styles.highlightedRatingCircle
                      : styles.defaultRatingCircle,
                  ]}
                  onPress={() =>
                    handleRatingChange(
                      "foodQuality",
                      ratingFoodQuality === 10
                        ? 0
                        : ratingFoodQuality + 1
                    )
                  }
                >
                  <Text style={styles.ratingScore}>{ratingFoodQuality}</Text>
                </TouchableOpacity>
                <Utensils
                  color={Colors.charcoal}
                  size={20}
                  style={styles.ratingIcon}
                />
              </View>

              {/* Service */}
              <View style={styles.ratingSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.ratingCircle,
                    ratingService >= 8
                      ? styles.highlightedRatingCircle
                      : styles.defaultRatingCircle,
                  ]}
                  onPress={() =>
                    handleRatingChange(
                      "service",
                      ratingService === 10 ? 0 : ratingService + 1
                    )
                  }
                >
                  <Text style={styles.ratingScore}>{ratingService}</Text>
                </TouchableOpacity>
                <HandPlatter
                  color={Colors.charcoal}
                  size={20}
                  style={styles.ratingIcon}
                />
              </View>

              {/* Overall */}
              <View style={styles.ratingSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.ratingSquare,
                    overallRating >= 8
                      ? styles.highlightedRatingCircle
                      : styles.defaultRatingCircle,
                  ]}
                >
                  <Text style={styles.ratingScore}>{overallRating.toFixed(1)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Accessibility Toggles */}
            <View style={styles.accessibilitySection}>
              <View style={styles.accessibilityRatingsContainer}>
                {/* Halal */}
                <TouchableOpacity
                  style={[
                    styles.accessibilityRatingSquareHalal,
                    isHalal && styles.selectedAccessibilitySquareHalal,
                  ]}
                  onPress={() => handleAccessibilityToggle("halal")}
                >
                  <View
                    style={[
                      styles.circleIconContainer,
                      isHalal && styles.circleIconContainerSelected,
                    ]}
                  >
                    <Salad
                      size={17}
                      color={Colors.text}
                      style={styles.accessibilityIcon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.ratingText,
                      isHalal && styles.ratingTextSelected,
                    ]}
                  >
                    {t("post.postReview.halal")}
                  </Text>
                </TouchableOpacity>

                {/* Gluten-Free */}
                <TouchableOpacity
                  style={[
                    styles.accessibilityRatingSquareGluten,
                    isGlutenFree && styles.selectedAccessibilitySquareGluten,
                  ]}
                  onPress={() => handleAccessibilityToggle("glutenfree")}
                >
                  <View
                    style={[
                      styles.circleIconContainer,
                      isGlutenFree && styles.circleIconContainerSelected,
                    ]}
                  >
                    <WheatOff
                      size={17}
                      color={Colors.text}
                      style={styles.accessibilityIcon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.ratingText,
                      isGlutenFree && styles.ratingTextSelected,
                    ]}
                  >
                    {t("post.postReview.gluten")}
                  </Text>
                </TouchableOpacity>

                {/* Vegetarian/Vegan */}
                <TouchableOpacity
                  style={[
                    styles.accessibilityRatingSquareVeg,
                    isVeg && styles.selectedAccessibilitySquareVeg,
                  ]}
                  onPress={() => handleAccessibilityToggle("veg")}
                >
                  <View
                    style={[
                      styles.circleIconContainer,
                      isVeg && styles.circleIconContainerSelected,
                    ]}
                  >
                    <LeafyGreen
                      size={17}
                      color={Colors.text}
                      style={styles.accessibilityIcon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.ratingText,
                      isVeg && styles.ratingTextSelected,
                    ]}
                  >
                    {t("post.postReview.vegan")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default ReviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    marginTop: height * 0.02,
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    padding: width * 0.05,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  restaurantInfo: {
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.05,
    color: Colors.text,
  },
  reviewInputContainer: {
    width: width * 0.9,
    alignSelf: "center",
    justifyContent: "center",
    height: height * 0.2,
    borderRadius: 10,
    marginBottom: height * 0.035,
  },
  reviewInput: {
    backgroundColor: Colors.background,
    paddingTop: height * 0.012,
    fontSize: width * 0.04,
    fontFamily: Fonts.Regular,
    height: "100%",
    color: Colors.charcoal,
    borderRadius: 10,
  },
  headersContainer: {
    flexDirection: "row",
    marginBottom: height * 0.015,
  },
  scoresContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  overallContainer: {
    justifyContent: "center",
  },
  ratingHeader: {
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
    color: Colors.charcoal,
  },
  priceHeader: {
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
    color: Colors.charcoal,
    alignSelf: "center",
    marginLeft: width * 0.1,
    paddingRight: width * 0.09,
  },
  ratingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "flex-start",
    paddingLeft: width * 0.05,
  },
  ratingSection: {},
  ratingCircle: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.01,
    marginRight: width * 0.06,
  },
  ratingSquare: {
    width: width * 0.18,
    height: width * 0.12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.01,
    marginLeft: width * 0.12,
  },
  ratingIcon: {
    marginLeft: width * 0.035,
  },
  defaultRatingCircle: {
    backgroundColor: Colors.charcoal,
  },
  highlightedRatingCircle: {
    backgroundColor: Colors.tags,
  },
  ratingScore: {
    fontSize: width * 0.045,
    fontFamily: Fonts.Bold,
    color: Colors.background,
  },
  postButton: {
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingVertical: width * 0.02,
  },
  postButtonText: {
    color: Colors.tags,
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
  },
  infoIcon: {
    marginLeft: 5,
    marginRight: width * 0.38,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconDescription: {
    marginLeft: 10,
    fontFamily: Fonts.Medium,
    fontSize: width * 0.04,
  },
  closeButton: {
    marginTop: 15,
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: Colors.charcoal,
    borderRadius: 10,
  },
  closeButtonText: {
    color: Colors.background,
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.04,
  },
  accessibilitySection: {
    marginTop: height * 0.05,
    paddingHorizontal: width * 0.05,
    alignSelf: "flex-start",
  },
  accessibilityRatingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  accessibilityRatingSquareHalal: {
    width: width * 0.284,
    height: width * 0.135,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderColor: Colors.halal,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  accessibilityRatingSquareGluten: {
    width: width * 0.284,
    height: width * 0.135,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderColor: Colors.gluten,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  accessibilityRatingSquareVeg: {
    width: width * 0.284,
    height: width * 0.135,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderColor: Colors.veg,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  selectedAccessibilitySquareHalal: {
    backgroundColor: Colors.halal,
  },
  selectedAccessibilitySquareGluten: {
    backgroundColor: Colors.gluten,
  },
  selectedAccessibilitySquareVeg: {
    backgroundColor: Colors.veg,
  },
  ratingText: {
    fontSize: width * 0.035,
    color: Colors.text,
    fontFamily: Fonts.Medium,
    marginLeft: 5,
  },
  ratingTextSelected: {
    fontSize: width * 0.035,
    color: Colors.background,
    fontFamily: Fonts.Medium,
    marginLeft: 5,
  },
  circleIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 90,
    borderColor: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circleIconContainerSelected: {
    width: 30,
    height: 30,
    borderRadius: 90,
    borderColor: Colors.background,
    backgroundColor: Colors.background,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  accessibilityIcon: {},
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: width * 0.8,
    padding: 20,
    backgroundColor: Colors.background,
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.06,
    textAlign: "center",
  },
  modalContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    transform: [{ scale: 0.7 }],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    marginTop: width * -0.2,
  },
  shareButton: {
    backgroundColor: Colors.charcoal,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  shareButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  instagramIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: Colors.background,
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.045,
  },
  shareCancelButton: {
    marginTop: 5,
  },
  shareCancelButtonText: {
    color: Colors.tags,
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.045,
  },
});