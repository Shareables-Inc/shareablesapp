import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Colors from "../../utils/colors";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { useAuth } from "../../context/auth.context";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft } from "lucide-react-native";
import { FollowingService } from "../../services/following.service";
import { UserService } from "../../services/user.service";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const FollowerListScreen = ({ route }: any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();  
  const { user } = useAuth();
  const { userId: profileUserId } = route.params || {};
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const userService = new UserService();
  const followingService = new FollowingService();

  // Use either the profileUserId (from params) or the logged-in user's ID
  const currentUserId = profileUserId || user!.uid;

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [followersCount, followingCount] = await Promise.all([
          followingService.getFollowersCount(currentUserId),
          followingService.getFollowingCount(currentUserId),
        ]);
        setFollowerCount(followersCount);
        setFollowingCount(followingCount);
      } catch (error) {
        console.error("Error fetching followers/following count:", error);
      }
    };

    fetchCounts();
  }, [currentUserId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "following" && following.length === 0) {
          const followingList = await followingService.getFollowing(currentUserId);
          const detailedFollowing = await Promise.all(
            followingList.map(async (userId: string) => {
              const userProfile = await userService.getUserByUid(userId);
              return userProfile;
            })
          );
          setFollowing(detailedFollowing);
        } else if (activeTab === "followers" && followers.length === 0) {
          const followersList = await followingService.getFollowersList(currentUserId);
          const detailedFollowers = await Promise.all(
            followersList.map(async (userId: string) => {
              const userProfile = await userService.getUserByUid(userId);
              return userProfile;
            })
          );
          setFollowers(detailedFollowers);
        }
      } catch (error) {
        console.error("Error fetching followers/following:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, currentUserId]);

  const renderUserItem = (userProfile: any) => (
    <View style={styles.profileItem} key={userProfile.id}>
      <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { userId: userProfile.id })}>
        <Image
          source={{
            uri: userProfile.profilePicture || "https://example.com/default-profile.jpg",
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>@{userProfile.username}</Text>
        <Text style={styles.profileDetails}>
          {userProfile.firstName} {userProfile.lastName} • {userProfile.location || "No location"}
        </Text>
      </View>
    </View>
  );

  const renderUserList = (users: any[]) => users.map((user) => renderUserItem(user));

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress}>
          <CircleArrowLeft size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "followers" && styles.activeTab]}
          onPress={() => setActiveTab("followers")}
        >
          <Text style={[styles.tabText, activeTab === "followers" && styles.activeTabText]}>
            {t("profile.followerList.followers")} ({followerCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "following" && styles.activeTab]}
          onPress={() => setActiveTab("following")}
        >
          <Text style={[styles.tabText, activeTab === "following" && styles.activeTabText]}>
            {t("profile.followerList.following")} ({followingCount})
          </Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.highlightText} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView>
          {activeTab === "followers" && renderUserList(followers)}
          {activeTab === "following" && renderUserList(following)}
        </ScrollView>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    backgroundColor: Colors.background,
  },
  headerBox: {
    backgroundColor: Colors.background,
    height: height * 0.08,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: height * 0.1,
    marginBottom: width * 0.1,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: width * 0.05,
  },
  tab: {
    marginHorizontal: width * 0.1,
    paddingBottom: 5,
  },
  activeTab: {
    borderBottomColor: Colors.tags,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: width * 0.045,
    color: Colors.text,
    fontFamily: Fonts.Medium,
  },
  activeTabText: {
    color: Colors.tags,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: 90,
    marginRight: width * 0.03,
    borderColor: Colors.profileBorder,
    borderWidth: 1,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: width * 0.045,
    fontFamily: Fonts.Regular,
  },
  profileDetails: {
    color: Colors.text,
    fontSize: width * 0.035,
    fontFamily: Fonts.Light,
  },
});

export default FollowerListScreen;
