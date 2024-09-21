import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { ArrowLeft } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function UserNameInputScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userName, setUserName] = useState("");
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

  const handleBackPress = async () => {
    await auth.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleNextStep = async () => {
    if (userName.trim() === "") {
      Alert.alert("Username Required", "Please enter a username to continue.");
      return;
    }

    // Get the current user's ID from Firebase Authentication
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "No user found. Please login again.");
      return;
    }

    // Reference to the user's document in Firestore
    const userDocRef = doc(db, "users", userId);

    try {
      // Update the user's document with the username
      await setDoc(
        userDocRef,
        {
          username: userName.trim(),
        },
        { merge: true }
      ); // Use merge to not overwrite existing fields

      navigation.navigate("TopCuisines"); // Navigate to the next screen
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert(
        "Update Failed",
        "Failed to save your username. Please try again."
      );
    }
  };

  const handleUsernameChange = (text: string) => {
    // Convert entire string to lowercase before setting it
    const formattedText = text.toLowerCase();
    setUserName(formattedText);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backArrowContainer}
        >
          <ArrowLeft style={styles.backArrow} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        <Text style={styles.heyThereText}>
          We hope you're doing well, {firstName}.
        </Text>{" "}
        Let's create your username.
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={Colors.placeholderText}
          value={userName}
          onChangeText={handleUsernameChange}
          autoCapitalize="none"
        />
      </View>

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
}

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
    fontSize: 35,
    marginBottom: height * 0.05,
    width: width * 0.85,
    justifyContent: "center",
    textAlign: "left",
    fontFamily: Fonts.Bold,
  },
  heyThereText: {
    color: Colors.highlightText,
    fontFamily: Fonts.SemiBold,
  },
  inputContainer: {
    width: width * 0.85,
    borderWidth: 0.3,
    borderColor: Colors.inputBackground,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    height: height * 0.058,
    marginBottom: height * 0.025,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.Medium,
  },
  nextButtonContainer: {
    width: "100%",
    marginTop: height * 0.05,
    marginLeft: "17%",
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
    fontSize: 24,
    fontFamily: Fonts.Bold,
  },
});
