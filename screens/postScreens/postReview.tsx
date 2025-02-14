import React, { useState, useEffect, useCallback } from "react";
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
  Touchable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { TextInput } from "react-native-gesture-handler";
import { useAuth } from "../../context/auth.context";
import { useEditPost } from "../../hooks/usePost";
import { Sparkle, Utensils, HandPlatter, Info, CircleArrowLeft, Salad, WheatOff, LeafyGreen, AccessibilityIcon } from "lucide-react-native";
import {PostService} from "../../services/post.service"
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const ReviewScreen = ({ route }) => {
  const { user } = useAuth();
  const {t} = useTranslation();
  const postService = new PostService();
  const {
    restaurantName,
    city,
    country,
    tags,
    postId: initialPostId,
    establishmentId,
    isEditing = false, // Flag for edit mode
    review: initialReview = "", // Default value for review
    ratings = {}, // Default empty object for ratings
  } = route.params;
  const navigation = useNavigation();
  const { mutate: editPost } = useEditPost();

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

  // Accessibility ratings state
  const [isHalal, setIsHalal] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isVeg, setIsVeg] = useState(false);

  const toggleInfoModal = () => setInfoModalVisible(!infoModalVisible);

  const handleReviewChange = (text) => {
    setReview(text);
  };

  const calculateOverallRating = (ambiance, foodQuality, service) => {
    return ((ambiance + foodQuality + service) / 3).toFixed(1);
  };

  const handleRatingChange = (field, value) => {
    if (field === "ambiance") setRatingAmbiance(value);
    if (field === "foodQuality") setRatingFoodQuality(value);
    if (field === "service") setRatingService(value);

    const newOverallRating = calculateOverallRating(
      field === "ambiance" ? value : ratingAmbiance,
      field === "foodQuality" ? value : ratingFoodQuality,
      field === "service" ? value : ratingService
    );
    setOverallRating(parseFloat(newOverallRating));
  };

  const handleAccessibilityToggle = (type) => {
    if (type === "halal") setIsHalal(!isHalal);
    if (type === "glutenfree") setIsGlutenFree(!isGlutenFree);
    if (type === "veg") setIsVeg(!isVeg);
  };

  const handlePost = async () => {
    if (!review.trim()) {
      Alert.alert(t("post.expandedPost.incompleteReview"), t("post.expandedPost.incompleteReviewMessage"));
      return;
    }

    if (ratingAmbiance === 0 || ratingFoodQuality === 0 || ratingService === 0) {
      Alert.alert(
        t("post.expandedPost.incompleteRatings"),
        t("post.expandedPost.incompleteRatingsMessage")
      );
      return;
    }

    const overallRating = calculateOverallRating(
      ratingAmbiance,
      ratingFoodQuality,
      ratingService
    );

    try {
      editPost({
        id: initialPostId,
        data: {
          review,
          tags,
          ratings: {
            ambiance: ratingAmbiance,
            foodQuality: ratingFoodQuality,
            service: ratingService,
            overall: overallRating,
          },
          accessibility: {
            halal: isHalal,
            glutenFree: isGlutenFree,
            veg: isVeg,
          },
        },
        establishmentId,
      });

      navigation.navigate("MainTabNavigator", {
        screen: "Home",
        params: { screen: "Home" },
      });
    } catch (error) {
      console.error("Error in handlePost:", error);
      Alert.alert(t("post.expandedPost.postError"), t("post.expandedPost.postErrorMessage"));
    }
  };

  const handleBackPress = useCallback(() => {
    Alert.alert(
      t("post.expandedPost.discardPost"),
      t("post.expandedPost.discardPostMessage"),
      [
        { text: t("general.cancel"), style: "cancel" },
        {
          text: t("post.expandedPost.discard"),
          onPress: async () => {
            try {
              await postService.deletePost(initialPostId); // Use initialPostId instead of postId
              console.log("Post deleted successfully");
              navigation.navigate("MainTabNavigator", {
                screen: "Post", 
              });
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert(t("general.error"), t("post.expandedPost.discardError"));
            }
          },
        },
      ]
    );
  }, [initialPostId, postService, navigation]);
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBackPress} activeOpacity={1}>
              <CircleArrowLeft color={Colors.text} size={28} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePost} style={styles.postButton}>
              <Text style={styles.postButtonText}>
                {isEditing ? t("post.expandedPost.update") : t("post.expandedPost.post")}
              </Text>
            </TouchableOpacity>
          </View>

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

            <View style={styles.headersContainer}>
              <View style={styles.scoresContainer}>
                <Text style={styles.ratingHeader}>{t("post.postReview.scores")}</Text>
                <TouchableOpacity onPress={toggleInfoModal}>
                  <Info style={styles.infoIcon} color={Colors.tags} size={18} />
                </TouchableOpacity>
              </View>
              <View style={styles.overallContainer}>
                <Text style={styles.priceHeader}>{t("post.postReview.overall")}</Text>
              </View>
            </View>

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
                      <Text style={styles.iconDescription}>{t("post.postReview.ambiance")}</Text>
                    </View>
                    <View style={styles.iconRow}>
                      <Utensils color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>{t("post.postReview.food")}</Text>
                    </View>
                    <View style={styles.iconRow}>
                      <HandPlatter color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>{t("post.postReview.service")}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={toggleInfoModal}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>{t("post.postReview.gotIt")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={styles.ratingsContainer}>
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
                      ratingFoodQuality === 10 ? 0 : ratingFoodQuality + 1
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
                  <Text style={styles.ratingScore}>{overallRating}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.accessibilitySection}>
              <View style={styles.accessibilityRatingsContainer}>
              <TouchableOpacity
                style={[
                  styles.accessibilityRatingSquareHalal,
                  isHalal && styles.selectedAccessibilitySquareHalal,
                ]}
                onPress={() => handleAccessibilityToggle("halal")}
              >
                <View style={[styles.circleIconContainer, isHalal && styles.circleIconContainerSelected]}>
                  <Salad size={17} color={Colors.text} style={styles.accessibilityIcon} />
                </View>
                <Text style={[styles.ratingText, isHalal && styles.ratingTextSelected]}>{t("post.postReview.halal")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accessibilityRatingSquareGluten,
                  isGlutenFree && styles.selectedAccessibilitySquareGluten,
                ]}
                onPress={() => handleAccessibilityToggle("glutenfree")}
              >
                <View style={[styles.circleIconContainer, isGlutenFree && styles.circleIconContainerSelected]}>
                  <WheatOff size={17} color={Colors.text} style={styles.accessibilityIcon} />
                </View>
                <Text style={[styles.ratingText, isGlutenFree && styles.ratingTextSelected]}>{t("post.postReview.gluten")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accessibilityRatingSquareVeg,
                  isVeg && styles.selectedAccessibilitySquareVeg,
                ]}
                onPress={() => handleAccessibilityToggle("veg")}
              >
                <View style={[styles.circleIconContainer, isVeg && styles.circleIconContainerSelected]}>
                  <LeafyGreen size={17} color={Colors.text} style={styles.accessibilityIcon} />
                </View>
                <Text style={[styles.ratingText, isVeg && styles.ratingTextSelected]}>{t("post.postReview.vegan")}</Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

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
    justifyContent: "space-between"
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
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: width * 0.7,
    padding: 15,
    backgroundColor: Colors.background,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.05,
    marginBottom: 15,
  },
  modalContent: {
    alignItems: "flex-start",
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
  accessibilityHeader: {
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
    color: Colors.charcoal,
    marginBottom: height * 0.02,
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
  accessibilityIcon: {
  },
});

export default ReviewScreen;

