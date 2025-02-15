import React, { useState, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  Keyboard,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { auth, db, storage } from "../../firebase/firebaseConfig";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ChevronDown } from "lucide-react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

export default function NameInputScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>(t("login.nameInput.nearestCity"));
  const [dropdownLayout, setDropdownLayout] = useState({ width: 0, x: 0, y: 0 });
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const locationTabRef = useRef(null);

  const locations = [
    "Brampton",
    "Burlington",
    "Guelph",
    "Hamilton",
    "Kingston",
    "Laval",
    "London",
    "Markham",
    "Mississauga",
    "Montreal",
    "Niagara",
    "Oakville",
    "Ottawa",
    "Scarborough",
    "Toronto",
    "Waterloo",
    "Windsor",
    "York",
  ];

  useLayoutEffect(() => {
    if (locationTabRef.current) {
      locationTabRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownLayout({ width, x: pageX, y: pageY + height + 1 });
      });
    }
  }, [showLocationDropdown]);

  const handleLocationSelection = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  const DEFAULT_PROFILE_PICTURE_URL = "https://firebasestorage.googleapis.com/v0/b/shareablesapp-b7366.appspot.com/o/profilePictures%2Fuser.png?alt=media&token=c817700c-bbfc-4f0e-99ee-a59a21761117";

  const handleNextStep = async () => {
    if (firstName.trim() === "") {
      Alert.alert(t("general.required"), t("login.nameInput.firstNameError"));
      return;
    }
  
    if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
      Alert.alert(t("general.invalid"), t("login.nameInput.phoneError"));
      return;
    }
  
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert(t("general.error"), t("login.nameInput.noUserError"));
      return;
    }
  
    const userDocRef = doc(db, "users", userId);
    const storageRef = ref(storage, `profilePictures/${userId}`);
  
    try {
      // Fetch the default image from its URL
      const response = await fetch(DEFAULT_PROFILE_PICTURE_URL);
      const blob = await response.blob();
  
      // Upload the default image to the user's unique profile picture path
      await uploadBytes(storageRef, blob);
  
      // Get the download URL for the uploaded image
      const downloadURL = await getDownloadURL(storageRef);
  
      // Save user details to Firestore with the unique profile picture URL
      await setDoc(
        userDocRef,
        {
          userId: userId,
          email: auth.currentUser?.email,
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          location: selectedLocation !== t("login.nameInput.nearestCity") ? selectedLocation : null,
          profilePicture: downloadURL, // Use the uploaded image's URL
          createdAt: serverTimestamp(),
          onboardingComplete: false,
          // Set all notification preferences to true by default
          reviewReminder: true,
          newFollowerNotification: true,
          likeNotification: true,
          commentOnPostNotification: true,
          friendPostsNotification: true,
        },
        { merge: true }
      );
  
      navigation.navigate("UsernameInput");
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert(t("general.updateFail"), t("login.nameInput.saveFail"));
    }
  };

  const availableHeight = height - dropdownLayout.y - height * 0.075;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>
            <Text style={styles.heyThereText}>{t("login.nameInput.heyThere")}</Text> {t("login.nameInput.setUp")}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("login.nameInput.firstName")}
              placeholderTextColor={Colors.placeholderText}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <Text style={styles.requiredText}>{t("general.required")}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("login.nameInput.lastName")}
              placeholderTextColor={Colors.placeholderText}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          <Text style={styles.infoText}>{t("login.nameInput.shown")}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t("login.nameInput.phoneNumber")}
              placeholderTextColor={Colors.placeholderText}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="number-pad"
            />
          </View>
          <Text style={styles.infoText}>{t("login.nameInput.find")}</Text>

        </View>
      </TouchableWithoutFeedback>

      {/* Location Dropdown */}
      <TouchableOpacity
        ref={locationTabRef}
        style={styles.inputContainer}
        onPress={() => setShowLocationDropdown(!showLocationDropdown)}
        activeOpacity={1}
      >
        <Text style={styles.locationText}>{selectedLocation}</Text>
        <ChevronDown color={Colors.placeholderText} size={24} />
      </TouchableOpacity>
      {showLocationDropdown && dropdownLayout.width > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              width: dropdownLayout.width,
              left: dropdownLayout.x,
              top: dropdownLayout.y, // Ensures dropdown is directly below the input
              maxHeight: availableHeight,
              zIndex: 1000,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            {locations.map((location) => (
              <TouchableOpacity
                key={location}
                style={styles.dropdownItem}
                onPress={() => handleLocationSelection(location)}
                activeOpacity={1}
              >
                <Text style={styles.dropdownItemText}>{location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <Text style={styles.requiredTextCity}>{t("general.required")}</Text>

      <View style={styles.nextButtonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNextStep} activeOpacity={1}>
          <Text style={styles.nextButtonText}>{t("general.nextStep")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    width: "100%",
    justifyContent: "center",
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: Fonts.SemiBold,
    marginBottom: height * 0.05,
    width: width * 0.8,
    justifyContent: "flex-start",
    textAlign: "left",
    marginTop: height * 0.12,
  },
  heyThereText: {
    color: Colors.highlightText,
    fontFamily: Fonts.SemiBold,
  },
  inputContainer: {
    width: width * 0.85,
    borderWidth: 0.3,
    borderColor: Colors.inputBackground,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    height: height * 0.058,
    marginBottom: height * 0.025,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.03,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: width * 0.04,
    fontFamily: Fonts.Medium,
  },
  requiredText: {
    color: Colors.highlightText,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.035,
    marginBottom: height * 0.02,
    alignSelf: "flex-end",
    marginRight: width * 0.015,
    marginTop: -(height * 0.02),
  },
  infoText: {
    color: Colors.text,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.035,
    marginBottom: height * 0.02,
    alignSelf: "flex-end",
    marginRight: width * 0.015,
    marginTop: -(height * 0.02),
  },
  requiredTextCity: {
    color: Colors.highlightText,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.035,
    marginBottom: height * 0.02,
    alignSelf: "flex-end",
    marginRight: width * 0.09,
    marginTop: -(height * 0.02),
  },
  nextButtonContainer: {
    width: "100%",
    marginTop: height * 0.05,
    marginLeft: "17%",
  },
  nextButton: {
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    backgroundColor: Colors.text,
  },
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: width * 0.055,
    fontFamily: Fonts.Bold,
  },
  locationText: {
    color: Colors.placeholderText,
    fontFamily: Fonts.Medium,
    fontSize: width * 0.04,
    flex: 1,
  },
  dropdown: {
    position: "absolute",
    backgroundColor: Colors.inputBackground,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBackground,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: width * 0.03,
    paddingVertical: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: Colors.profileTopPlaces,
    fontFamily: Fonts.Medium,
    fontSize: width * 0.04,
    color: Colors.inputBackground,
  },
  dropdownItemText: {
    color: Colors.placeholderText,
    fontFamily: Fonts.Medium,
    fontSize: width * 0.04,
  },
});
