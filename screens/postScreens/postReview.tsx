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

const { width, height } = Dimensions.get("window");

const ReviewScreen = ({ route }) => {
  const { user, userProfile } = useAuth();
  const {
    restaurantName,
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

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
    });

    console.log("Image Picker Result:", result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUris = result.assets
        .slice(0, 3)
        .map((asset) => asset.uri);

      const processedImages = await Promise.all(
        selectedImageUris.map(async (uri) => await processImage(uri))
      );

      setImages(processedImages);
    }
  };

  const processImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
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
      console.log("Download URL:", downloadURL);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);

      if (retries > 0) {
        console.log("Retrying upload...");
        return uploadImageToFirebase(uri, index, retries - 1);
      } else {
        Alert.alert("Upload Error", "There was an error uploading the image.");
        return null;
      }
    }
  };

  const getComponentType = () => {
    if (images.length === 1) {
      return "singlePhoto";
    } else if (images.length === 2) {
      return isGridView ? "TwoPhotoGrid" : "TwoPhotoScroll";
    } else if (images.length === 3) {
      return isGridView ? "ThreePhotoGrid" : "ThreePhotoScroll";
    }
    return null;
  };

  const handlePost = async () => {
    console.log("handlePost clicked");

    if (images.length === 0) {
      Alert.alert("No Image", "Please select an image before posting.");
      return;
    }

    const overallRating = calculateOverallRating(
      ratingAmbiance,
      ratingFoodQuality,
      ratingService
    );

    try {
      console.log("Uploading images...");
      const imageUrls = await uploadImagesToFirebase();
      console.log("Image upload complete");
      const componentType = getComponentType();

      updatePost({
        id: initialPostId,
        data: {
          imageUrls: imageUrls.filter((url): url is string => url !== null),
          imageComponent: componentType ?? "singlePhoto",
          review: review,
          tags: tags,
          ratings: {
            ambiance: ratingAmbiance,
            foodQuality: ratingFoodQuality,
            service: ratingService,
            overall: overallRating,
          },
        },
        establishmentId: establishmentId,
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

  const renderPhotoComponent = () => {
    if (images.length === 1) {
      return (
        <SinglePhotoPost post={{ photo: images[0] }} onRePick={pickImages} />
      );
    } else if (images.length === 2) {
      return isGridView ? (
        <TwoPhotoGridPost post={{ photos: images }} onRePick={pickImages} />
      ) : (
        <TwoPhotoScrollPost post={{ photos: images }} onRePick={pickImages} />
      );
    } else if (images.length === 3) {
      return isGridView ? (
        <ThreePhotoGridPost post={{ photos: images }} onRePick={pickImages} />
      ) : (
        <ThreePhotoScrollPost post={{ photos: images }} onRePick={pickImages} />
      );
    }
    return (
      <TouchableOpacity
        onPress={pickImages}
        style={[
          styles.imagePicker,
          { width: height * 0.35 * 0.8, height: height * 0.35 },
        ]}
      >
        <Text style={styles.imagePickerText}>+</Text>
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
          <View style={styles.navigationControls}>
            <TouchableOpacity
              onPress={handlePost}
              style={styles.postButton}
              activeOpacity={1}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.imagePickerContainer}>
              {renderPhotoComponent()}
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.reviewInputContainer}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
              <TextInput
                placeholder="Write a quick review..."
                style={styles.reviewInput}
                multiline
                placeholderTextColor={Colors.text}
                value={review}
                onChangeText={handleReviewChange}
              />
            </KeyboardAvoidingView>

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
                <Text style={styles.ratingText}>Ambiance</Text>
              </View>
              <View style={styles.ratingSection}>
                <TouchableOpacity
                  activeOpacity={0.7}
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
                <Text style={styles.ratingText}>Food Quality</Text>
              </View>
              <View style={styles.ratingSection}>
                <TouchableOpacity
                  activeOpacity={0.7}
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
                <Text style={styles.ratingText}>Service</Text>
              </View>
            </View>

            {(images.length === 2 || images.length === 3) && (
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Switch Layout</Text>
                <Switch
                  trackColor={{
                    false: Colors.highlightText,
                    true: Colors.highlightText,
                  }}
                  thumbColor={
                    isGridView ? Colors.background : Colors.background
                  }
                  onValueChange={toggleLayout}
                  value={isGridView}
                />
              </View>
            )}
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
  navigationControls: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: height * 0.007,
    paddingRight: width * 0.05,
  },
  postButton: {
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingRight: width * 0.05,
    paddingTop: height * 0.01,
  },
  postButtonText: {
    color: Colors.highlightText,
    fontSize: 22,
    fontFamily: Fonts.SemiBold,
  },
  contentContainer: {
    marginTop: height * 0.035,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.035,
  },
  imagePicker: {
    width: height * 0.35 * 0.8,
    height: height * 0.35,
    borderRadius: 10,
    borderColor: Colors.highlightText,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imagePickerText: {
    fontSize: 40,
    color: Colors.highlightText,
  },
  reviewInputContainer: {
    width: width * 0.87,
    alignSelf: "center",
    justifyContent: "center",
    height: height * 0.12,
    borderColor: Colors.inputBackground,
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: height * 0.035,
  },
  reviewInput: {
    backgroundColor: Colors.background,
    paddingLeft: width * 0.025,
    paddingTop: height * 0.012,
    fontSize: 18,
    fontFamily: Fonts.Regular,
    height: "100%",
    color: Colors.text,
    borderRadius: 10,
  },
  ratingsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingSection: {
    alignItems: "center",
  },
  ratingCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.01,
    marginHorizontal: width * 0.05,
  },
  defaultRatingCircle: {
    backgroundColor: Colors.inputBackground,
  },
  highlightedRatingCircle: {
    backgroundColor: Colors.highlightText,
  },
  ratingText: {
    color: Colors.text,
    fontFamily: Fonts.Regular,
    fontSize: 14,
  },
  ratingScore: {
    fontSize: 18,
    fontFamily: Fonts.Bold,
    color: Colors.text,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: height * 0.1,
    paddingHorizontal: width * 0.1,
  },
  toggleLabel: {
    fontSize: 18,
    color: Colors.highlightText,
    fontFamily: Fonts.Medium,
    paddingLeft: width * 0.39,
  },
  loadingIndicator: {
    marginTop: height * 0.05,
  },
});

export default ReviewScreen;
