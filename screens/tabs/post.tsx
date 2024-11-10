import React, { useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import SinglePhotoPost from "../../components/posts/singlePhotoPost";
import TwoPhotoScrollPost from "../../components/posts/twoPhotoScrollPost";
import ThreePhotoScrollPost from "../../components/posts/threePhotoScrollPost";
import TwoPhotoGridPost from "../../components/posts/twoPhotoGridPost";
import ThreePhotoGridPost from "../../components/posts/threePhotoGridPost";
import { ImagePlus } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useCreatePost } from "../../hooks/usePost";
import { useAuth } from "../../context/auth.context";
import { serverTimestamp } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

const PostScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const [isGridView, setIsGridView] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const { mutate: createPostMutation } = useCreatePost();

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 3,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUploading(true);
      const selectedImageUris = result.assets.map((asset) => asset.uri);

      try {
        const processedImages = await Promise.all(
          selectedImageUris.map(async (uri) => await processImage(uri))
        );

        const uploadedUrls = await Promise.all(
          processedImages.map(async (imageUri, index) => {
            const downloadUrl = await uploadImageToFirebase(imageUri, index);
            return downloadUrl;
          })
        );

        setUploadedImageUrls(uploadedUrls.filter((url) => url !== null));
      } catch (error) {
        console.error("Error uploading images:", error);
        Alert.alert("Image Upload Error", "There was an error uploading images.");
      } finally {
        setUploading(false);
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
      Alert.alert("Image Processing Error", "There was an error processing the image.");
      return uri;
    }
  };

  const uploadImageToFirebase = async (uri: string, index: number, retries = 3) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(getStorage(), `images/user_${Date.now()}_${index}`);
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

  const createPost = useCallback(() => {
    const newPost = {
      userId: user?.uid!,
      profilePicture: user!.uid + ".jpeg",
      username: userProfile?.username!,
      establishmentDetails: {
        id: "", // Blank until a restaurant is selected on the next screen
        address: "",
        averageRating: 0,
        city: "",
        country: "",
        longitude: 0,
        latitude: 0,
        priceRange: 0,
        status: "",
        website: "",
      },
      tags: [],
      ratings: { overall: "0", ambiance: 0, foodQuality: 0, service: 0 },
      imageUrls: uploadedImageUrls,
      imageComponent: getComponentType(),
      saveCount: 0,
      likeCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      review: "",
    };

    createPostMutation(
      { ...newPost, id: "" },
      {
        onSuccess: (id) => {
          setUploadedImageUrls([]);
          navigation.navigate("RestaurantSelect", {
            postId: id,
          });
        },
        onError: (error) => {
          console.error("Error creating post:", error);
          Alert.alert("Post Creation Error", "There was an error creating your post.");
        },
      }
    );
  }, [user, userProfile, uploadedImageUrls, createPostMutation, navigation, isGridView]);

  const handleNextPress = useCallback(() => {
    if (uploadedImageUrls.length === 0) {
      Alert.alert("Error", "Please upload at least one image before proceeding.");
      return;
    }

    createPost();
  }, [uploadedImageUrls, createPost]);

  const renderPhotoComponent = () => {
    if (uploading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.tags} />
          <Text style={styles.loadingText}>Uploading images...</Text>
        </View>
      );
    }

    if (uploadedImageUrls.length === 1) {
      return <SinglePhotoPost post={{ photo: uploadedImageUrls[0] }} onRePick={pickImages} />;
    } else if (uploadedImageUrls.length === 2) {
      return isGridView ? (
        <TwoPhotoGridPost post={{ photos: uploadedImageUrls }} onRePick={pickImages} />
      ) : (
        <TwoPhotoScrollPost post={{ photos: uploadedImageUrls }} onRePick={pickImages} />
      );
    } else if (uploadedImageUrls.length === 3) {
      return isGridView ? (
        <ThreePhotoGridPost post={{ photos: uploadedImageUrls }} onRePick={pickImages} />
      ) : (
        <ThreePhotoScrollPost post={{ photos: uploadedImageUrls }} onRePick={pickImages} />
      );
    }

    return (
      <TouchableOpacity onPress={pickImages} style={styles.imagePicker}>
        <ImagePlus color={Colors.tags} size={40} />
        <Text style={styles.addImageText}>Add photos</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload photos from your recent restaurant visit</Text>
        <Text style={styles.description}>
          Whether it's your meal, the restaurant's unique vibe, or memories made at the table, we want to see it all.
        </Text>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <View style={styles.imagePickerContainer}>{renderPhotoComponent()}</View>

            {uploadedImageUrls.length > 1 && (
              <View style={styles.customSwitchContainer}>
                <View style={styles.customSwitchBackground}>
                  <Switch
                    trackColor={{ false: Colors.inputBackground, true: Colors.inputBackground }}
                    thumbColor={Colors.text}
                    onValueChange={() => setIsGridView((prev) => !prev)}
                    value={isGridView}
                    style={styles.customSwitch}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity onPress={handleNextPress} style={styles.nextButton} activeOpacity={1}>
              <Text style={styles.nextButtonText}>Next Step</Text>
            </TouchableOpacity>
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
  header: {
    paddingHorizontal: width * 0.05,
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginBottom: height * 0.02,
    marginTop: height * 0.04,
  },
  description: {
    fontSize: width * 0.047,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    paddingRight: width * 0.07,
  },
  contentContainer: {
    marginTop: width * 0.05,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.1,
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
    marginBottom: height * 0.03,
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
    color: Colors.tags,
    marginTop: height * 0.01,
  },
  customSwitchContainer: {
    alignItems: "center",
  },
  customSwitchBackground: {
    width: 65,
    height: 35,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  customSwitch: {
    transform: [{ scaleX: 1.3 }, { scaleY: 1.2 }],
  },
  nextButton: {
    backgroundColor: Colors.charcoal,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.08,
    borderRadius: 30,
    marginTop: width * 0.13,
  },
  nextButtonText: {
    color: Colors.background,
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
  },
});

export default PostScreen;
