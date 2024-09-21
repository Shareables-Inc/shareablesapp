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
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";

const { width, height } = Dimensions.get("window");

interface RouteParams {
  userContacts: string[]; // Assuming this is an array of phone numbers
}

interface Friend {
  profilePicture?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface Props {
  route: {
    params: RouteParams;
  };
}

const FollowFriendsScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "FollowFriends">;
}) => {
  const { user, refreshUserProfile } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [visibleFriends, setVisibleFriends] = useState<Friend[]>([]);
  const [fadeAnims, setFadeAnims] = useState<Animated.Value[]>([]);
  const [nextFriendIndex, setNextFriendIndex] = useState<number>(4);
  const { userContacts } = route.params;

  const normalizePhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const normalized = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
    console.log(
      `Original phone number: ${phoneNumber}, Cleaned phone number: ${cleaned}, Normalized (10 digits only) phone number: ${normalized}`
    );
    return normalized;
  };

  const fetchMatchingUsers = async (phoneNumbers: string[]) => {
    console.log("Received phone numbers for matching:", phoneNumbers);

    const normalizedNumbers = phoneNumbers.map(normalizePhoneNumber);
    console.log("All normalized phone numbers:", normalizedNumbers);

    const uniqueNumbers = [...new Set(normalizedNumbers)];
    console.log("Unique normalized numbers:", uniqueNumbers);

    const chunkSize = 30;
    const chunks = [];

    for (let i = 0; i < uniqueNumbers.length; i += chunkSize) {
      chunks.push(uniqueNumbers.slice(i, i + chunkSize));
    }

    try {
      const usersRef = collection(db, "users");
      const matchingUsers: Friend[] = [];

      for (const chunk of chunks) {
        const q = query(usersRef, where("phoneNumber", "in", chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          matchingUsers.push(doc.data() as Friend);
        });
      }

      console.log("Matching users found:", matchingUsers);
      setFriends(matchingUsers);
      setVisibleFriends(matchingUsers.slice(0, 4));
      setFadeAnims(matchingUsers.slice(0, 4).map(() => new Animated.Value(1)));
    } catch (error) {
      console.error("Firestore Query Error:", error);
      Alert.alert(
        "Fetch Error",
        "Unable to fetch user data. Please try again."
      );
    }
  };

  useEffect(() => {
    if (userContacts && userContacts.length > 0) {
      console.log("userContacts received:", userContacts);
      fetchMatchingUsers(userContacts);
    }
  }, [userContacts]);

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

  const handleFollow = (index: number) => {
    Animated.timing(fadeAnims[index], {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setVisibleFriends((prevVisibleFriends) => {
        const updatedVisibleFriends = [...prevVisibleFriends];
        if (nextFriendIndex < friends.length) {
          updatedVisibleFriends[index] = friends[nextFriendIndex];
          setNextFriendIndex(nextFriendIndex + 1);
          fadeAnims[index].setValue(1); // Reset the animation value for reuse
        } else {
          updatedVisibleFriends.splice(index, 1);
          fadeAnims.splice(index, 1);
        }
        return updatedVisibleFriends;
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backArrowContainer}
        >
          <ArrowLeft color={Colors.text} size={35} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Look who's already on Shareables!</Text>
      <Text style={styles.description}>
        Follow them to curate your recommendations.
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
                style={styles.inviteButton}
                activeOpacity={1}
                onPress={() => handleFollow(index)}
              >
                <Text style={styles.inviteButtonText}>follow</Text>
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
            Searching for your friends...
          </Text>
        </View>
      )}

      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={1}
        >
          <Text style={styles.nextButtonText}>Let's Go!</Text>
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
    backgroundColor: Colors.contactCard,
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
    borderColor: Colors.background,
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
    paddingVertical: 8,
    paddingHorizontal: 30,
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
});

export default FollowFriendsScreen;
