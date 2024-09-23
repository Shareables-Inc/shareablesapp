import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import Colors from "../../utils/colors";
import { auth } from "../../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Fonts } from "../../utils/fonts";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState(""); // Only email input now
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordIsVisible, setPasswordIsVisible] = useState(false);
  const [confirmPasswordIsVisible, setConfirmPasswordIsVisible] =
    useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please make sure your passwords match.");
      return;
    }

    try {
      // Sign up with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      navigation.navigate("VerifyEmail");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Create Account</Text>

        <View style={styles.contentContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.placeholderText}
              selectionColor={Colors.placeholderText}
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              secureTextEntry={!passwordIsVisible}
              placeholderTextColor={Colors.placeholderText}
              selectionColor={Colors.placeholderText}
              onChangeText={setPassword}
              value={password}
            />
            <TouchableOpacity
              style={styles.passwordVisibleButton}
              onPress={() => setPasswordIsVisible(!passwordIsVisible)}
            >
              <Feather
                name={passwordIsVisible ? "eye" : "eye-off"}
                size={20}
                color={Colors.placeholderText}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm Password"
              secureTextEntry={!confirmPasswordIsVisible}
              placeholderTextColor={Colors.placeholderText}
              selectionColor={Colors.placeholderText}
              onChangeText={setConfirmPassword}
              value={confirmPassword}
              keyboardType="default"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.passwordVisibleButton}
              onPress={() =>
                setConfirmPasswordIsVisible(!confirmPasswordIsVisible)
              }
            >
              <Feather
                name={confirmPasswordIsVisible ? "eye" : "eye-off"}
                size={20}
                color={Colors.placeholderText}
              />
            </TouchableOpacity>
          </View>

          {/* Next Button */}
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleSignUp}
              activeOpacity={1}
            >
              <Text style={styles.nextButtonText}>Next Step</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: Colors.background,
  },
  cancelButton: {
    position: "absolute",
    top: height * 0.1,
    left: width * 0.1,
  },
  cancelButtonText: {
    fontSize: width * 0.045,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
  },
  logoContainer: {
    flex: 0.35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.05,
    marginTop: height * 0.12,
  },
  logo: {
    width: width * 0.2,
    height: height * 0.2,
  },
  title: {
    fontSize: width * 0.08,
    color: Colors.text,
    marginBottom: height * 0.05,
    fontFamily: Fonts.SemiBold,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: width * 0.05,
  },
  inputContainer: {
    width: width * 0.8,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    height: height * 0.058,
    marginBottom: height * 0.025,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.04,
  },
  input: {
    flex: 0.9,
    color: Colors.text,
    fontSize: width * 0.04,
    fontFamily: Fonts.Medium,
  },
  passwordInput: {
    textAlign: "left",
    fontFamily: Fonts.Medium,
  },
  passwordVisibleButton: {
    position: "absolute",
    right: width * 0.04,
  },
  nextButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: height * 0.05,
  },
  nextButton: {
    height: height * 0.05,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.4,
    backgroundColor: Colors.tags,
  },
  nextButtonText: {
    color: Colors.background,
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
  },
});
