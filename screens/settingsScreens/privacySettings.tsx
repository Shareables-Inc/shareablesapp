import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Linking,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft, SquareArrowOutUpRight } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const PrivacySettingsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isPrivateAccountEnabled, setPrivateAccountEnabled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const openDeviceSettings = () => {
    Linking.openSettings(); 
  };

  return (
    <SafeAreaView edges={["bottom", "top"]} style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={handleBackPress}>
            <CircleArrowLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Privacy</Text>
          </View>
        </View>

        <TouchableWithoutFeedback style={styles.infoContainer} onPress={Keyboard.dismiss}>
          <Text style={styles.infoText}>
            Our app uses your location to provide tailored recommendations and improve your experience by showing you relevant content.
            We use your photos to create a profile picture and to help you share your experiences with the community.
          </Text>
        </TouchableWithoutFeedback>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.preferencesContainer}>
            <Text style={styles.preferencesText}>Device Permissions</Text>

            {/* <View style={styles.preferenceContainer}>
              <Text style={styles.bodyText}>Private Account</Text>
              <Switch
                trackColor={{ false: Colors.highlightText, true: Colors.highlightText }}
                thumbColor={isPrivateAccountEnabled ? Colors.background : Colors.background}
                onValueChange={() => toggleSwitch("privateAccount")}
                value={isPrivateAccountEnabled}
              />
            </View>

            <View style={styles.separatorSmall} /> */}

            {/* Allow Location Services */}
            <View style={styles.preferenceContainer}>
              <Text style={styles.bodyText}>Allow Location Services</Text>
              <TouchableOpacity onPress={openDeviceSettings}>
                <SquareArrowOutUpRight size={24} color={Colors.tags} />
              </TouchableOpacity>
            </View>

            <View style={styles.separatorSmall} />

            {/* Photo Access */}
            <View style={styles.preferenceContainer}>
              <Text style={styles.bodyText}>Photo Access</Text>
              <TouchableOpacity onPress={openDeviceSettings}>
                <SquareArrowOutUpRight size={24} color={Colors.tags} />
              </TouchableOpacity>
            </View>

            <View style={styles.separatorSmall} />
            </View>

            {/* <View style={styles.preferencesContainer}>
              <Text style={styles.preferencesText}>Policies</Text>


            <View style={styles.preferenceContainer}>
              <Text style={styles.bodyText}>Privacy Policy</Text>
              <TouchableOpacity>
                <SquareArrowOutUpRight size={24} color={Colors.tags} />
              </TouchableOpacity>
            </View>

            <View style={styles.separatorSmall} />


            <View style={styles.preferenceContainer}>
              <Text style={styles.bodyText}>Terms of Service</Text>
              <TouchableOpacity>
                <SquareArrowOutUpRight size={24} color={Colors.tags} />
              </TouchableOpacity>
            </View>

            <View style={styles.separatorSmall} />

          </View> */}
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
  infoContainer: {
    paddingHorizontal: width * 0.07,
    backgroundColor: Colors.background,
    marginTop: height * 0.01,
  },
  infoText: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    paddingHorizontal: width * 0.07,
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
  },
  preferencesContainer: {
    backgroundColor: Colors.background,
    width: "100%",
    paddingTop: height * 0.02,
    paddingHorizontal: width * 0.07,
  },
  preferencesText: {
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
  separatorSmall: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: "100%",
    alignSelf: "flex-start",
    opacity: 0.2,
    marginBottom: height * 0.02,
    marginTop: height * 0.015,
  },
  preferenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    width: "100%",
  },
  unsavedChangesText: {
    color: Colors.tags,
    textAlign: "center",
    fontFamily: Fonts.Regular,
    fontSize: height * 0.015,
    position: "absolute",
    bottom: height * 0.15,
    alignSelf: "center",
  },
  saveButton: {
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    backgroundColor: Colors.tags,
    alignSelf: "center",
    position: "absolute",
    bottom: height * 0.12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.buttonText,
    fontSize: height * 0.02,
    fontFamily: Fonts.Bold,
  },
});

export default PrivacySettingsScreen;
