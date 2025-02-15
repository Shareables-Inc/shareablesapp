import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useNavigation,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import { db } from "../../firebase/firebaseConfig";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { CircleArrowLeft, CircleCheck } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";
import { UserProfile } from "../../models/userProfile"; // Import UserProfile model
import { FollowingService } from "../../services/following.service";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

interface RouteParams {
  userContacts: string[]; // Assuming this is an array of phone numbers
}

const FollowFriendsScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "FollowFriends">;
}) => {
  const { user, refreshUserProfile } = useAuth();
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [visibleFriends, setVisibleFriends] = useState<UserProfile[]>([]);
  const [fadeAnims, setFadeAnims] = useState<Animated.Value[]>([]);
  const [nextFriendIndex, setNextFriendIndex] = useState<number>(4);
  const { userContacts } = route.params;
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});


  const handleBackPress = () => {
    navigation.goBack();
  };

  const normalizePhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
  };

  const fetchMatchingUsers = async (phoneNumbers: string[]) => {
    const normalizedNumbers = phoneNumbers.map(normalizePhoneNumber);
    const uniqueNumbers = [...new Set(normalizedNumbers)];
    const chunks = [];
    for (let i = 0; i < uniqueNumbers.length; i += 10) {
      chunks.push(uniqueNumbers.slice(i, i + 10));
    }
  
    try {
      const usersRef = collection(db, "users");
      const matchingUsers: UserProfile[] = [];
      const followingService = new FollowingService();
  
      // Fetch the list of already followed users
      const followedIds = await followingService.getFollowing(user!.uid);
      console.log("Followed user IDs:", followedIds);
  
      for (const chunk of chunks) {
        const q = query(usersRef, where("phoneNumber", "in", chunk));
        const querySnapshot = await getDocs(q);
  
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as UserProfile;
  
          // Add document ID as the user ID
          userData.id = doc.id;
  
          console.log("Fetched user:", userData);
  
          const isCurrentUser = userData.email?.toLowerCase() === user?.email?.toLowerCase();
          const isAlreadyFollowed = followedIds.includes(userData.id);
  
          if (!isCurrentUser && !isAlreadyFollowed && !matchingUsers.find(u => u.username === userData.username)) {
            matchingUsers.push(userData);
            console.log("Added user:", userData.username);
          } else {
            console.log("Excluded user:", userData.username);
          }
        });
      }
  
      setFriends(matchingUsers);
      setVisibleFriends(matchingUsers.slice(0, 4));
      setFadeAnims(matchingUsers.slice(0, 4).map(() => new Animated.Value(1)));
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert(t("general.error"), t("login.followFriends.fetchError"));
    }
  };
  
  
  
  useEffect(() => {
    if (userContacts && userContacts.length > 0) {
      fetchMatchingUsers(userContacts);
    }
  }, [userContacts]);

  const handleNext = async () => {
    navigation.navigate("LetsGo")
  };

  const handleFollow = async (index: number) => {
    const userToFollow = visibleFriends[index];
    if (!userToFollow || !userToFollow.id) {
      console.error("User to follow has no ID:", userToFollow);
      Alert.alert(t("general.error"), t("login.followFriends.followError"));
      return;
    }
  
    try {
      await new FollowingService().followUser(user!.uid, userToFollow.id);
  
      setFollowedUsers((prev) => ({
        ...prev,
        [userToFollow.id]: true,
      }));
  
      Animated.timing(fadeAnims[index], {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setVisibleFriends((prevVisibleFriends) => {
          const updatedVisibleFriends = [...prevVisibleFriends];
          if (nextFriendIndex < friends.length) {
            updatedVisibleFriends[index] = friends[nextFriendIndex];
            setNextFriendIndex(nextFriendIndex + 1);
            fadeAnims[index].setValue(1);
          } else {
            updatedVisibleFriends.splice(index, 1);
            fadeAnims.splice(index, 1);
          }
          return updatedVisibleFriends;
        });
      });
  
      console.log(`User ${userToFollow.username} successfully followed.`);
    } catch (error) {
      console.error("Error following user:", error);
      Alert.alert(t("general.error"), t("login.followFriends.followError"));
    }
  };
  
  
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backArrowContainer}>
          <CircleArrowLeft color={Colors.text} size={30} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{t("login.followFriends.title")}</Text>
      <Text style={styles.description}>
        {t("login.followFriends.description")}
      </Text>

      {visibleFriends.length > 0 ? (
        <View style={styles.friendsContainer}>
          {visibleFriends.map((friend, index) => (
            <Animated.View
              key={index}
              style={[styles.contactCard, { opacity: fadeAnims[index] }]}
            >
              <Image
                source={{ uri: friend.profilePicture }}
                style={styles.profileImage}
              />
            <TouchableOpacity
              style={[
                styles.inviteButton,
                followedUsers[friend.id] && styles.followedButton, // Style for followed state
              ]}
              activeOpacity={1}
              onPress={() => handleFollow(index)}
              disabled={followedUsers[friend.id]} // Disable if already followed
            >
              {followedUsers[friend.id] ? (
                <CircleCheck color={Colors.background} size={20} />
              ) : (
                <Text style={styles.inviteButtonText}>{t("login.followFriends.follow")}</Text>
              )}
            </TouchableOpacity>
              <Text style={styles.contactName}>@{friend.username}</Text>
              <Text
                style={styles.contactNumber}
              >{`${friend.firstName} ${friend.lastName}`}</Text>
            </Animated.View>
          ))}
        </View>
      ) : (
        <View style={styles.noFriendsContainer}>
          <Text style={styles.noFriendsText}>
            {t("login.followFriends.searching")}
          </Text>
        </View>
      )}

      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={1}
        >
          <Text style={styles.nextButtonText}>{t("login.followFriends.letsGo")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  headerBox: {
    width: width,
    position: "absolute",
    top: 0,
    backgroundColor: Colors.background,
    height: height * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrowContainer: {
    position: "absolute",
    left: "7%",
    top: "100%",
  },
  backArrow: {
    width: 35,
    height: 35,
  },
  title: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    marginBottom: 15,
    width: width * 0.9,
    justifyContent: "center",
    textAlign: "left",
    position: "absolute",
    top: height * 0.16,
    left: width * 0.07,
  },
  description: {
    fontSize: 22,
    textAlign: "left",
    width: width * 0.95,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
    position: "absolute",
    top: height * 0.26,
    left: width * 0.07,
  },
  friendsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: width * 0.9,
    marginTop: height * 0.17,
  },
  contactCard: {
    width: width * 0.42,
    margin: 5,
    backgroundColor: Colors.tags,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 7,
    borderColor: Colors.inputBackground,
    borderWidth: 2,
  },
  contactName: {
    fontSize: 18,
    fontFamily: Fonts.SemiBold,
    color: Colors.background,
  },
  contactNumber: {
    fontSize: 16,
    color: Colors.background,
    fontFamily: Fonts.Medium,
  },
  inviteButton: {
    backgroundColor: Colors.background,
    paddingVertical: 6,
    paddingHorizontal: 23,
    borderRadius: 30,
    marginTop: 5,
    marginBottom: 10,
  },
  inviteButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.Medium,
  },
  noFriendsContainer: {
    width: width * 0.75,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    maxHeight: height * 0.1,
    borderRadius: 10,
  },
  noFriendsText: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  nextButtonContainer: {
    width: width * 1,
    marginTop: height * 0.02,
    position: "absolute",
    bottom: height * 0.12,
  },
  nextButton: {
    height: height * 0.055,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.35,
    position: "absolute",
    right: width * 0.1,
    backgroundColor: Colors.text,
  },
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: 24,
    fontFamily: Fonts.Bold,
  },
  followedButton: {
    backgroundColor: Colors.followed,
  },
  
});

export default FollowFriendsScreen;
