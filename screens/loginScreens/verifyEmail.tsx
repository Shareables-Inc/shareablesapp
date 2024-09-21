import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Color from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import Colors from "../../utils/colors";
import { MailWarning } from "lucide-react-native";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

export default function VerifyEmailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  {
    /* Navigation */
  }
  const navigateToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Main Message */}
      <View style={styles.iconContainer}>
        <MailWarning style={styles.icon} />
      </View>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.description}>
        We have sent a verification email to confirm your information.
      </Text>

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
    fontSize: 35,
    fontFamily: Fonts.SemiBold,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 20,
    width: "70%",
    color: Color.text,
    fontFamily: Fonts.Medium,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 30,
  },
  icon: {
    width: 110,
    height: 110,
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
