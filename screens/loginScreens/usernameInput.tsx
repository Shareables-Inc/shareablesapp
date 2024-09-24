import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";

const { width, height } = Dimensions.get("window");

export default function UserNameInputScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("there"); // Default name if not fetched
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null); // New state for username check
  const [usernameValid, setUsernameValid] = useState<boolean>(true); // Username validation state
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

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

  const validateUsername = (username: string) => {
    const noInvalidSymbols = /^[a-zA-Z0-9._\-]*$/; // Only allow letters, numbers, ., _, and -
    const noMoreThanTwoInARow = /(?!.*([._\-])\1{2})/; // Ensure ., _, and - don't repeat more than twice
    const noSpaces = !/\s/.test(username); // No spaces allowed
    const minLength = username.length >= 3; // Minimum length of 3 characters
    const validFormat =
      noInvalidSymbols.test(username) && noMoreThanTwoInARow.test(username) && noSpaces;

    return validFormat && minLength;
  };

  const handleUsernameChange = (text: string) => {
    const formattedText = text.replace(/\s+/g, "").toLowerCase(); // Remove spaces and convert to lowercase

    setUserName(formattedText);

    // Clear previous debounce timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Debounce the username validation and availability check
    const newTimeout = setTimeout(() => {
      const isValid = validateUsername(formattedText);
      setUsernameValid(isValid);

      if (isValid) {
        checkUsernameAvailability(formattedText);
      } else {
        setUsernameAvailable(null);
      }
    }, 3000); // 3-second delay before checking

    setDebounceTimeout(newTimeout);
  };

  const checkUsernameAvailability = async (username: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));

    try {
      const querySnapshot = await getDocs(q);
      setUsernameAvailable(querySnapshot.empty); // If empty, username is available
    } catch (error) {
      console.error("Firestore Error:", error);
    }
  };

  const handleNextStep = async () => {
    if (userName.trim() === "") {
      Alert.alert("Username Required", "Please enter a username to continue.");
      return;
    }

    if (!usernameValid) {
      Alert.alert("Invalid Username", "Please enter a valid username.");
      return;
    }

    if (!usernameAvailable) {
      Alert.alert("Username Unavailable", "Please choose a different username.");
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backArrowContainer}>
          <Text>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Let's create your username, {firstName}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={Colors.placeholderText}
          value={userName}
          onChangeText={handleUsernameChange}
          autoCapitalize="none"
        />
        {usernameValid === false && (
          <Text style={styles.errorText}>
            Invalid username: no spaces or special characters (except ., _, -, $) and must be at least 3 characters long.
          </Text>
        )}
        {usernameAvailable !== null && usernameAvailable && usernameValid && (
          <Text style={styles.successText}>Username is available!</Text>
        )}
        {usernameAvailable === false && (
          <Text style={styles.errorText}>Username is already taken.</Text>
        )}
      </View>

      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextStep}
          activeOpacity={1}
          disabled={usernameAvailable === false || usernameAvailable === null || !usernameValid}
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
    paddingHorizontal: width * 0.05,
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
    left: width * 0.08,
    top: height * 0.1,
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: Fonts.SemiBold,
    marginBottom: height * 0.05,
    marginTop: -height * 0.1,
    width: width * 0.8,
    justifyContent: "flex-start",
    textAlign: "left",
  },
  inputContainer: {
    width: width * 0.85,
    borderWidth: 0.3,
    borderColor: Colors.inputBackground,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    height: height * 0.058,
    marginBottom: height * 0.025,
    paddingHorizontal: width * 0.03,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: width * 0.04,
    fontFamily: Fonts.Medium,
  },
  errorText: {
    color: Colors.circleAlert,
    marginTop: 10,
  },
  successText: {
    color: Colors.circleCheck,
    marginTop: 10,
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
    fontSize: width * 0.055,
    fontFamily: Fonts.Bold,
  },
});
