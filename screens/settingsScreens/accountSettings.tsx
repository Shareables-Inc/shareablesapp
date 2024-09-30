import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft } from "lucide-react-native";
import { auth } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/auth.context";
import { Alert } from "react-native";

const { width, height } = Dimensions.get("window");

const AccountSettingsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Logout",
          onPress: async () => {
            try {
              await logout();
             
              // Reset navigation stack and navigate to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.error("Error signing out: ", error);
              Alert.alert(
                "Logout Error",
                "An error occurred while logging out. Please try again."
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView
      edges={["bottom", "top"]}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View style={styles.container}>
        {/* Header Gray Box */}
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={handleBackPress}>
            <CircleArrowLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Account</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.loginSecurityContainer}>
            <Text style={styles.loginSecurityText}>Login & Security</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <Text style={styles.bodyText}>Change Password</Text>
            </TouchableOpacity>
            <View style={styles.separatorSmall} />
            <TouchableOpacity activeOpacity={1} onPress={handleLogout}>
              <Text style={styles.bodyText}>Logout</Text>
            </TouchableOpacity>
            <View style={styles.separatorSmall} />
          </View>

          <View style={styles.personalDetailsContainer}>
            <Text style={styles.loginSecurityText}>Personal Details</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text style={styles.bodyText}>Edit Profile</Text>
            </TouchableOpacity>
            <View style={styles.separatorSmall} />

          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBox: {
    backgroundColor: Colors.background,
    height: height * 0.08,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: width * 0.07,
    justifyContent: "space-between",
  },
  headerTitleContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingRight: width * 0.07,
  },
  headerTitle: {
    fontSize: width * 0.07,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginBottom: height * 0.01,
    marginTop: height * 0.01,
  },
  separatorSmall: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: width * 0.85,
    alignSelf: "flex-start",
    opacity: 0.2,
    marginBottom: height * 0.02,
    marginTop: height * 0.015,
  },
  loginSecurityContainer: {
    backgroundColor: Colors.background,
    width: width,
    paddingTop: height * 0.02,
    paddingHorizontal: width * 0.07,
  },
  loginSecurityText: {
    fontSize: width * 0.04,
    color: Colors.highlightText,
    marginBottom: height * 0.02,
    fontFamily: Fonts.Regular,
  },
  bodyText: {
    fontSize: width * 0.05,
    color: Colors.text,
    fontFamily: Fonts.Medium,
  },
  feedbackContainer: {
    backgroundColor: Colors.background,
    width: width,
    paddingTop: height * 0.02,
    paddingHorizontal: width * 0.07,
  },
  personalDetailsContainer: {
    backgroundColor: Colors.background,
    width: width,
    paddingTop: height * 0.02,
    paddingHorizontal: width * 0.07,
  },
});

export default AccountSettingsScreen;
