import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import Colors from "../../utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const MainSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView
      edges={["bottom", "top"]}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View style={styles.container}>
        {/* Header Gray Box */}
        <View style={styles.headerBox}>
          <TouchableOpacity
            onPress={handleBackPress}
          >
            <CircleArrowLeft size={28} color={Colors.text}/>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.loginSecurityContainer}>
            <Text style={styles.loginSecurityText}>Preferences</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("AccountSettings")}
            >
              <Text style={styles.bodyText}>Account Center</Text>
            </TouchableOpacity>

            <View style={styles.separatorSmall} />

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("NotificationsSettings")}
            >
              <Text style={styles.bodyText}>Notifications</Text>
            </TouchableOpacity>

            <View style={styles.separatorSmall} />

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("PrivacySettings")}
            >
              <Text style={styles.bodyText}>Permissions and Privacy</Text>
            </TouchableOpacity>

            <View style={styles.separatorSmall} />
          </View>

          <View style={styles.feedbackContainer}>
            <Text style={styles.loginSecurityText}>Feedback</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("ReportBug")}
              activeOpacity={1}
            >
              <Text style={styles.bodyText}>Report Bugs</Text>
            </TouchableOpacity>

            <View style={styles.separatorSmall} />

            <TouchableOpacity 
              onPress={() => navigation.navigate("RequestFeature")}
              activeOpacity={1}
            >
              <Text style={styles.bodyText}>Request Features</Text>
            </TouchableOpacity>

            <View style={styles.separatorSmall} />

            {/* <TouchableOpacity activeOpacity={1}>
              <Text style={styles.bodyText}>Leave a Review</Text>
            </TouchableOpacity>

            <View style={styles.separatorSmall} /> */}
          </View>
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
  activityContainer: {
    backgroundColor: Colors.background,
    width: width,
    paddingTop: height * 0.02,
    paddingHorizontal: width * 0.07,
  },
  feedbackContainer: {
    backgroundColor: Colors.background,
    width: width,
    paddingTop: height * 0.02,
    paddingHorizontal: width * 0.07,
  },
});

export default MainSettingsScreen;
