import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../../utils/colors";
import { auth } from "../../firebase/firebaseConfig";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Modal from "react-native-modal";
import { Fonts } from "../../utils/fonts";
import { db } from "../../firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/auth.context";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordIsVisible, setPasswordIsVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const { login, sendVerificationEmail } = useAuth();
  const handleSignIn = async () => {
    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();

      if (!emailTrimmed || !passwordTrimmed) {
        Alert.alert("Login Failed", "Please enter your email and password.");
        return;
      }

      const { needsVerification } = await login(emailTrimmed, passwordTrimmed);

      if (needsVerification) {
        Alert.alert(
          "Email Not Verified",
          "Your email is not verified. Would you like to resend the verification email?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Resend",
              onPress: async () => {
                await sendVerificationEmail();
                Alert.alert(
                  "Verification Email Sent",
                  "Please check your inbox and verify your email."
                );
              },
            },
          ]
        );
      }
      // If email is verified, navigation will be handled by the MainApp component
    } catch (error) {
      console.error(error);
      handleAuthErrors(error);
    }
  };

  const handleAuthErrors = (error: unknown) => {
    let errorMessage = "Login failed. Please try again.";
    if ((error as any).code.includes("auth/")) {
      switch ((error as any).code) {
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/user-not-found":
          errorMessage = "No user found with this email. Please sign up.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        default:
          console.log((error as any).code); // Log unexpected codes
      }
    } else {
      console.log("Firebase Auth Error:", (error as any).message); // Log generic Firebase errors not related to auth
    }
    Alert.alert("Login Failed", errorMessage);
    setIsErrorModalVisible(true);
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        Alert.alert(
          "Verification Email Sent",
          "Please check your email for the verification link."
        );
      } catch (error) {
        console.error("Failed to send verification email", error);
        Alert.alert(
          "Failed to Send Verification Email",
          "An error occurred while sending the verification email. Please try again."
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.placeholderText}
            selectionColor={Colors.placeholderText}
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
          />
        </View>
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
        <TouchableOpacity style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordButtonText}>Forgot password?</Text>
        </TouchableOpacity>
        <View style={styles.signInButtonContainer}>
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* OR Line Container */}
        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        {/* Google Button Container */}
        <View style={styles.socialButtonsContainer}>
          {/* Google Button */}
          <TouchableOpacity style={styles.socialButton} activeOpacity={1}>
            <Image
              style={styles.socialLogo}
              source={require("../../assets/images/googleLogo.png")}
            />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("SignUp")}
          activeOpacity={1}
        >
          <Text style={styles.registerButtonText}>
            New to Shareables?{" "}
            <Text style={styles.registerButtonTextHighlight}>Sign Up!</Text>
          </Text>
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
    backgroundColor: Colors.background,
  },
  logoContainer: {
    flex: 0.45,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.3,
    height: height * 0.3,
  },
  contentContainer: {
    flex: 0.7,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: width * 0.06,
    marginTop: -(height * 0.03),
  },
  inputContainer: {
    width: width * 0.8,
    borderWidth: 0.3,
    borderColor: Colors.inputBackground,
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
    fontSize: 16,
    fontFamily: Fonts.Medium,
  },
  passwordInput: {
    textAlign: "left",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: -(height * 0.01),
    marginBottom: height * 0.02,
  },
  passwordVisibleButton: {
    position: "absolute",
    right: width * 0.04,
  },
  forgotPasswordButtonText: {
    color: "black",
    fontSize: 15,
    fontFamily: Fonts.Medium,
    position: "absolute",
    right: width * 0.07,
  },
  signInButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: height * 0.05,
  },
  signInButton: {
    height: height * 0.05,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.45,
    backgroundColor: Colors.text,
  },
  signInButtonText: {
    color: Colors.background,
    fontSize: 20,
    fontFamily: Fonts.Medium,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: height * 0.025,
    marginBottom: height * 0.025,
  },
  orLine: {
    height: 1,
    backgroundColor: Colors.placeholderText,
    flex: 1,
    marginTop: height * 0.017,
  },
  orText: {
    color: Colors.placeholderText,
    marginHorizontal: width * 0.03,
    marginTop: height * 0.017,
    fontSize: 16,
    alignSelf: "center",
    fontFamily: Fonts.Light,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.02,
  },
  socialButton: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: width * 0.028,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  socialLogo: {
    width: 25,
    height: 25,
  },
  socialText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.SemiBold,
    marginLeft: width * 0.03,
  },
  registerButton: {
    alignSelf: "center",
    position: "absolute",
    bottom: height * 0.025,
  },
  registerButtonText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    fontFamily: Fonts.Medium,
  },
  registerButtonTextHighlight: {
    fontSize: 16,
    color: Colors.highlightText,
    fontFamily: Fonts.Bold,
  },
});
