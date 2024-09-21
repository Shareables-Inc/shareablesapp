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
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Colors from "../../utils/colors";
import { auth } from "../../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { Fonts } from "../../utils/fonts";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

export default function SignUpScreen() {
  {
    /* Navigation, Email, Password, Confirm Password */
  }
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordIsVisible, setPasswordIsVisible] = useState(false);
  const [confirmPasswordIsVisible, setConfirmPasswordIsVisible] =
    useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please make sure your passwords match."
      );
      return;
    }
    try {
      // Create User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Send Verification Email
      sendEmailVerification(userCredential.user)
        .then(() => {
          console.log("Verification email sent.");
          // Navigate to Verify Email Screen
          navigation.navigate("VerifyEmail");
        })
        .catch((error) => {
          console.error("Failed to send verification email", error);
          Alert.alert(
            "Email Verification Failed",
            "Unable to send verification email. Please try again later."
          );
        });
    } catch (error) {
      console.error(error);

      // Error Handling
      if ((error as any).code === "auth/email-already-in-use") {
        Alert.alert(
          "Email Already in Use",
          "The email address is already in use by another account."
        );
      } else {
        Alert.alert(
          "Sign Up Failed",
          "An error occurred during sign up. Please try again."
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

        {/* OR Container */}
        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        {/* Google Button Container */}
        <View style={styles.socialButtonsContainer}>
          {/* Google Login Button */}
          <TouchableOpacity style={styles.socialButton}>
            <Image
              style={styles.socialLogo}
              source={require("../../assets/images/googleLogo.png")}
            />
            <Text style={styles.socialText}>Google</Text>
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
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.2,
    height: height * 0.2,
  },
  title: {
    fontSize: 35,
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
    fontFamily: Fonts.Medium,
  },
  passwordVisibleButton: {
    position: "absolute",
    right: width * 0.04,
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
    marginTop: height * 0.013,
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
    width: width * 0.45,
    backgroundColor: Colors.text,
  },
  nextButtonText: {
    color: Colors.background,
    fontSize: 20,
    fontFamily: Fonts.Medium,
  },
});
