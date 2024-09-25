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
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft, CircleCheck, CircleAlert } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function UserNameInputScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("there");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

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

  // Helper function for validation
  const validateUsername = (username: string) => {
    // Rule 1: No spaces in the middle or end
    if (/\s/.test(username)) return "Username must not contain any spaces";

    // Rule 2: Disallowed characters
    const disallowedChars = /[@:'"(){}[\]=~•&^%#!+;"<>\/?,]/;
    if (disallowedChars.test(username)) return "Username contains invalid symbols";

    // Rule 3: Allowed special characters 
    if (/(\.\.|__|--|\$\$)/.test(username)) return "Username must not have three symbols in a row";

    // Rule 4: Minimum length of 3 characters
    if (username.length < 3) return "Username must be at least 3 characters long";

    // Rule 5: Username must not be more than 25 characters
    if (username.length > 25) return "Username must not be more than 25 characters";

    return null; // No validation errors
  };

  const handleUsernameChange = async (text: string) => {
    const formattedText = text.toLowerCase().trim();
    setUserName(formattedText);
    setUsernameAvailable(null);

    const validationError = validateUsername(formattedText);
    if (validationError) {
      setValidationMessage(validationError);
      setUsernameAvailable(false);
      return;
    }

    setValidationMessage(null);

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", formattedText));

      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
          setValidationMessage("Username is not available");
        }
      } catch (error) {
        console.error("Firestore Error:", error);
      } finally {
        setCheckingUsername(false);
      }
    }, 250); 

    return () => clearTimeout(timer); 
  };

  const handleNextStep = async () => {
    if (!usernameAvailable) {
      Alert.alert("Username Unavailable", validationMessage || "Please choose a different username.");
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "No user found. Please login again.");
      return;
    }

    const userDocRef = doc(db, "users", userId);
    try {
      await setDoc(userDocRef, { username: userName }, { merge: true });
      navigation.navigate("TopCuisines");
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Update Failed", "Failed to save your username. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backArrowContainer}>
            <CircleArrowLeft color={Colors.text} size={30} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          <Text style={styles.heyThereText}>We hope you're doing well, {firstName}.</Text> Let's create your username.
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
          <View style={styles.feedbackContainer}>
            {validationMessage ? (
              <Text style={styles.errorText}>{validationMessage}</Text>
            ) : usernameAvailable !== null && (
              <Text style={usernameAvailable ? styles.successText : styles.errorText}>
                {usernameAvailable ? "Username is available!" : "Username is unavailable."}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.nextButtonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextStep}
            activeOpacity={1}
            disabled={usernameAvailable === false || usernameAvailable === null}
          >
            <Text style={styles.nextButtonText}>Next Step</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    marginBottom: height * 0.015, 
    paddingHorizontal: width * 0.03,
    justifyContent: "center",
    position: "relative", 
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: width * 0.04,
    fontFamily: Fonts.Medium,
  },
  feedbackContainer: {
    position: "absolute",
    bottom: -height * 0.03, 
    right: 0,
  },
  successText: {
    color: Colors.circleCheck,
    marginTop: height * 0.005,
  },
  errorText: {
    color: Colors.circleAlert,
    marginTop: height * 0.005,
  },
  checkingText: {
    color: Colors.placeholderText,
    marginTop: height * 0.005,
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
