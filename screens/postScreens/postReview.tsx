import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/firebaseConfig";
import { RootStackParamList } from "../../types/stackParams.types";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { TextInput } from "react-native-gesture-handler";
import * as ImageManipulator from "expo-image-manipulator";
import SinglePhotoPost from "../../components/posts/singlePhotoPost";
import TwoPhotoScrollPost from "../../components/posts/twoPhotoScrollPost";
import ThreePhotoScrollPost from "../../components/posts/threePhotoScrollPost";
import TwoPhotoGridPost from "../../components/posts/twoPhotoGridPost";
import ThreePhotoGridPost from "../../components/posts/threePhotoGridPost";
import { useAuth } from "../../context/auth.context";
import { useUpdatePost } from "../../hooks/usePost";
import { EstablishmentDetails } from "../../models/post";
import { Sparkle, Utensils, HandPlatter, ImagePlus, Info } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const ReviewScreen = ({ route }) => {
  const { user, userProfile } = useAuth();
  const {
    restaurantName,
    city, 
    country,
    tags,
    postId: initialPostId,
    establishmentId,
  } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);
  const toggleLayout = () => setIsGridView((previousState) => !previousState);

  const { mutate: updatePost, isSuccess: isPostSuccess } = useUpdatePost();

  const [review, setReview] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [ratingAmbiance, setRatingAmbiance] = useState<number>(0);
  const [ratingFoodQuality, setRatingFoodQuality] = useState<number>(0);
  const [ratingService, setRatingService] = useState<number>(0);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const toggleInfoModal = () => setInfoModalVisible(!infoModalVisible);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
      selectionLimit: 3,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true); // Show loading indicator while uploading images
      const selectedImageUris = result.assets
        .slice(0, 3)
        .map((asset) => asset.uri);
  
      try {
        const processedImages = await Promise.all(
          selectedImageUris.map(async (uri) => await processImage(uri))
        );
  
        // Upload images right after processing
        const uploadedUrls = await Promise.all(
          processedImages.map(async (imageUri, index) => {
            const downloadUrl = await uploadImageToFirebase(imageUri, index);
            return downloadUrl;
          })
        );
  
        // Set uploaded image URLs in state
        setUploadedImageUrls(uploadedUrls.filter((url) => url !== null));
      } catch (error) {
        console.error("Error uploading images:", error);
        Alert.alert("Image Upload Error", "There was an error uploading images.");
      } finally {
        setUploading(false); // Hide loading indicator
      }
    }
  };
  
  
  const processImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG } 
      );
  
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
  
      if (blob.size > 2 * 1024 * 1024) {
        throw new Error("File size exceeds the limit of 2MB after processing");
      }
  
      return manipResult.uri;
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert(
        "Image Processing Error",
        "There was an error processing the image."
      );
      return uri;
    }
  };  

  const handleReviewChange = (text: string) => {
    setReview(text);
  };

  const calculateOverallRating = (
    ambiance: number,
    foodQuality: number,
    service: number
  ) => {
    return ((ambiance + foodQuality + service) / 3).toFixed(1);
  };

  const handleRatingChange = (field: string, value: number) => {
    if (field === "ambiance") setRatingAmbiance(value);
    if (field === "foodQuality") setRatingFoodQuality(value);
    if (field === "service") setRatingService(value);
  
    // Update the overall rating when any rating changes
    const newOverallRating = calculateOverallRating(
      field === "ambiance" ? value : ratingAmbiance,
      field === "foodQuality" ? value : ratingFoodQuality,
      field === "service" ? value : ratingService
    );
    setOverallRating(parseFloat(newOverallRating));
  };

  const uploadImagesToFirebase = async () => {
    const uploadTasks = images.map((uri, index) =>
      uploadImageToFirebase(uri, index)
    );
    const downloadURLs = await Promise.all(uploadTasks);
    return downloadURLs;
  };

  const uploadImageToFirebase = async (
    uri: string,
    index: number,
    retries = 3
  ) => {
    try {
      const processedUri = await processImage(uri);
      const response = await fetch(processedUri);
      const blob = await response.blob();
  
      const storageRef = ref(
        storage,
        `images/${user!.uid}_${Date.now()}_${index}`
      );
      await uploadBytes(storageRef, blob);
  
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      if (retries > 0) {
        return uploadImageToFirebase(uri, index, retries - 1);
      } else {
        return null;
      }
    }
  };

  const getComponentType = () => {
    if (uploadedImageUrls.length === 1) {
      return "singlePhoto";
    } else if (uploadedImageUrls.length === 2) {
      return isGridView ? "TwoPhotoGrid" : "TwoPhotoScroll";
    } else if (uploadedImageUrls.length === 3) {
      return isGridView ? "ThreePhotoGrid" : "ThreePhotoScroll";
    }
    return null;
  };
  

  const handlePost = async () => {
    console.log("handlePost clicked");
  
    // Ensure there are uploaded images before proceeding
    if (uploadedImageUrls.length === 0) {
      Alert.alert("No Image", "Please upload an image before posting.");
      return;
    }
  
    // Ensure the review is not empty
    if (!review.trim()) {
      Alert.alert("Incomplete Review", "Please write a review before posting.");
      return;
    }
  
    // Ensure all scores are above 0
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
      const componentType = getComponentType();
  
      // Update the existing post document with the new data
      updatePost({
        id: initialPostId, // Use the postId passed from the previous screen
        data: {
          imageUrls: uploadedImageUrls, // The URLs of the uploaded images
          imageComponent: componentType ?? "singlePhoto",
          review: review, // The user's review
          tags: tags, // Tags selected on the previous screen
          ratings: {
            ambiance: ratingAmbiance,
            foodQuality: ratingFoodQuality,
            service: ratingService,
            overall: overallRating, // Calculated overall score
          },
        },
        establishmentId: establishmentId, // The restaurant or establishment ID
      });
  
      // Navigate to the home screen after the post is created
      navigation.navigate("MainTabNavigator", {
        screen: "Home",
        params: { screen: "Home" },
      });
    } catch (error) {
      console.error("Error in handlePost:", error);
      Alert.alert("Post Error", "There was an error creating your post.");
    }
  };
  

  const renderPhotoComponent = () => {
    if (uploading) {
      // Show loading indicator while images are being uploaded
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.tags} />
          <Text style={styles.loadingText}>Uploading images...</Text>
        </View>
      );
    }
  
    if (uploadedImageUrls.length === 1) {
      return (
        <SinglePhotoPost
          post={{ photo: uploadedImageUrls[0] }}
          onRePick={pickImages}
        />
      );
    } else if (uploadedImageUrls.length === 2) {
      return isGridView ? (
        <TwoPhotoGridPost
          post={{ photos: uploadedImageUrls }}
          onRePick={pickImages}
        />
      ) : (
        <TwoPhotoScrollPost
          post={{ photos: uploadedImageUrls }}
          onRePick={pickImages}
        />
      );
    } else if (uploadedImageUrls.length === 3) {
      return isGridView ? (
        <ThreePhotoGridPost
          post={{ photos: uploadedImageUrls }}
          onRePick={pickImages}
        />
      ) : (
        <ThreePhotoScrollPost
          post={{ photos: uploadedImageUrls }}
          onRePick={pickImages}
        />
      );
    }
  
    // Default state when no images are selected
    return (
      <TouchableOpacity onPress={pickImages} style={styles.imagePicker}>
        <ImagePlus color={Colors.tags} size={40} />
        <Text style={styles.addImageText}>add photos</Text>
      </TouchableOpacity>
    );
  };
  

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <View style={styles.imagePickerContainer}>
              {renderPhotoComponent()}
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.reviewInputContainer}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
              <Text style={styles.restaurantInfo}>{restaurantName} | {city}, {country}</Text>

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

            {/* Info Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={infoModalVisible}
              onRequestClose={toggleInfoModal}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>What Do These Icons Mean?</Text>
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
                  <TouchableOpacity onPress={toggleInfoModal} style={styles.closeButton}>
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
                <View style={{ marginLeft: width * 0.04 }}>
                  <Sparkle color={Colors.charcoal} size={20} />
                </View>
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
                <View style={{ marginLeft: width * 0.04 }}>
                  <Utensils color={Colors.charcoal} size={20} />
                </View>
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
                <View style={{ marginLeft: width * 0.04 }}>
                  <HandPlatter color={Colors.charcoal} size={20} />
                </View>
              </View>

              <View style={styles.ratingSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.ratingSquare, // Adjust the styling as needed
                    overallRating >= 8 ? styles.highlightedRatingCircle : styles.defaultRatingCircle,
                  ]}
                >
                  <Text style={styles.ratingScore}>{overallRating}</Text>
                </TouchableOpacity>
              </View>

            </View>

            <View style={styles.toggleContainer}>
              <View style={styles.switch}>
                <Switch
                  trackColor={{
                    false: Colors.background,
                    true: Colors.background,
                  }}
                  thumbColor={isGridView ? Colors.charcoal : Colors.charcoal}
                  onValueChange={toggleLayout}
                  value={isGridView}
                />
              </View>

              <TouchableOpacity
                onPress={handlePost}
                style={styles.postButton}
                activeOpacity={1}
              >
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
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
    marginTop: height * 0.01,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.035,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: Fonts.Medium,
    fontSize: width * 0.045,
    color: Colors.tags,
  },
  imagePickerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.035,
    flex: 1,
  },
  imagePicker: {
    width: height * 0.35 * 0.8,
    height: height * 0.35,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  addImageText: {
    fontFamily: Fonts.Medium,
    fontSize: width * 0.045,
    justifyContent: "center",
    color: Colors.tags,
    marginTop: height * 0.01,
  },
  restaurantInfo: {
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.045,
    color: Colors.text,
    marginTop: height * 0.01,
  },
  reviewInputContainer: {
    width: width * 0.9,
    alignSelf: "center",
    justifyContent: "center",
    height: height * 0.17,
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
    paddingRight: width * 0.09
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
  defaultRatingCircle: {
    backgroundColor: Colors.charcoal,
  },
  highlightedRatingCircle: {
    backgroundColor: Colors.highlightText,
  },
  ratingScore: {
    fontSize: width * 0.045,
    fontFamily: Fonts.Bold,
    color: Colors.background,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.1,
    marginTop: height * 0.057,
    width: width,
    height: height * 0.13,
    backgroundColor: Colors.tags,
    borderRadius: 10,
  },
  loadingIndicator: {
    marginTop: height * 0.05,
  },
  postButton: {
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingVertical: width * 0.02,
    paddingHorizontal: width * 0.04,
  },
  postButtonText: {
    color: Colors.tags,
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
  },
  switch: {
    backgroundColor: Colors.background,
    borderRadius: 30,
  },
  infoIcon: {
    marginLeft: 5, 
    marginRight: width * 0.38
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
    fontSize: width * 0.04
  },
});

export default ReviewScreen;
