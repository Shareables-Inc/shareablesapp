import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { CircleArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";
import { tagsData } from "../../config/constants";

const { width, height } = Dimensions.get("window");

const TopCuisinesScreen = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [firstName, setFirstName] = useState("there");
  const [activeCategory, setActiveCategory] = useState<"cuisines" | "foodOccasions" | "restaurantVibes">("cuisines");

  useEffect(() => {
    const fetchUserName = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFirstName(userDoc.data().firstName || "there");
        }
      }
    };

    fetchUserName();
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelectTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 10
        ? [...prev, tag]
        : prev
    );
  }, []);

  const renderTags = useCallback(() => {
    const categoryTags = tagsData[activeCategory];
    return categoryTags.map((tag, index) => (
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
  }, [selectedTags, activeCategory]);

  const handleNextStep = async () => {
    if (selectedTags.length < 5) {
      Alert.alert("Selection Error", "Please select at least 5 tags.");
      return;
    }
  
    try {
      const userDocRef = doc(db, "users", user!.uid);
  
      // Save the selected cuisines and mark onboarding as complete
      await setDoc(
        userDocRef,
        {
          favoriteCuisines: selectedTags,
          onboardingComplete: true, // Mark onboarding as complete
        },
        { merge: true }
      );
  
      await refreshUserProfile(); // Refresh the user profile after the update
  
      // Navigate to the main feed (MainTabNavigator)
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabNavigator" }],
      });
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Update Failed", "Failed to save your favorite cuisines.");
    }
  };
  

  const handleCategoryPress = (category: "cuisines" | "foodOccasions" | "restaurantVibes") => {
    setActiveCategory(category);
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backArrowContainer}>
          <CircleArrowLeft color={Colors.text} size={30} />
        </TouchableOpacity>
      </View>

      {/* Main Message */}
      <Text style={styles.title}>
        <Text style={styles.nameText}>{firstName},</Text> our goal is to help you find amazing, unique places to eat.
      </Text>
      <Text style={styles.description}>Choose 5 to 10 of your favorite tags.</Text>

      {/* Tag Category Buttons */}
      <View style={styles.tagContainer}>
        <TouchableOpacity
          style={[styles.tagTypeTitle, activeCategory === "cuisines" && styles.activeTagButton]}
          onPress={() => handleCategoryPress("cuisines")}
        >
          <Text style={styles.tagType}>Cuisine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tagTypeTitle, activeCategory === "foodOccasions" && styles.activeTagButton]}
          onPress={() => handleCategoryPress("foodOccasions")}
        >
          <Text style={styles.tagType}>Occasion</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tagTypeTitle, activeCategory === "restaurantVibes" && styles.activeTagButton]}
          onPress={() => handleCategoryPress("restaurantVibes")}
        >
          <Text style={styles.tagType}>Atmosphere</Text>
        </TouchableOpacity>
      </View>

      {/* Tags */}
      <View style={styles.tagsSection}>
        <ScrollView contentContainerStyle={styles.tagsContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {renderTags()}
        </ScrollView>
      </View>

      {/* Next Step Button */}
      <View style={styles.nextButtonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
          <Text style={styles.nextButtonText}>Let's Go!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.05,
    backgroundColor: Colors.background,
  },
  headerBox: {
    width: width,
    backgroundColor: Colors.background,
    height: height * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrowContainer: {
    position: "absolute",
    left: width * 0.08,
    top: height * 0.1,
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: Fonts.SemiBold,
    marginBottom: height * 0.03,
    marginTop: height * 0.07,
    width: width * 0.85,
    justifyContent: "flex-start",
    textAlign: "left",
  },
  nameText: {
    color: Colors.highlightText,
    fontFamily: Fonts.SemiBold,
  },
  description: {
    fontSize: width * 0.05,
    textAlign: "left",
    width: width * 0.85,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
    marginBottom: height * 0.02,
  },
  tagsSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.01,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: "1%",
    paddingHorizontal: width * 0.02,
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
    marginRight: width * 0.03,
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
    paddingBottom: height * 0.01,
  },
  activeTagButton: {
    backgroundColor: Colors.tags,
  },
  nextButtonContainer: {
    width: "100%",
    paddingTop: height * 0.04,
    paddingBottom: height * 0.08,
    marginLeft: "10%",
  },
  nextButton: {
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    backgroundColor: Colors.text,
  },
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: width * 0.055,
    fontFamily: Fonts.Bold,
  },
});

export default TopCuisinesScreen;
