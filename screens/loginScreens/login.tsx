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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { Feather } from "@expo/vector-icons";
import Colors from "../../utils/colors";
import { useAuth } from "../../context/auth.context";
import { Fonts } from "../../utils/fonts";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { user, login, sendVerificationEmail, forgotPassword } = useAuth();
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordIsVisible, setPasswordIsVisible] = useState(false);

  const handleSignIn = async () => {
    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();

      if (!emailTrimmed || !passwordTrimmed) {
        Alert.alert(t("login.login.loginFail"), t("login.login.loginFailMessage"));
        return;
      }

      const { needsVerification } = await login(emailTrimmed, passwordTrimmed);

      if (needsVerification) {
        Alert.alert(
          t("login.login.emailError"),
          t("login.login.emailErrorMessage"),
          [
            {
              text: t("general.cancel"),
              style: "cancel",
            },
            {
              text: t("login.login.resend"),
              onPress: async () => {
                await sendVerificationEmail();
                Alert.alert(
                  t("login.login.emailSent"),
                  t("login.login.emailSentMessage")
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error(error);
      handleAuthErrors(error);
    }
  };

  const handleAuthErrors = (error: unknown) => {
    let errorMessage = t("login.login.loginError");
    if ((error as any).code.includes("auth/")) {
      switch ((error as any).code) {
        case "auth/wrong-password":
          errorMessage = t("login.login.passwordError");
          break;
        case "auth/user-not-found":
          errorMessage = t("login.login.noUserError");
          break;
        case "auth/invalid-email":
          errorMessage = t("login.login.validEmail");
          break;
        default:
          console.log((error as any).code); // Log unexpected codes
      }
    } else {
      console.log("Firebase Auth Error:", (error as any).message); // Log generic Firebase errors not related to auth
    }
    Alert.alert(t("login.login.loginFail"), errorMessage);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t("login.login.forgotPassword"), t("login.login.forgotPasswordMessage"));
      return;
    }
    try {
      await forgotPassword(email.trim());
      Alert.alert(
        t("login.login.passwordReset"),
        t("login.login.passwordResetMessage")
      );
    } catch (error) {
      if ((error as any).code === "auth/user-not-found") {
        Alert.alert(t("general.error"), t("login.login.noUserError"));
      } else if ((error as any).code === "auth/invalid-email") {
        Alert.alert(t("general.error"), t("login.login.validEmail"));
      } else {
        Alert.alert(t("general.error"), t("login.login.passwordResetFail"));
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/login.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("login.login.email")}
              placeholderTextColor={Colors.placeholderText}
              selectionColor={Colors.placeholderText}
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder={t("login.login.password")}
              secureTextEntry={!passwordIsVisible}
              placeholderTextColor={Colors.placeholderText}
              selectionColor={Colors.placeholderText}
              onChangeText={setPassword}
              value={password}
              keyboardType="default"
              autoCapitalize="none"
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
          <View style={styles.signInButtonContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>{t("login.login.signIn")}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate("SignUp")}
            activeOpacity={1}
          >
            <Text style={styles.registerButtonText}>
            {t("login.login.new")}{" "}
              <Text style={styles.registerButtonTextHighlight}>{t("login.login.signUp")}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword} // Added onPress handler
          >
            <Text style={styles.forgotPasswordButtonText}>
            {t("login.login.forgotPasswordButton")}
            </Text>
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
    backgroundColor: Colors.background,
  },
  logoContainer: {
    flex: 0.45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.05,
  },
  logo: {
    width: width * 0.5,
    height: height * 0.5,
  },
  contentContainer: {
    flex: 0.7,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: width * 0.06,
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
    fontSize: width * 0.04,
    fontFamily: Fonts.Medium,
  },
  passwordInput: {
    textAlign: "left",
  },
  forgotPasswordButton: {
    alignSelf: "center",
    marginTop: height * 0.01,
  },
  passwordVisibleButton: {
    position: "absolute",
    right: width * 0.04,
  },
  forgotPasswordButtonText: {
    color: Colors.text,
    fontSize: width * 0.035,
    fontFamily: Fonts.Medium,
    textAlign: "center",
  },
  signInButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: height * 0.03,
    marginBottom: height * 0.01,
  },
  signInButton: {
    height: height * 0.05,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.4,
    backgroundColor: Colors.text,
  },
  signInButtonText: {
    color: Colors.background,
    fontSize: width * 0.05,
    fontFamily: Fonts.Medium,
  },
  registerButton: {
    alignSelf: "center",
    position: "absolute",
    bottom: height * 0.025,
  },
  registerButtonText: {
    fontSize: width * 0.04,
    color: Colors.text,
    textAlign: "center",
    fontFamily: Fonts.Medium,
  },
  registerButtonTextHighlight: {
    fontSize: width * 0.04,
    color: Colors.highlightText,
    fontFamily: Fonts.Bold,
  },
});
