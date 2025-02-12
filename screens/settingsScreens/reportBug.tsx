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
  ActivityIndicator,
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
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const ReportBugScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

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
      Alert.alert(t("general.error"), t("settings.reportBug.fillError"));
      return;
    }
  
    try {
      setLoading(true); // Start loading
      await reportBugToJira(title, description);
      Alert.alert(t("general.success"), t("settings.reportBug.success"));
      setHasChanges(false);
      setLoading(false); // Stop loading
      navigation.goBack();
    } catch (error) {
      console.log("Error reporting bug to Jira:", error);
      Alert.alert(t("general.error"), t("settings.reportBug.failed"));
      setLoading(false); // Stop loading in case of error
    }
  };
  

  return (
    <SafeAreaView edges={["bottom", "top"]} style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress}>
          <CircleArrowLeft size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t("settings.reportBug.bugReport")}</Text>
        </View>
      </View>

      <TouchableWithoutFeedback style={styles.infoContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.infoText}>{t("settings.reportBug.description")}</Text>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback style={styles.inputContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.inputHeader}>{t("settings.reportBug.title")}</Text>

        <TextInput
            style={[styles.input]}
            placeholder={t("settings.reportBug.titleMessage")}
            placeholderTextColor={Colors.placeholderText}
            value={title}
            onChangeText={handleTitleChange}
          />

      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback style={styles.inputContainer} onPress={Keyboard.dismiss}>
        <Text style={styles.inputHeader}>{t("settings.reportBug.bugDescription")}</Text>

        <TextInput
            style={[styles.input, styles.inputDescription]}
            placeholder={t("settings.reportBug.bugMessage")}
            placeholderTextColor={Colors.placeholderText}
            value={description}
            onChangeText={handleDescriptionChange}
            multiline
          />

      </TouchableWithoutFeedback>

      {hasChanges && (
        <Text style={styles.unsavedChangesText}>
          {t("settings.reportBug.unsaved")}
        </Text>
      )}

      {loading ? ( // Show loading indicator if request is in progress
        <ActivityIndicator size="large" color={Colors.tags} style={styles.loadingIndicator} />
      ) : (
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          activeOpacity={1}
          onPress={handleSaveChanges}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>{t("settings.reportBug.report")}</Text>
        </TouchableOpacity>
      )}
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
      loadingIndicator: {
        marginTop: height * 0.02, 
      }
});

export default ReportBugScreen;