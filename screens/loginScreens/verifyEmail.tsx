import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Color from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import Colors from "../../utils/colors";
import { MailWarning, RotateCw } from "lucide-react-native";
import { auth } from "../../firebase/firebaseConfig";
import { sendEmailVerification } from "firebase/auth";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

export default function VerifyEmailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isSending, setIsSending] = useState(false); // State to track resend email process

  const navigateToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleResendVerificationEmail = async () => {
    setIsSending(true); // Disable button while sending
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        Alert.alert("Email Sent", "A verification email has been resent.");
      } else {
        Alert.alert("Error", "No user is currently signed in.");
      }
    } catch (error: any) {
      console.error("Resend email error:", error);
      Alert.alert("Error", error.message);
    }
    setIsSending(false); // Re-enable button after sending
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Main Message */}
      <View style={styles.iconContainer}>
        <MailWarning size={width * 0.15} color={Colors.text} />
      </View>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.description}>
        We have sent you a verification email to confirm your information.
      </Text>

      {/* Resend Verification Email Button */}
      <View style={styles.resendButtonContainer}>
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendVerificationEmail}
          disabled={isSending} // Disable button while sending
        >
          <Text style={styles.resendButtonText}>
            {isSending ? "Sending..." : (
              <>
                <RotateCw size={width * 0.04} color={Colors.text} style={{marginRight: width * 0.01}} />
                {"Resend Email"}
              </>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Next Button */}
      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={navigateToLogin}
          activeOpacity={1}
        >
          <Text style={styles.nextButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.background,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "-40%",
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: Fonts.SemiBold,
  },
  description: {
    fontSize: width * 0.04,
    textAlign: "center",
    marginHorizontal: width * 0.05,
    marginTop: height * 0.01,
    width: "70%",
    color: Color.text,
    fontFamily: Fonts.Medium,
  },
  iconContainer: {
    position: "relative",
    marginBottom: height * 0.02,
  },
  resendButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: height * 0.01,
  },
  resendButton: {
    height: height * 0.03,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.6,
    backgroundColor: Colors.background,
  },
  resendButtonText: {
    color: Colors.text,
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
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
