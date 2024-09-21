import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft } from "lucide-react-native";
import { CircleCheck, CircleAlert } from "lucide-react-native";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

const ChangePasswordScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    checkPasswordsMatch(text, confirmPassword);
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    checkPasswordsMatch(newPassword, text);
  };

  const checkPasswordsMatch = (password, confirmPassword) => {
    if (password && confirmPassword && password === confirmPassword) {
      setPasswordsMatch(true);
    } else {
      setPasswordsMatch(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView
        edges={["bottom", "top"]}
        style={{ flex: 1, backgroundColor: Colors.background }}
      >
        <View style={styles.container}>
          <View style={styles.headerBox}>
            <TouchableOpacity
              onPress={handleBackPress}
            >
              <CircleArrowLeft size={28} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Change Password</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Follow the simple steps to set a new, stronger password. Keep your
              account safe and secure with this quick and easy update.
            </Text>
          </View>

          <View style={styles.inputContainerCurrent}>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              placeholderTextColor={Colors.placeholderText}
              secureTextEntry={true}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <View style={styles.passwordRequirementsContainer}>
            <Text style={styles.passwordRequirementsHeaderText}>
              Your new password must meet the following requirements:
            </Text>
            <Text style={styles.passwordRequirementsText}>
              • At least 8 characters
            </Text>
            <Text style={styles.passwordRequirementsText}>
              • At least one uppercase letter (A-Z)
            </Text>
            <Text style={styles.passwordRequirementsText}>
              • At least one lowercase letter (a-z)
            </Text>
            <Text style={styles.passwordRequirementsText}>
              • At least one number (0-9)
            </Text>
            <Text style={styles.passwordRequirementsText}>
              • At least one special character (!@#$%^&*)
            </Text>
          </View>

          <View style={styles.inputContainerNew}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor={Colors.placeholderText}
              secureTextEntry={true}
              value={newPassword}
              onChangeText={handleNewPasswordChange}
            />

            <View style={styles.inputWithIconContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm New Password"
                placeholderTextColor={Colors.placeholderText}
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
              />
              {confirmPassword.length > 0 && (
                <View style={styles.iconContainer}>
                  {passwordsMatch ? (
                    <CircleCheck color={Colors.circleCheck} size={24} />
                  ) : (
                    <CircleAlert color={Colors.circleAlert} size={24} />
                  )}
                </View>
              )}
            </View>

            {confirmPassword.length > 0 && (
              <Text
                style={passwordsMatch ? styles.successText : styles.errorText}
              >
                {passwordsMatch
                  ? "Passwords match!"
                  : "Passwords do not match!"}
              </Text>
            )}

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  infoContainer: {
    paddingHorizontal: width * 0.07,
    backgroundColor: Colors.background,
    marginTop: height * 0.01,
  },
  infoText: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Regular,
  },
  inputContainerCurrent: {
    paddingHorizontal: width * 0.07,
    backgroundColor: Colors.background,
    marginTop: height * 0.02,
  },
  passwordRequirementsContainer: {
    paddingHorizontal: width * 0.07,
    backgroundColor: Colors.background,
    marginTop: height * 0.01,
  },
  passwordRequirementsHeaderText: {
    fontSize: width * 0.04,
    color: Colors.highlightText,
    marginBottom: height * 0.01,
    fontFamily: Fonts.Regular,
  },
  passwordRequirementsText: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    marginBottom: height * 0.01,
  },
  inputContainerNew: {
    paddingHorizontal: width * 0.07,
    backgroundColor: Colors.background,
    marginTop: height * 0.01,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    width: width * 0.86,
    height: height * 0.06,
    borderRadius: 10,
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.04,
  },
  inputWithIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -16 }],
  },
  successText: {
    color: Colors.circleCheck,
  },
  errorText: {
    color: Colors.circleAlert,
  },
  button: {
    backgroundColor: Colors.highlightText,
    width: width * 0.25,
    height: height * 0.05,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: height * 0.04,
  },
  buttonText: {
    fontSize: width * 0.04,
    color: Colors.background,
    fontFamily: Fonts.Bold,
  },
});

export default ChangePasswordScreen;
