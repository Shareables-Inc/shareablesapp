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
  Modal,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import Colors from "../../utils/colors";
import { auth } from "../../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Fonts } from "../../utils/fonts";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [email, setEmail] = useState(""); // Only email input now
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordIsVisible, setPasswordIsVisible] = useState(false);
  const [confirmPasswordIsVisible, setConfirmPasswordIsVisible] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert(
        t("login.signUp.passwordMatch"),
        t("login.signUp.passwordMatchMessage")
      );
      return;
    }
    if (!agreeToTerms) {
      Alert.alert(
        t("login.signUp.termsRequired") || "Terms Required",
        t("login.signUp.termsRequiredMessage") ||
          "Please agree to our Terms of Service to continue."
      );
      return;
    }

    try {
      // Sign up with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      navigation.navigate("VerifyEmail");
    } catch (error: any) {
      console.error(error);
      Alert.alert(t("login.signUp.signUpFail"), error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="auto" />

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.cancelButtonText}>{t("general.cancel")}</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/createAccount.png")}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.title}>{t("login.signUp.create")}</Text>

        <View style={styles.contentContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("login.signUp.email")}
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
              placeholder={t("login.signUp.password")}
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
              placeholder={t("login.signUp.confirm")}
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
              onPress={() => setConfirmPasswordIsVisible(!confirmPasswordIsVisible)}
            >
              <Feather
                name={confirmPasswordIsVisible ? "eye" : "eye-off"}
                size={20}
                color={Colors.placeholderText}
              />
            </TouchableOpacity>
          </View>

          {/* Terms of Service & Privacy Policy Checkbox */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              {agreeToTerms && (
                <Feather name="check" size={18} color={Colors.tags} />
              )}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              {t("login.signUp.agreeTo")}{" "}
              <Text style={styles.linkText} onPress={() => setShowTerms(true)}>
                {t("login.signUp.termsLink") || "Terms of Service"}
              </Text>{" "}
              <Text style={styles.termsText}>
                {t("login.signUp.and")}{" "}
              </Text>
              <Text style={styles.linkText} onPress={() => setShowPrivacy(true)}>
                {t("login.signUp.privacyLink") || "Privacy Policy"}
              </Text>
            </Text>
          </View>

          {/* Next Button - disabled if terms not agreed */}
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                !agreeToTerms && styles.nextButtonDisabled
              ]}
              onPress={handleSignUp}
              activeOpacity={1}
              disabled={!agreeToTerms}
            >
              <Text style={styles.nextButtonText}>{t("general.nextStep")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal for Terms of Service WebView */}
        <Modal visible={showTerms} animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTerms(false)}>
                <Feather name="x" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("login.signUp.termsTitle") || "Terms of Service"}
              </Text>
            </View>
            <WebView source={{ uri: "https://shareablesapp.com/policies/terms-of-service.pdf" }} />
          </SafeAreaView>
        </Modal>

        {/* Modal for Privacy Policy WebView */}
        <Modal visible={showPrivacy} animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPrivacy(false)}>
                <Feather name="x" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {t("login.signUp.privacyTitle") || "Privacy Policy"}
              </Text>
            </View>
            <WebView source={{ uri: "https://shareablesapp.com/policies/privacy-policy.pdf" }} />
          </SafeAreaView>
        </Modal>
      </View>
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
    zIndex: 100,
  },
  cancelButtonText: {
    fontSize: width * 0.05,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
  },
  logoContainer: {
    flex: 0.85,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width, 
    height: height * 0.6,
    marginTop: -(width * 0.12),
  },
  title: {
    fontSize: width * 0.09,
    color: Colors.text,
    marginBottom: height * 0.03,
    fontFamily: Fonts.SemiBold,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: width * 0.05,
  },
  inputContainer: {
    width: width * 0.75,
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
  termsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingLeft: width * 0.1,
    paddingRight: width * 0.1,
    marginBottom: height * 0.025,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.tags,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: Colors.background,
  },
  termsText: {
    fontSize: width * 0.035,
    color: Colors.text,
    fontFamily: Fonts.Medium,
  },
  linkText: {
    textDecorationLine: "underline",
    color: Colors.tags || "blue",
  },
  nextButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: height * 0.05,
  },
  nextButton: {
    height: width * 0.13,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.37,
    backgroundColor: Colors.text,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.inputBackground || "#ccc",
  },
  nextButtonText: {
    color: Colors.background,
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: Colors.inputBackground,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontFamily: Fonts.SemiBold,
    marginLeft: 16,
    color: Colors.text,
  },
});
