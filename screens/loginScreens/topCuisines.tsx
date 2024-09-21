import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useNavigation,
  NavigationProp,
  useRoute,
} from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

const TAGS_DATA = [
  "Date Night",
  "Coffee Shop",
  "Sports",
  "Vegan",
  "Family Friendly",
  "Brunch",
  "Vegetarian",
  "Live Music",
  "Buffet",
  "Deli",
  "Business",
  "Late Night Eats",
  "Craft Beer",
  "Lunch Spots",
  "Healthy",
  "Patio",
  "Dessert",
  "Bakery",
  "Pizza",
  "Burgers",
  "Sushi",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Indian",
  "Vietnamese",
  "Middle Eastern",
  "Greek",
  "Mediterranean",
  "African",
  "Caribbean",
  "Latin American",
  "European",
  "North American",
  "South American",
  "Central American",
  "Australian",
  "New Zealand",
  "Seafood",
  "Steakhouse",
  "BBQ",
  "Fast Food",
  "Food Truck",
  "Food Court",
  "Fine Dining",
  "Casual Dining",
];

const MAX_TAGS = 10;

const TopCuisinesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [firstName, setFirstName] = useState("there"); // Default name if not fetched

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

  const handleSelectTag = (tag: string) => {
    setSelectedTags((prevSelectedTags: string[]) => {
      if (prevSelectedTags.includes(tag)) {
        // Deselect if the tag is already selected
        return prevSelectedTags.filter((t) => t !== tag);
      } else {
        // Select a new tag only if less than MAX_TAGS are selected
        if (prevSelectedTags.length < MAX_TAGS) {
          return [...prevSelectedTags, tag];
        } else {
          return prevSelectedTags;
        }
      }
    });
  };

  const isTagSelected = (tag: string): boolean => {
    return selectedTags.includes(tag);
  };

  const renderTags = () => {
    return TAGS_DATA.map((item, index) => (
      <TouchableOpacity
        key={index}
        style={[styles.tag, isTagSelected(item) ? styles.tagSelected : {}]}
        onPress={() => handleSelectTag(item)}
        activeOpacity={1}
      >
        <Text
          style={[
            styles.tagText,
            isTagSelected(item) ? styles.tagTextSelected : {},
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    ));
  };

  const handleNextStep = async () => {
    if (selectedTags.length < 5) {
      Alert.alert("Selection Error", "Please select at least 5 tags.");
      return;
    } else if (selectedTags.length > MAX_TAGS) {
      Alert.alert("Selection Error", "Please select no more than 10 tags.");
      return;
    }

    const userDocRef = doc(db, "users", user!.uid);
    try {
      await setDoc(
        userDocRef,
        { favoriteCuisines: selectedTags },
        { merge: true }
      );
      navigation.navigate("InviteContacts");
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert(
        "Update Failed",
        "Failed to save your favorite cuisines. Please try again."
      );
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <StatusBar style="auto" />

      {/* Header Gray Box */}
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backArrowContainer}
          activeOpacity={1}
        >
          <ArrowLeft style={styles.backArrow} />
        </TouchableOpacity>
      </View>

      {/* Main Message */}
      <Text style={styles.title}>
        <Text style={styles.nameText}>{firstName},</Text>
        <Text>
          {" "}
          our goal is to help you find amazing, unique places to eat.
        </Text>
      </Text>
      <Text style={styles.description}>
        Choose 5 to 10 of your favorite cuisines.
      </Text>

      {/* Tags */}
      <View style={styles.tagsSection}>
        <ScrollView
          contentContainerStyle={styles.tagsContainer}
          bounces={true}
          showsVerticalScrollIndicator={false}
        >
          {renderTags()}
        </ScrollView>
      </View>

      {/* Next Step Button */}
      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextStep}
          activeOpacity={1}
        >
          <Text style={styles.nextButtonText}>Next Step</Text>
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
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  headerBox: {
    width: width,
    position: "absolute",
    top: height * 0,
    backgroundColor: Colors.background,
    height: height * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrowContainer: {
    position: "absolute",
    left: "8%",
    top: "100%",
  },
  backArrow: {
    width: width * 0.095,
    height: width * 0.095,
  },
  title: {
    fontSize: 32,
    marginBottom: height * 0.02,
    width: width * 0.85,
    justifyContent: "center",
    textAlign: "left",
    fontFamily: Fonts.Bold,
    marginTop: height * 0.05,
  },
  nameText: {
    color: Colors.highlightText,
    fontFamily: Fonts.SemiBold,
  },
  description: {
    fontSize: 22,
    textAlign: "left",
    width: width * 0.85,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
  },
  nextButtonContainer: {
    width: "100%",
    marginTop: "5%",
    marginLeft: width * 0.25,
  },
  nextButton: {
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    position: "absolute",
    right: "18%",
    backgroundColor: Colors.text,
  },
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: 24,
    fontFamily: Fonts.Bold,
  },
  tagsSection: {
    marginTop: height * 0.01,
    alignItems: "center",
    backgroundColor: Colors.background,
    height: height * 0.49,
    width: width * 0.95,
    justifyContent: "center",
    alignSelf: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: width * 0.01,
  },
  tag: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.02,
    margin: 5,
  },
  tagSelected: {
    backgroundColor: Colors.highlightText,
  },
  tagText: {
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    textAlign: "center",
    fontSize: 18,
  },
  tagTextSelected: {
    color: Colors.background,
    fontFamily: Fonts.SemiBold,
    textAlign: "center",
    fontSize: 18,
  },
});

export default TopCuisinesScreen;
