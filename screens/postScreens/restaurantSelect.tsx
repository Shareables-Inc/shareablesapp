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
import { NavigationProp, useNavigation, useRoute } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import FeedSearchBox from "../../components/search/feedSearchBox";
import { useWindowDimensions } from "react-native";
import { Establishment } from "../../models/establishment";
import { Suggestion } from "../../types/mapbox.types";
import { tagsData } from "../../config/constants";
import SelectedRetrievedCard from "../../components/selectedRetrievedCard";
import { useCreateEstablishment } from "../../hooks/useEstablishment";
import { useAuth } from "../../context/auth.context";
import { useUpdatePost } from "../../hooks/usePost";
import { retrieveSearchResult } from "../../services/search.service";
import { EstablishmentService } from "../../services/establishment.service";
import { mapRetrieveResponseToEstablishment } from "../../helpers/parseData";
import { RootStackParamList } from "../../types/stackParams.types";
import { CircleArrowLeft } from "lucide-react-native";
import {PostService} from "../../services/post.service"
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const RestaurantSelectScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const route = useRoute();
  const { postId, imageUrls } = route.params as { postId: string; imageUrls: string[] };
  const { user, userProfile } = useAuth();
  const { width } = useWindowDimensions();
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [retrievedSuggestion, setRetrievedSuggestion] = useState<Establishment | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<"cuisines" | "foodOccasions" | "restaurantVibes" | null>("cuisines");

  const { mutate: createEstablishmentMutation } = useCreateEstablishment();
  const { mutate: updatePost } = useUpdatePost();
  const postService = new PostService();

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
          activeOpacity={0.8}
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
        const establishmentService = new EstablishmentService();
        const existingEstablishmentMapbox = await establishmentService.getEstablishmentByMapboxId(suggestion.mapbox_id);

        if (existingEstablishmentMapbox) {
          setRetrievedSuggestion(existingEstablishmentMapbox);
        } else {
          const retrieveResponse = await retrieveSearchResult(suggestion.mapbox_id, user?.uid!);
          const establishment = mapRetrieveResponseToEstablishment(retrieveResponse);
          setRetrievedSuggestion(establishment);
        }
      } catch (error) {
        console.error("Error retrieving search result:", error);
        Alert.alert(t("general.error"), t("post.restaurantSelect.detailsError"));
      }
      Keyboard.dismiss();
    },
    [user]
  );

  const updateExistingPost = useCallback(
    (establishmentId: string) => {
      if (!postId || !establishmentId) {
        console.error("Error: Missing postId or establishmentId.");
        Alert.alert(t("general.error"), t("post.restaurantSelect.missingIdError"));
        return;
      }
  
      const updatedPostData = {
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
      };
  
      updatePost(
        { id: postId, establishmentId, data: updatedPostData }, // Added establishmentId to the mutation parameters
        {
          onSuccess: () => {
            setRetrievedSuggestion(null);
            setSelectedSuggestion(null);
            setSelectedTags([]);
            navigation.navigate("Review", {
              establishmentId: establishmentId,
              restaurantName: updatedPostData.establishmentDetails.name,
              city: updatedPostData.establishmentDetails.city,
              country: updatedPostData.establishmentDetails.country,
              tags: selectedTags,
              postId: postId,
              imageUrls: imageUrls[0], 
            });            
          },
          onError: (error) => {
            console.error("Error updating post:", error);
            Alert.alert(t("post.restaurantSelect.updateError"), t("post.restaurantSelect.updateErrorMessage"));
          },
        }
      );
    },
    [updatePost, postId, selectedTags, navigation, retrievedSuggestion]
  );
  

  const handleNextPress = useCallback(async () => {
    if (!retrievedSuggestion) {
      Alert.alert(t("general.error"), t("post.restaurantSelect.restaurantSelectError"));
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert(t("general.error"), t("post.restaurantSelect.tagSelectError"));
      return;
    }

    try {
      let establishmentId: string;

      if (retrievedSuggestion.id !== "") {
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

      if (establishmentId) {
        updateExistingPost(establishmentId);
      } else {
        Alert.alert(t("general.error"), t("post.restaurantSelect.establishmentError"));
      }
    } catch (error) {
      console.error("Error in handleNextPress:", error);
      Alert.alert(t("general.error"), t("post.restaurantSelect.unexpectedError"));
    }
  }, [retrievedSuggestion, selectedTags, createEstablishmentMutation, updateExistingPost]);

  const handleCategoryPress = (category: "cuisines" | "foodOccasions" | "restaurantVibes") => {
    setActiveCategory(category === activeCategory ? null : category);
  }

  const handleBackPress = useCallback(() => {
    Alert.alert(
      t("post.restaurantSelect.discardPost"),
      t("post.restaurantSelect.discardPostMessage"),
      [
        { text: t("general.Cancel"), style: "cancel" },
        {
          text: t("post.restaurantSelect.discard"),
          onPress: async () => {
            try {
              await postService.deletePost(postId);
              console.log("Post deleted successfully");
              // Navigate back or refresh the UI as needed
              navigation.navigate("MainTabNavigator", {
                screen: "Post",
              });
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert(t("general.error"), t("post.restaurantSelect.discardError"));
            }
          },
        },
      ]
    );
  }, [postId, postService, navigation]);
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nextButtonContainer}>
      <TouchableOpacity onPress={handleBackPress} activeOpacity={1}>
      <CircleArrowLeft size={28} color={Colors.text} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleNextPress} activeOpacity={1}>
        <Text style={styles.nextButton}>{t("general.next")}</Text>
      </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>{t("post.restaurantSelect.where")}</Text>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.searchContainer}>
          <FeedSearchBox
            refreshKey={Math.random()}
            country={"ca"}
            language={"en"}
            placeholder={t("post.restaurantSelect.search")}
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

        <Text style={styles.tagContainerTitle}>{t("post.restaurantSelect.tags")}</Text>

        <View style={styles.tagContainer}>
          <TouchableOpacity
            style={[styles.tagTypeTitle, activeCategory === "cuisines" && styles.activeTagButton]}
            onPress={() => handleCategoryPress("cuisines")}
            activeOpacity={1}
          >
            <Text style={styles.tagType}>{t("post.restaurantSelect.cuisine")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tagTypeTitle, activeCategory === "foodOccasions" && styles.activeTagButton]}
            onPress={() => handleCategoryPress("foodOccasions")}
            activeOpacity={1}
          >
            <Text style={styles.tagType}>{t("post.restaurantSelect.occasion")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tagTypeTitle, activeCategory === "restaurantVibes" && styles.activeTagButton]}
            onPress={() => handleCategoryPress("restaurantVibes")}
            activeOpacity={1}
          >
            <Text style={styles.tagType}>{t("post.restaurantSelect.atmosphere")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} bounces={true}>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05
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

export default RestaurantSelectScreen;
