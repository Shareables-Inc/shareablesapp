import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";
import { useUserGetByUid, useUserUpdatePreferences } from "../../hooks/useUser";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const NotificationsSettingsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { data: userProfile } = useUserGetByUid(user?.uid || "");
  const { mutate: updatePreferences } = useUserUpdatePreferences();
  const {t} = useTranslation();

  const [preferences, setPreferences] = useState({
    notifications: false,
    reviewReminders: false,
    newFollowers: false,
    likesOnPosts: false,
    commentsOnPosts: false,
    friendPosts: false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setPreferences({
        notifications:
          userProfile.reviewReminder ||
          userProfile.newFollowerNotification ||
          userProfile.likeNotification ||
          userProfile.commentOnPostNotification ||
          userProfile.friendPostsNotification ||
          false,
        reviewReminders: userProfile.reviewReminder || false,
        newFollowers: userProfile.newFollowerNotification || false,
        likesOnPosts: userProfile.likeNotification || false,
        commentsOnPosts: userProfile.commentOnPostNotification || false,
        friendPosts: userProfile.friendPostsNotification || false,
      });
    }
  }, [userProfile]);

  const toggleSwitch = (setting: keyof typeof preferences) => {
    setPreferences((prev) => {
      const newPreferences = { ...prev, [setting]: !prev[setting] };
  
      if (setting === "notifications") {
        if (!newPreferences.notifications) {
          // Turn off all other preferences if notifications are turned off
          Object.keys(newPreferences).forEach((key) => {
            if (key !== "notifications")
              newPreferences[key as keyof typeof preferences] = false;
          });
        } else {
          // Turn on all other preferences if notifications are turned on
          Object.keys(newPreferences).forEach((key) => {
            if (key !== "notifications")
              newPreferences[key as keyof typeof preferences] = true;
          });
        }
      }
  
      return newPreferences;
    });
    setHasChanges(true);
  };
  

  const handleSave = async () => {
    if (!hasChanges || !user) return;

    updatePreferences({
      uid: user.uid,
      preferences: {
        notifications: preferences.notifications,
        reviewReminders: preferences.reviewReminders,
        newFollowers: preferences.newFollowers,
        likesOnPosts: preferences.likesOnPosts,
        commentsOnPosts: preferences.commentsOnPosts,
        friendPosts: preferences.friendPosts,
      },
    });
    setHasChanges(false);
  };

  return (
    <SafeAreaView edges={["bottom", "top"]} style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <CircleArrowLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t("settings.notificationSettings.notifications")}</Text>
          </View>
        </View>

        <TouchableWithoutFeedback style={styles.infoContainer} onPress={Keyboard.dismiss}>
          <Text style={styles.infoText}>{t("settings.notificationSettings.description")}</Text>
        </TouchableWithoutFeedback>

        <View>
          <View style={styles.allowNotificationsContainer}>
            <Text style={styles.bodyText}>{t("settings.notificationSettings.allow")}</Text>
            <Switch
              trackColor={{ false: Colors.highlightText, true: Colors.highlightText }}
              thumbColor={preferences.notifications ? Colors.background : Colors.background}
              onValueChange={() => toggleSwitch("notifications")}
              value={preferences.notifications}
            />
          </View>

          <View style={styles.PreferencesContainer}>
            <Text style={styles.PreferencesText}>{t("settings.notificationSettings.preferences")}</Text>

            {/* Review Reminders */}
            <View style={styles.preferenceContainer}>
              <Text style={[styles.bodyText, !preferences.notifications && styles.disabledText]}>
              {t("settings.notificationSettings.reminders")}
              </Text>
              <Switch
                trackColor={{ false: Colors.highlightText, true: Colors.highlightText }}
                thumbColor={preferences.notifications ? Colors.background : Colors.background}
                onValueChange={() => toggleSwitch("reviewReminders")}
                value={preferences.reviewReminders}
                disabled={!preferences.notifications} // Disable when notifications are off
              />
            </View>

            <View style={styles.separatorSmall} />

            {/* New Followers */}
            <View style={styles.preferenceContainer}>
              <Text style={[styles.bodyText, !preferences.notifications && styles.disabledText]}>
              {t("settings.notificationSettings.followers")}
              </Text>
              <Switch
                trackColor={{ false: Colors.highlightText, true: Colors.highlightText }}
                thumbColor={preferences.notifications ? Colors.background : Colors.background}
                onValueChange={() => toggleSwitch("newFollowers")}
                value={preferences.newFollowers}
                disabled={!preferences.notifications} // Disable when notifications are off
              />
            </View>

            <View style={styles.separatorSmall} />

            {/* Likes on Posts */}
            <View style={styles.preferenceContainer}>
              <Text style={[styles.bodyText, !preferences.notifications && styles.disabledText]}>
              {t("settings.notificationSettings.likes")}
              </Text>
              <Switch
                trackColor={{ false: Colors.highlightText, true: Colors.highlightText }}
                thumbColor={preferences.notifications ? Colors.background : Colors.background}
                onValueChange={() => toggleSwitch("likesOnPosts")}
                value={preferences.likesOnPosts}
                disabled={!preferences.notifications} // Disable when notifications are off
              />
            </View>

            <View style={styles.separatorSmall} />

            {/* Comments on Posts */}
            <View style={styles.preferenceContainer}>
              <Text style={[styles.bodyText, !preferences.notifications && styles.disabledText]}>
              {t("settings.notificationSettings.comments")}
              </Text>
              <Switch
                trackColor={{ false: Colors.highlightText, true: Colors.highlightText }}
                thumbColor={preferences.notifications ? Colors.background : Colors.background}
                onValueChange={() => toggleSwitch("commentsOnPosts")}
                value={preferences.commentsOnPosts}
                disabled={!preferences.notifications} // Disable when notifications are off
              />
            </View>

            <View style={styles.separatorSmall} />

            {/* Friend Posts */}
            <View style={styles.preferenceContainer}>
              <Text style={[styles.bodyText, !preferences.notifications && styles.disabledText]}>
              {t("settings.notificationSettings.friend")}
              </Text>
              <Switch
                trackColor={{ false: Colors.highlightText, true: Colors.highlightText }}
                thumbColor={preferences.notifications ? Colors.background : Colors.background}
                onValueChange={() => toggleSwitch("friendPosts")}
                value={preferences.friendPosts}
                disabled={!preferences.notifications} // Disable when notifications are off
              />
            </View>
          </View>
        </View>

        {hasChanges && (
          <Text style={styles.unsavedChangesText}>{t("settings.notificationSettings.unsaved")}</Text>
        )}

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>{t("settings.notificationSettings.save")}</Text>
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
  infoText: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    paddingHorizontal: width * 0.07,
    marginTop: height * 0.01,
  },
  allowNotificationsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    width: "100%",
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.07,
    paddingTop: height * 0.035,
    marginBottom: 10,
  },
  PreferencesContainer: {
    backgroundColor: Colors.background,
    width: width,
    paddingTop: height * 0.02,
    paddingHorizontal: width * 0.07,
    paddingBottom: height * 0.15,
  },
  PreferencesText: {
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
  disabledText: {
    color: Colors.inputBackground,
  },
  preferenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
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
  saveButtonDisabled: {
    opacity: 0.5,
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    backgroundColor: Colors.tags,
    alignSelf: "center",
    position: "absolute",
    bottom: height * 0.1,
  },
  unsavedChangesText: {
    color: Colors.tags,
    textAlign: "center",
    fontFamily: Fonts.Regular,
    fontSize: width * 0.032,
    position: "absolute",
    bottom: height * 0.165,
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
    bottom: height * 0.1,
  },
  saveButtonText: {
    color: Colors.buttonText,
    fontSize: width * 0.04,
    fontFamily: Fonts.Bold,
  },
});

export default NotificationsSettingsScreen;
