import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { ChevronDown, CircleArrowLeft } from "lucide-react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

const EditProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("Nearest City");
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<number>(0);
  const [inputWidth, setInputWidth] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState(false); // Track unsaved changes
  const locationTabRef = useRef(null);

  const locations = [
    "Brampton", "Burlington", "Guelph", "Hamilton", "Laval", 
    "London", "Markham", "Mississauga", "Montreal", "Oakville", 
    "Ottawa", "Scarborough", "Toronto", "Windsor", "York"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "No user found. Please login again.");
        return;
      }

      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setBio(userData.bio || "");
        setPhoneNumber(userData.phoneNumber || "");
        setSelectedLocation(userData.location || "Nearest City");
      } else {
        Alert.alert("Error", "User data not found.");
      }
    };

    fetchUserData();
  }, []);

  const handleLocationSelection = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
    setHasChanges(true);
  };

  const onLocationLayout = (event: any) => {
    const { y, height, width } = event.nativeEvent.layout;
    setDropdownPosition(y + height + 1); 
    setInputWidth(width); 
  };

  const swearWords = ["badword1", "badword2", "badword3"]; // Add more as needed

  const containsSwearWords = (text: string) => {
    return swearWords.some((word) => text.toLowerCase().includes(word));
  };

  const handleSaveChanges = async () => {
    const nameRegex = /^[A-Za-z]+$/;
  
    if (!firstName.trim().match(nameRegex)) {
      Alert.alert("Invalid Input", "First name is required and can only contain letters.");
      return;
    }
  
    if (selectedLocation === "Nearest City") {
      Alert.alert("Invalid Input", "You must select a city.");
      return;
    }
  
    if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
      Alert.alert("Invalid Input", "Please enter a valid phone number with digits only.");
      return;
    }
  
    if (bio && containsSwearWords(bio)) {
      Alert.alert("Invalid Input", "Your bio contains inappropriate language.");
      return;
    }
  
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "No user found. Please login again.");
      return;
    }
  
    const userDocRef = doc(db, "users", userId);
  
    const updatedData: any = {
      firstName: firstName.trim(),
      location: selectedLocation,
      updatedAt: serverTimestamp(),
    };
  
    updatedData.lastName = lastName.trim() || null;
    updatedData.phoneNumber = phoneNumber.trim() || null;
    updatedData.bio = bio.trim() || null;
  
    try {
      await setDoc(userDocRef, updatedData, { merge: true });
      setHasChanges(false); // Reset changes tracker after save
      navigation.navigate("Profile");
    } catch (error) {
      console.error("Firestore Error:", error);
      Alert.alert("Update Failed", "Failed to save your details. Please try again.");
    }
  };
  
  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    setHasChanges(true);
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    setHasChanges(true);
  };

  const handleBioChange = (text: string) => {
    setBio(text);
    setHasChanges(true);
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    setHasChanges(true);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={["bottom", "top"]} style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress}>
          <CircleArrowLeft size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile Details</Text>
        </View>
      </View>

      <TouchableWithoutFeedback style={styles.infoContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.infoText}>
          Your name and bio will be visible to others. Choosing a location personalizes your feed. 
          Your phone number will only be used for account verification later.
        </Text>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback style={styles.inputContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.inputHeader}>Personal Information</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="First Name"
            placeholderTextColor={Colors.placeholderText}
            value={firstName}
            onChangeText={handleFirstNameChange}
          />

          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Last Name"
            placeholderTextColor={Colors.placeholderText}
            value={lastName}
            onChangeText={handleLastNameChange}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Phone Number"
            placeholderTextColor={Colors.placeholderText}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.inputHeader}>Profile Information</Text>

        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Write your bio here..."
          placeholderTextColor={Colors.placeholderText}
          value={bio}
          onChangeText={handleBioChange}
          multiline
        />
      </TouchableWithoutFeedback>

      <View style={styles.inputContainerLocation}>
        <TouchableOpacity
          ref={locationTabRef}
          style={styles.inputLocation}
          onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          activeOpacity={1}
          onLayout={onLocationLayout} 
        >
          <Text style={styles.locationText}>{selectedLocation}</Text>
          <ChevronDown color={Colors.placeholderText} size={24} />
        </TouchableOpacity>
        {showLocationDropdown && (
          <View
            style={[
              styles.dropdown,
              {
                top: dropdownPosition,
                left: (width - inputWidth) / 2, 
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
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

        {hasChanges && (
          <Text style={styles.unsavedChangesText}>
            You have unsaved changes
          </Text>
        )}

        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          activeOpacity={1}
          onPress={handleSaveChanges}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
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
  inputContainerLocation: {
    paddingHorizontal: width * 0.07,
    backgroundColor: Colors.background,
  },
  infoText: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Regular,
  },
  inputContainer: {
    paddingHorizontal: width * 0.07,
    backgroundColor: Colors.background,
    marginTop: height * 0.01,
  },
  inputHeader: {
    fontSize: width * 0.04,
    color: Colors.highlightText,
    fontFamily: Fonts.SemiBold,
    marginTop: height * 0.02,
    zIndex: -1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: width * 0.41,
    backgroundColor: Colors.inputBackground,
    height: height * 0.06,
    borderRadius: 10,
    paddingHorizontal: width * 0.05,
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
  inputLocation: {
    backgroundColor: Colors.inputBackground,
    width: width * 0.86,
    height: height * 0.06,
    borderRadius: 10,
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
    flexDirection: "row",
    alignItems: "center",
    fontFamily: Fonts.Regular,
    fontSize: width * 0.04,
    zIndex: 1000,
  },
  bioInput: {
    height: height * 0.15,
    textAlignVertical: "top",
    paddingVertical: height * 0.02,
  },
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: width * 0.07,
    fontFamily: Fonts.Bold,
  },
  locationText: {
    color: Colors.placeholderText,
    fontFamily: Fonts.Regular,
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
    width: width * 0.86,
    maxHeight: height * 0.17,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.profileTopPlaces,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.04,
    color: Colors.inputBackground,
  },
  dropdownItemText: {
    color: Colors.placeholderText,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.04,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    backgroundColor: Colors.tags,
    alignSelf: "center",
    marginTop: height * 0.03,
  },
  saveButtonTextDisabled: {
    color: Colors.buttonText,
    fontSize: width * 0.04,
    fontFamily: Fonts.Bold,
  },
  unsavedChangesText: {
    color: Colors.tags,
    textAlign: "center",
    fontFamily: Fonts.Regular,
    fontSize: width * 0.03,
    alignSelf: "center",
    marginTop: height * 0.02,
  },
  saveButton: {
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    backgroundColor: Colors.tags,
    alignSelf: "center",
    marginTop: height * 0.01,
  },
  saveButtonText: {
    color: Colors.buttonText,
    fontSize: width * 0.04,
    fontFamily: Fonts.Bold,
  },
});

export default EditProfileScreen;
