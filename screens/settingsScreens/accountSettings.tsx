import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert
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
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser, getAuth } from "firebase/auth";
import { deleteDoc, doc, getDocs, query, collection, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const AccountSettingsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleLogout = async () => {
    Alert.alert(
      t("settings.accountSettings.logout"),
      t("settings.accountSettings.logoutAlert"),
      [
        {
          text: t("general.cancel"),
          style: "cancel",
        },
        {
          text: t("settings.accountSettings.logoutConfirm"),
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
                t("settings.accountSettings.logoutError"),
                t("settings.accountSettings.logoutErrorMessage")
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
    
  const handleDeactivate = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user || !user.email) {
      Alert.alert(t("general.error"), t("settings.accountSettings.deactivateError"));
      return;
    }
  
    // Reauthenticate user with password
    let password: string = "";
  
    Alert.prompt(
      t("settings.accountSettings.password"),
      t("settings.accountSettings.passwordConfirm"),
      [
        { text: t("general.cancel"), style: "cancel" },
        {
          text: t("general.confirm"),
          onPress: async (input: string | undefined) => {
            if (!input) {
              Alert.alert(t("general.error"), t("settings.accountSettings.passwordError"));
              return;
            }
  
            password = input;
  
            try {
              // Confirm Authentication
              const credential = EmailAuthProvider.credential(user.email as string, password);
              await reauthenticateWithCredential(user, credential);
              console.log("User successfully reauthenticated.");
  
              // Alert to Confirm Deactivation
              Alert.alert(
                t("settings.accountSettings.deactivateAccount"),
                t("settings.accountSettings.deactivateMessage"),
                [
                  { text: t("general.cancel"), style: "cancel" },
                  {
                    text: t("general.deactivate"),
                    onPress: async () => {
                      try {
                        const userId = user.uid;
                        console.log("Starting account deletion for user:", userId);
  
                        // Collections With userId in Field
                        const collections = [
                          { name: "posts", field: "userId" },
                          { name: "comments", field: "userId" },
                          { name: "likes", field: "userId" },
                          { name: "following", fields: ["followerId", "followingId"] },
                        ];
  
                        // Delete Documents
                        for (const col of collections) {
                          const colRef = collection(db, col.name);
                          console.log(`Deleting from collection: ${col.name}`);
  
                          if (col.fields) {
                            for (const field of col.fields) {
                              const q = query(colRef, where(field, "==", userId));
                              const snapshot = await getDocs(q);
  
                              for (const docSnapshot of snapshot.docs) {
                                await deleteDoc(doc(db, col.name, docSnapshot.id));
                              }
                            }
                          } else {
                            const q = query(colRef, where(col.field, "==", userId));
                            const snapshot = await getDocs(q);
  
                            for (const docSnapshot of snapshot.docs) {
                              await deleteDoc(doc(db, col.name, docSnapshot.id));
                            }
                          }
                        }
  
                        // Delete User Saves and Stats
                        await deleteDoc(doc(db, "userSaves", userId));
                        await deleteDoc(doc(db, "userStats", userId));
  
                        // Delete User
                        await deleteDoc(doc(db, "users", userId));
  
                        // Remove Authentication
                        await deleteUser(user);
  
                        console.log("Account successfully deleted.");

                        // Logout
                        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                      } catch (error) {
                        console.error("Error during deletion:", error);
                        Alert.alert(t("general.error"), t("settings.accountSettings.deactivateFail"));
                      }
                    },
                  },
                ],
                { cancelable: false }
              );
            } catch (error) {
              console.error("Reauthentication failed:", error);
              Alert.alert(t("settings.accountSettings.reauthError"), t("settings.accountSettings.reauthMessage"));
            }
          },
        },
      ],
      "secure-text"
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
            <Text style={styles.headerTitle}>{t("settings.accountSettings.account")}</Text>
          </View>
        </View>

        <View style={styles.personalDetailsContainer}>
            <Text style={styles.loginSecurityText}>{t("settings.accountSettings.personal")}</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text style={styles.bodyText}>{t("settings.accountSettings.edit")}</Text>
            </TouchableOpacity>
            <View style={styles.separatorSmall} />

          </View>


          <View style={styles.loginSecurityContainer}>
            <Text style={styles.loginSecurityText}>{t("settings.accountSettings.login")}</Text>
            {/* <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <Text style={styles.bodyText}>Change Password</Text>
            </TouchableOpacity>
            <View style={styles.separatorSmall} /> */}
            <TouchableOpacity activeOpacity={1} onPress={handleLogout}>
              <Text style={styles.bodyText}>{t("settings.accountSettings.logout")}</Text>
            </TouchableOpacity>
            <View style={styles.separatorSmall} />
          </View>

          <View style={styles.deactivateContainer}>
            <TouchableOpacity activeOpacity={1} onPress={handleDeactivate} style={styles.deactivateButton}>
              <Text style={styles.deactivateText}>{t("settings.accountSettings.deactivate")}</Text>
            </TouchableOpacity>
          </View>

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
  deactivateContainer: {
    position: "absolute",
    bottom: height * 0.1,
    alignSelf: "center",
    justifyContent: "center"
  },
  deactivateButton: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 15,
    textAlign: "center",
  },
  deactivateText: {
    fontSize: width * 0.05,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    paddingVertical: 10,
    paddingHorizontal: 20
  }
});

export default AccountSettingsScreen;
