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
import { useUpdatePost } from "../../hooks/usePost";
import { Sparkle, Utensils, HandPlatter, Info, CircleArrowLeft, Salad, WheatOff, LeafyGreen, AccessibilityIcon } from "lucide-react-native";
import {PostService} from "../../services/post.service"

const { width, height } = Dimensions.get("window");

const ReviewScreen = ({ route }) => {
  const { user } = useAuth();
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
  const { mutate: updatePost } = useUpdatePost();

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
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);

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
    if (type === "vegetarian") setIsVegetarian(!isVegetarian);
    if (type === "vegan") setIsVegan(!isVegan);
    if (type === "glutenFree") setIsGlutenFree(!isGlutenFree);
  };

  const handlePost = async () => {
    if (!review.trim()) {
      Alert.alert("Incomplete Review", "Please write a review before posting.");
      return;
    }

    if (ratingAmbiance === 0 || ratingFoodQuality === 0 || ratingService === 0) {
      Alert.alert(
        "Incomplete Ratings",
        "Please provide ratings for ambiance, food quality, and service."
      );
      return;
    }

    const overallRating = calculateOverallRating(
      ratingAmbiance,
      ratingFoodQuality,
      ratingService
    );

    try {
      updatePost({
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
            vegetarian: isVegetarian,
            vegan: isVegan,
            glutenFree: isGlutenFree,
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
      Alert.alert("Post Error", "There was an error creating your post.");
    }
  };

  const handleBackPress = useCallback(() => {
    Alert.alert(
      "Discard Post",
      "Are you sure you want to discard this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await postService.deletePost(initialPostId); // Use initialPostId instead of postId
              console.log("Post deleted successfully");
              navigation.navigate("MainTabNavigator", {
                screen: "Post", 
              });
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post.");
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
                {isEditing ? "Update" : "Post"}
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
                placeholder="Write your review here..."
                style={styles.reviewInput}
                multiline
                placeholderTextColor={Colors.placeholderText}
                value={review}
                onChangeText={handleReviewChange}
              />
            </KeyboardAvoidingView>

            <View style={styles.headersContainer}>
              <View style={styles.scoresContainer}>
                <Text style={styles.ratingHeader}>Scores</Text>
                <TouchableOpacity onPress={toggleInfoModal}>
                  <Info style={styles.infoIcon} color={Colors.tags} size={18} />
                </TouchableOpacity>
              </View>
              <View style={styles.overallContainer}>
                <Text style={styles.priceHeader}>Overall</Text>
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
                    What Do These Icons Mean?
                  </Text>
                  <View style={styles.modalContent}>
                    <View style={styles.iconRow}>
                      <Sparkle color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>Ambiance</Text>
                    </View>
                    <View style={styles.iconRow}>
                      <Utensils color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>Food Quality</Text>
                    </View>
                    <View style={styles.iconRow}>
                      <HandPlatter color={Colors.charcoal} size={25} />
                      <Text style={styles.iconDescription}>Service Quality</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={toggleInfoModal}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>Got It!</Text>
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
              <Text style={styles.accessibilityHeader}>Accessibility</Text>
              <View style={styles.accessibilityRatingsContainer}>
              <TouchableOpacity
                style={[
                  styles.accessibilityRatingSquareHalal,
                  isVegetarian && styles.selectedAccessibilitySquare,
                ]}
                onPress={() => handleAccessibilityToggle("vegetarian")}
              >
                <View style={styles.circleIconContainer}>
                  <Salad size={19} color={Colors.text} style={styles.accessibilityIcon} />
                </View>
                <Text style={styles.ratingText}>100% Halal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accessibilityRatingSquareGluten,
                  isVegan && styles.selectedAccessibilitySquare,
                ]}
                onPress={() => handleAccessibilityToggle("vegan")}
              >
                <View style={styles.circleIconContainer}>
                  <WheatOff size={19} color={Colors.text} style={styles.accessibilityIcon} />
                </View>
                <Text style={styles.ratingText}>Gluten-free</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accessibilityRatingSquareVeg,
                  isGlutenFree && styles.selectedAccessibilitySquare,
                ]}
                onPress={() => handleAccessibilityToggle("glutenFree")}
              >
                <View style={styles.circleIconContainer}>
                  <LeafyGreen size={19} color={Colors.text} style={styles.accessibilityIcon} />
                </View>
                <Text style={styles.ratingText}>Veg & Vegan</Text>
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
    height: width * 0.14,
    borderRadius: 10,
    backgroundColor: Colors.halal,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginRight: width * 0.02,
    paddingHorizontal: 8,
  },
  accessibilityRatingSquareGluten: {
    width: width * 0.284,
    height: width * 0.14,
    borderRadius: 10,
    backgroundColor: Colors.gluten,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginRight: width * 0.02,
    paddingHorizontal: 8,
  },
  accessibilityRatingSquareVeg: {
    width: width * 0.284,
    height: width * 0.14,
    borderRadius: 10,
    backgroundColor: Colors.veg,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginRight: width * 0.02,
    paddingHorizontal: 8,
  },
  selectedAccessibilitySquare: {
    backgroundColor: Colors.tags,
  },
  ratingText: {
    fontSize: width * 0.036,
    color: Colors.background,
    fontFamily: Fonts.Medium,
    marginLeft: 5,
  },
  circleIconContainer: {
    width: 35, 
    height: 35,
    borderRadius: 90, 
    backgroundColor: Colors.background, 
    justifyContent: "center",
    alignItems: "center",
  },
  accessibilityIcon: {
  },
});

export default ReviewScreen;
