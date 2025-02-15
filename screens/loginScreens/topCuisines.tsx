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
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const TopCuisinesScreen = () => {
  const { user, refreshUserProfile } = useAuth();
  const {t} = useTranslation();
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
        activeOpacity={0.7}
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
      Alert.alert(t("login.topCuisines.selectionError"), t("login.topCuisines.selectionErrorMessage"));
      return;
    }

    try {
      const userDocRef = doc(db, "users", user!.uid);
      await setDoc(
        userDocRef,
        { favoriteCuisines: selectedTags },
        { merge: true }
      );
      navigation.navigate("InviteContacts");
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert(t("general.updateFail"), t("login.topCuisines.saveFail"));
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
        <Text style={styles.nameText}>{firstName},</Text> {t("login.topCuisines.title")}
      </Text>
      <Text style={styles.description}>{t("login.topCuisines.choose")}</Text>

      {/* Tag Category Buttons */}
      <View style={styles.tagContainer}>
        <TouchableOpacity
          style={[styles.tagTypeTitle, activeCategory === "cuisines" && styles.activeTagButton]}
          onPress={() => handleCategoryPress("cuisines")}
          activeOpacity={0.7}
        >
          <Text style={styles.tagType}>{t("login.topCuisines.cuisine")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tagTypeTitle, activeCategory === "foodOccasions" && styles.activeTagButton]}
          onPress={() => handleCategoryPress("foodOccasions")}
          activeOpacity={0.7}
        >
          <Text style={styles.tagType}>{t("login.topCuisines.occasion")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tagTypeTitle, activeCategory === "restaurantVibes" && styles.activeTagButton]}
          onPress={() => handleCategoryPress("restaurantVibes")}
          activeOpacity={0.7}
        >
          <Text style={styles.tagType}>{t("login.topCuisines.atmosphere")}</Text>
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
        <TouchableOpacity style={styles.nextButton} onPress={handleNextStep} activeOpacity={1}>
          <Text style={styles.nextButtonText}>{t("general.nextStep")}</Text>
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
