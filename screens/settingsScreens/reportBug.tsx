import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Keyboard,
  Alert,
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
import { reportBugToJira } from "../../helpers/bugCreation";

const { width, height } = Dimensions.get("window");

const ReportBugScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasChanges(true);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!title || !description) {
      Alert.alert("Error", "Please fill in both the title and description.");
      return;
    }

    try {
      console.log("Attempting to report bug to Jira...");  // Log at the start of the function
      await reportBugToJira(title, description);
      console.log("Bug reported successfully!");  // Log success after Jira response

      // Show success message and navigate back
      Alert.alert("Success", "Bug reported successfully!");
      setHasChanges(false);
      navigation.goBack();
    } catch (error) {
      console.log("Error reporting bug to Jira:", error);  // Log error if caught
      Alert.alert("Error", "Failed to report the bug.");
    }
  };

  return (
    <SafeAreaView edges={["bottom", "top"]} style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress}>
          <CircleArrowLeft size={30} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Report a Bug</Text>
        </View>
      </View>

      <TouchableWithoutFeedback style={styles.infoContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.infoText}>
            Reporting a bug helps us quickly fix issues and improve the app's performance for a smoother experience. 
            Your feedback makes a big difference in keeping the app running well for you and others!
        </Text>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback style={styles.inputContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.inputHeader}>Title</Text>

        <TextInput
            style={[styles.input]}
            placeholder="add a title"
            placeholderTextColor={Colors.placeholderText}
            value={title}
            onChangeText={handleTitleChange}
          />

      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback style={styles.inputContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.inputHeader}>Description</Text>

        <TextInput
            style={[styles.input, styles.inputDescription]}
            placeholder="let us know how the issue occured"
            placeholderTextColor={Colors.placeholderText}
            value={description}
            onChangeText={handleDescriptionChange}
            multiline
          />

      </TouchableWithoutFeedback>

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
          <Text style={styles.saveButtonText}>Send Bug</Text>
        </TouchableOpacity>
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
        backgroundColor: Colors.background,
        marginTop: height * 0.01,
      },
      infoText: {
        paddingHorizontal: width * 0.07,
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
      inputDescription: {
        height: height * 0.2,
        textAlignVertical: "top",
        paddingVertical: height * 0.02,
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
        marginTop: height * 0.08,
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
        marginTop: height * 0.07,
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

export default ReportBugScreen;