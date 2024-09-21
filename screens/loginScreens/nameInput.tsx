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
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ChevronDown } from "lucide-react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

export default function NameInputScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("Nearest City");
  const [dropdownLayout, setDropdownLayout] = useState({ width: 0, x: 0, y: 0 });
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const locationTabRef = useRef(null);

  const locations = ["Toronto", "Mississauga", "Brampton", "Hamilton", "Montreal", "Ottawa"];

  useLayoutEffect(() => {
    if (locationTabRef.current) {
      locationTabRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownLayout({ width, x: pageX, y: pageY + height });
      });
    }
  }, [showLocationDropdown]);

  const handleLocationSelection = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  const handleNextStep = async () => {
    if (firstName.trim() === "") {
      Alert.alert("Required", "Please enter your first name.");
      return;
    }

    if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
      Alert.alert("Invalid Input", "Please enter a valid phone number with digits only.");
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "No user found. Please login again.");
      return;
    }

    const userDocRef = doc(db, "users", userId);
    try {
      await setDoc(
        userDocRef,
        {
          userId: userId,
          email: auth.currentUser?.email,
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          location: selectedLocation !== "Nearest City" ? selectedLocation : null,
          createdAt: serverTimestamp(),
          onboardingComplete: false,
        },
        { merge: true }
      );

      navigation.navigate("UsernameInput");
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Update Failed", "Failed to save your details. Please try again.");
    }
  };

  const availableHeight = height - dropdownLayout.y - height * 0.075;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.innerContainer}>
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5} style={styles.backArrowContainer}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              <Text style={styles.heyThereText}>Hey there!</Text> Let's set up your profile.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor={Colors.placeholderText}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <Text style={styles.requiredText}>Required</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor={Colors.placeholderText}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.placeholderText}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Location Dropdown */}
        <TouchableOpacity
          ref={locationTabRef}
          style={styles.inputContainer}
          onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          activeOpacity={0.7}
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
                top: dropdownLayout.y - height * 0.075,
                maxHeight: availableHeight,
                zIndex: 1000,
              },
            ]}
          >
            <ScrollView>
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
        <Text style={styles.requiredTextCity}>Required</Text>

        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNextStep} activeOpacity={0.7}>
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
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  innerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    width: "100%",
  },
  headerBox: {
    width: width,
    position: "absolute",
    top: height * 0,
    backgroundColor: Colors.background,
    height: height * 0.075,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backArrowContainer: {
    position: "absolute",
    left: "8%",
    top: "80%"
  },
  cancelText: {
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    fontSize: 20,
  },
  title: {
    fontSize: 35,
    fontFamily: Fonts.SemiBold,
    marginBottom: height * 0.05,
    width: width * 0.8,
    justifyContent: "flex-start",
    textAlign: "left",
    marginTop: height * 0.15,
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
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.Medium,
  },
  requiredText: {
    color: Colors.highlightText,
    fontFamily: Fonts.Regular,
    fontSize: 14,
    marginBottom: height * 0.02,
    alignSelf: "flex-end",
    marginRight: width * 0.015,
    marginTop: -(height * 0.02),
  },
  requiredTextCity: {
    color: Colors.highlightText,
    fontFamily: Fonts.Regular,
    fontSize: 14,
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
    fontSize: 24,
    fontFamily: Fonts.Bold,
  },
  locationText: {
    color: Colors.placeholderText,
    fontFamily: Fonts.Medium,
    fontSize: 16,
    flex: 1,
  },
  dropdown: {
    position: "absolute",
    backgroundColor: Colors.inputBackground,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBackground,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.profileTopPlaces,
    fontFamily: Fonts.Medium,
    fontSize: 16,
    color: Colors.inputBackground,
  },
  dropdownItemText: {
    color: Colors.text,
    fontFamily: Fonts.Medium,
    fontSize: 16,
  },
});
