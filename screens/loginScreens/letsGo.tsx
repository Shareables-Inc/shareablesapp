import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Text,
} from "react-native";
import {
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { db } from "../../firebase/firebaseConfig";
import { updateDoc, doc } from "firebase/firestore";
import { useAuth } from "../../context/auth.context";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const LetsGoScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const { user, refreshUserProfile } = useAuth();

  const handleNext = async () => {
    await updateDoc(doc(db, "users", user!.uid), {
      onboardingComplete: true,
    });
    await refreshUserProfile();
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabNavigator" }],
    });
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/welcome.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleNext}
        style={styles.letsGoButton}
      >
        <Text style={styles.letsGoText}>{t("login.letsGo.startSharing")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  letsGoButton: {
    position: "absolute",
    bottom: height * 0.2,
    alignSelf: "center",
    backgroundColor: Colors.text,
    paddingVertical: width * 0.04,
    paddingHorizontal: width * 0.06,
    borderRadius: 30,
  },
  letsGoText: {
    fontSize: width * 0.055,
    fontFamily: Fonts.Bold,
    color: Colors.background
  },
});

export default LetsGoScreen;
