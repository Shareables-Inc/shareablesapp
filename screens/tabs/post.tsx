import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Keyboard,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import FeedSearchBox from "../../components/search/feedSearchBox";
import { useWindowDimensions } from "react-native";
import { Establishment } from "../../models/establishment";
import { RetrieveResponse, Suggestion } from "../../types/mapbox.types";
import { tagsData } from "../../config/constants";
import SelectedRetrievedCard from "../../components/selectedRetrievedCard";
import { useCreateEstablishment } from "../../hooks/useEstablishment";
import { useAuth } from "../../context/auth.context";
import { FirebasePost, Post } from "../../models/post";
import { useCreatePost } from "../../hooks/usePost";
import { RootStackParamList } from "../../types/stackParams.types";
import { StackNavigationProp } from "@react-navigation/stack";
import { retrieveSearchResult } from "../../services/search.service";
import { serverTimestamp } from "firebase/firestore";
import { EstablishmentService } from "../../services/establishment.service";
import { mapRetrieveResponseToEstablishment } from "../../helpers/parseData";
type PostScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MainTabNavigator"
>;

type ReviewScreenParams = {
  restaurantName: string | undefined;
  tags: string[];
  postId: string;
};

const { width, height } = Dimensions.get("window");

const PostScreen = () => {
  const navigation = useNavigation<PostScreenNavigationProp>();
  const { user, userProfile } = useAuth();
  const { width } = useWindowDimensions();
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [retrievedSuggestion, setRetrievedSuggestion] =
    useState<Establishment | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<
    "cuisines" | "foodOccasions" | "restaurantVibes" | null
  >("cuisines");

  const { mutate: createPostMutation } = useCreatePost();
  const { mutate: createEstablishmentMutation, error: createError } =
    useCreateEstablishment();

  const handleSelectTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 4
        ? [...prev, tag]
        : prev
    );
  }, []);

  const renderTags = useCallback(
    (tags: string[], category: keyof typeof tagsData) => {
      return tags.map((tag, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.tag, selectedTags.includes(tag) && styles.selectedTag]}
          onPress={() => handleSelectTag(tag)}
        >
          <Text
            style={[
              styles.tagText,
              selectedTags.includes(tag) && styles.selectedTagText,
            ]}
          >
            {tag}
          </Text>
        </TouchableOpacity>
      ));
    },
    [selectedTags, handleSelectTag]
  );

  const handleSuggestionPress = useCallback(
    async (suggestion: Suggestion) => {
      setSelectedSuggestion(suggestion);
      try {
        // Check if the establishment already exists in the database from the Mapbox ID
        const establishmentService = new EstablishmentService();
        const existingEstablishmentMapbox =
          await establishmentService.getEstablishmentByMapboxId(
            suggestion.mapbox_id
          );

        if (existingEstablishmentMapbox) {
          // If the establishment exists, use it
          setRetrievedSuggestion(existingEstablishmentMapbox);
        } else {
          // If the establishment doesn't exist, retrieve it as a new suggestion
          const retrieveResponse = await retrieveSearchResult(
            suggestion.mapbox_id,
            user?.uid!
          );
          // create a helper function to map the retrieve response to an establishment
          const establishment =
            mapRetrieveResponseToEstablishment(retrieveResponse);
          setRetrievedSuggestion(establishment);
        }
      } catch (error) {
        console.error("Error retrieving search result:", error);
        Alert.alert(
          "Error",
          "Failed to retrieve restaurant details. Please try again."
        );
      }
      Keyboard.dismiss();
    },
    [user]
  );

  const createPost = useCallback(
    (establishmentId: string) => {
      const newPost: FirebasePost = {
        userId: user?.uid!,
        profilePicture: user!.uid + ".jpeg",
        username: userProfile?.username!,
        establishmentDetails: {
          id: establishmentId,
          address: retrievedSuggestion?.address!,
          averageRating: 0,
          city: retrievedSuggestion?.city!,
          country: retrievedSuggestion?.country!,
          hours: [],
          name: retrievedSuggestion?.name!,
          longitude: retrievedSuggestion?.longitude!,
          latitude: retrievedSuggestion?.latitude!,
          priceRange: 0,
          status: "",
          website: "",
        },
        tags: selectedTags,
        ratings: { overall: "0", ambiance: 0, foodQuality: 0, service: 0, priceRange: 0 },
        imageUrls: [],
        saveCount: 0,
        likeCount: 0,
        imageComponent: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        review: "",
      };
      createPostMutation(
        { ...newPost, id: "" },
        {
          onSuccess: (id) => {
            // Clear states
            setRetrievedSuggestion(null);
            setSelectedSuggestion(null);
            setSelectedTags([]); // Clear selected tags
            navigation.navigate("Review", {
              establishmentId: establishmentId,
              restaurantName: newPost.establishmentDetails.name,
              city: newPost.establishmentDetails.city,
              country: newPost.establishmentDetails.country,
              tags: selectedTags,
              postId: id,
            });
          },
          onError: (error) => {
            console.error("Error creating post:", error);
            Alert.alert(
              "Post Creation Error",
              "There was an error creating your post."
            );
          },
        }
      );
    },
    [
      user,
      userProfile,
      retrievedSuggestion,
      selectedTags,
      createPostMutation,
      navigation,
      setRetrievedSuggestion,
      setSelectedSuggestion,
      setSelectedTags, // Add this to the dependency array
    ]
  );

  const handleNextPress = useCallback(async () => {
    if (!retrievedSuggestion) {
      Alert.alert("Error", "Please select a restaurant before proceeding.");
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert("Error", "Please select at least one tag before proceeding.");
      return;
    }

    try {
      // when next is click it should create the establishment if it doesn't exist
      // then create the post
      let establishmentId: string;

      if (retrievedSuggestion.id !== "") {
        // The establishment already exists in our database
        establishmentId = retrievedSuggestion.id;
      } else {
        const newId = await new Promise<string>((resolve, reject) => {
          createEstablishmentMutation(retrievedSuggestion, {
            onSuccess: (newId) => resolve(newId),
            onError: (error) => reject(error),
          });
        });

        establishmentId = newId;
      }

      // Now create the post
      createPost(establishmentId);
    } catch (error) {
      console.error("Error in handleNextPress:", error);
      Alert.alert("Error", "There was an unexpected error. Please try again.");
    }
  }, [
    retrievedSuggestion,
    selectedTags,
    createEstablishmentMutation,
    createPost,
  ]);

  const handleCategoryPress = (
    category: "cuisines" | "foodOccasions" | "restaurantVibes"
  ) => {
    setActiveCategory(category === activeCategory ? null : category);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={handleNextPress}
        style={styles.nextButtonContainer}
      >
        <Text style={styles.nextButton}>Next</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>Where did you go to eat?</Text>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.searchContainer}>
          <FeedSearchBox
            refreshKey={Math.random()}
            country={"ca"}
            language={"en"}
            placeholder={"Search for a restaurant"}
            sessionToken={user?.uid!}
            onPlaceSelect={handleSuggestionPress}
          />
        </View>
        {selectedSuggestion && retrievedSuggestion && (
          <SelectedRetrievedCard
            retrievedSuggestion={retrievedSuggestion}
            onClear={() => {
              setSelectedSuggestion(null);
              setRetrievedSuggestion(null);
            }}
          />
        )}

        <Text style={styles.tagContainerTitle}>Select up to 4 tags</Text>

        <View style={styles.tagContainer}>
          <TouchableOpacity
            style={[
              styles.tagTypeTitle,
              activeCategory === "cuisines" && styles.activeTagButton,
            ]}
            onPress={() => handleCategoryPress("cuisines")}
          >
            <Text style={styles.tagType}>Cuisine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tagTypeTitle,
              activeCategory === "foodOccasions" && styles.activeTagButton,
            ]}
            onPress={() => handleCategoryPress("foodOccasions")}
          >
            <Text style={styles.tagType}>Occasion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tagTypeTitle,
              activeCategory === "restaurantVibes" && styles.activeTagButton,
            ]}
            onPress={() => handleCategoryPress("restaurantVibes")}
          >
            <Text style={styles.tagType}>Atmosphere</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {activeCategory === "cuisines" && (
            <View style={styles.tagsContainer}>
              {renderTags(tagsData.cuisines, "cuisines")}
            </View>
          )}
          {activeCategory === "foodOccasions" && (
            <View style={styles.tagsContainer}>
              {renderTags(tagsData.foodOccasions, "foodOccasions")}
            </View>
          )}
          {activeCategory === "restaurantVibes" && (
            <View style={styles.tagsContainer}>
              {renderTags(tagsData.restaurantVibes, "restaurantVibes")}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "5%",
    paddingTop: height * 0.02,
    paddingBottom: 10,
  },
  nextButtonContainer: {
    marginTop: "5%",
    alignItems: "flex-end",
    paddingRight: width * 0.07,
  },
  nextButton: {
    color: Colors.highlightText,
    fontSize: width * 0.055,
    fontFamily: Fonts.SemiBold,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: width * 0.07,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginTop: height * 0.02,
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: "5%",
    flex: 1,
  },
  body: {
    paddingBottom: "5%",
  },
  searchContainer: {
    paddingBottom: height * 0.03,
    position: "relative",
    zIndex: 1,
  },
  autocompleteListView: {
    position: "absolute",
    top: 40,
    zIndex: 2,
  },
  tagContainerTitle: {
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginTop: height * 0.03,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: "1%",
    marginTop: "1%",
  },
  tag: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingVertical: width * 0.015,
    paddingHorizontal: width * 0.045,
    marginRight: width * 0.03,
    marginBottom: width * 0.03,
  },
  tagText: {
    fontSize: width * 0.045,
    fontFamily: Fonts.Medium,
    color: Colors.text,
  },
  selectedTag: {
    backgroundColor: Colors.tags,
  },
  selectedTagText: {
    color: Colors.background,
  },
  tagTypeTitle: {
    backgroundColor: Colors.profileTopPlaces,
    borderRadius: 10,
    paddingHorizontal: width * 0.035,
    paddingVertical: width * 0.025,
    marginTop: height * 0.015,
  },
  tagType: {
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
    color: Colors.background,
  },
  tagContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: height * 0.015,
  },
  activeTagButton: {
    backgroundColor: Colors.tags,
  },
});

export default PostScreen;
