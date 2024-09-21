import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft, User } from "lucide-react-native";
import useNotificationStore, {
  NotificationStoreProps,
} from "../../store/useNotificationStore";
import { RootStackParamList } from "../../types/stackParams.types";
import FastImage from "react-native-fast-image";

const { height, width } = Dimensions.get("window");

const NotificationsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { notifications, removeNotification } = useNotificationStore();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleDeleteNotification = (id: string) => {
    removeNotification(id);
  };

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        onPress={() => handleDeleteNotification(id)}
        style={styles.deleteBox}
        activeOpacity={1}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const handleNotificationClick = (notification: NotificationStoreProps) => {
    if (notification.data.userId) {
      navigation.navigate("UserProfile", { userId: notification.data.userId });
      removeNotification(notification.id);
    } else if (notification.data.postId) {
      navigation.navigate("ExpandedPost", { postId: notification.data.postId });
      removeNotification(notification.id);
    }
  };

  return (
    <SafeAreaView
    edges={["bottom", "top"]}
    style={{ flex: 1, backgroundColor: Colors.background }}
  >
      {/* Header Gray Box */}
      <View style={styles.container}>
        {/* Header Gray Box */}
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={handleBackPress}>
            <CircleArrowLeft size={30} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Notification Example */}

        {notifications.length === 0 ? (
          <View style={styles.noNotificationsContainer}>
            <Text style={styles.noNotificationsText}>
              No notifications yet!
            </Text>
          </View>
        ) : (
          <>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationClick(notification)}
              >
                <Swipeable
                  renderRightActions={() => renderRightActions(notification.id)}
                  friction={1}
                  rightThreshold={50}
                >
                  <View style={styles.notificationCard}>
                    {notification.data.profilePicture ? (
                      <FastImage
                        source={{
                          uri: notification.data.profilePicture,
                          cache: FastImage.cacheControl.immutable,
                        }}
                        style={styles.avatar}
                      />
                    ) : (
                      <User style={styles.avatar} color={Colors.text} />
                    )}
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.username}>@{notification.title}</Text>
                      <Text style={styles.notificationText}>
                        {notification.message}
                      </Text>
                    </View>
                  </View>
                </Swipeable>
              </TouchableOpacity>
            ))}
          </>
        )}
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
    fontSize: height * 0.033,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginBottom: height * 0.01,
    marginTop: height * 0.01,
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.6,
  },
  noNotificationsText: {
    fontFamily: Fonts.Medium,
    fontSize: height * 0.024,
    color: Colors.placeholderText,
  },
  separator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: width * 0.9,
    alignSelf: "center",
    opacity: 0.2,
    marginBottom: height * 0.02,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: width * 0.035,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginHorizontal: width * 0.07,
    marginTop: height * 0.015,
    borderColor: Colors.placeholderText,
    borderWidth: 0.4,
  },
  avatar: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 90,
    marginRight: width * 0.03,
  },
  notificationTextContainer: {
    flex: 1,
  },
  username: {
    fontFamily: Fonts.SemiBold,
    fontSize: height * 0.02,
    color: Colors.text,
  },
  notificationText: {
    fontSize: height * 0.018,
    fontFamily: Fonts.Regular,
  },
  deleteBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: width * 0.035,
    paddingHorizontal: width * 0.05,
    backgroundColor: Colors.tags,
    borderRadius: 12,
    marginRight: width * 0.07,
    marginLeft: -width * 0.06,
    marginTop: height * 0.015,
    borderColor: Colors.tags,
    borderWidth: 0.4,
  },
  deleteText: {
    color: Colors.buttonText,
    fontFamily: Fonts.Bold,
    fontSize: height * 0.02,
  },
});

export default NotificationsScreen;
