import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react-native";

const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window");

const MailboxScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Received");
  const [sentInvites, setSentInvites] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      fetchSentInvites();
      fetchReceivedInvites();
    }
  }, [userId]);

  const fetchSentInvites = async () => {
    try {
      const sentQuery = query(
        collection(db, "invites"),
        where("inviterId", "==", userId)
      );
      const sentSnapshot = await getDocs(sentQuery);
      const sentData = await Promise.all(
        sentSnapshot.docs.map(async (inviteDoc) => {
          const inviteData = inviteDoc.data();
          const userDoc = await getDoc(doc(db, "users", inviteData.inviteeId));
          const establishmentDoc = await getDoc(
            doc(db, "establishments", inviteData.establishmentId)
          );
          return {
            id: inviteDoc.id,
            ...inviteData,
            inviteeUserName: userDoc.data()?.username,
            inviteeProfilePicture: userDoc.data()?.profilePicture,
            establishmentName: establishmentDoc.data()?.name,
            city: establishmentDoc.data()?.city,
            country: establishmentDoc.data()?.country,
          };
        })
      );
      setSentInvites(sentData);
    } catch (error) {
      console.error("Error fetching sent invites:", error);
    }
  };

  const fetchReceivedInvites = async () => {
    try {
      const receivedQuery = query(
        collection(db, "invites"),
        where("inviteeId", "==", userId)
      );
      const receivedSnapshot = await getDocs(receivedQuery);
      const receivedData = await Promise.all(
        receivedSnapshot.docs.map(async (inviteDoc) => {
          const inviteData = inviteDoc.data();
          const userDoc = await getDoc(doc(db, "users", inviteData.inviterId));
          const establishmentDoc = await getDoc(
            doc(db, "establishments", inviteData.establishmentId)
          );
          return {
            id: inviteDoc.id,
            ...inviteData,
            inviterUserName: userDoc.data()?.username,
            inviterProfilePicture: userDoc.data()?.profilePicture,
            establishmentName: establishmentDoc.data()?.name,
            city: establishmentDoc.data()?.city,
            country: establishmentDoc.data()?.country,
          };
        })
      );
      setReceivedInvites(receivedData);
    } catch (error) {
      console.error("Error fetching received invites:", error);
    }
  };

  const updateInviteStatus = (inviteId, newStatus) => {
    setSentInvites((prevSentInvites) =>
      prevSentInvites.map((invite) =>
        invite.id === inviteId ? { ...invite, status: newStatus } : invite
      )
    );
    setReceivedInvites((prevReceivedInvites) =>
      prevReceivedInvites.map((invite) =>
        invite.id === inviteId ? { ...invite, status: newStatus } : invite
      )
    );
  };

  const handleDeclinePress = async (inviteId) => {
    try {
      await updateDoc(doc(db, "invites", inviteId), { status: "declined" });
      updateInviteStatus(inviteId, "declined");
      Alert.alert("Invite declined");
    } catch (error) {
      console.error("Error declining invite:", error);
    }
  };

  const handleAcceptPress = async (inviteId) => {
    try {
      await updateDoc(doc(db, "invites", inviteId), { status: "accepted" });
      updateInviteStatus(inviteId, "accepted");
      Alert.alert("Invite accepted");
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const navigateToUserProfile = (userId) => {
    navigation.navigate("UserProfile", { userId });
  };

  const navigateToRestaurantProfile = (establishmentId) => {
    navigation.navigate("RestaurantProfile", { establishmentId });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderReceivedContent = () => (
    <>
      {receivedInvites.map((invite: any, index) => (
        <View style={styles.postCard} key={index}>
          <View style={styles.userContainer}>
            <TouchableOpacity
              onPress={() => navigateToUserProfile(invite.inviterId)}
            >
              <Image
                source={{ uri: invite.inviterProfilePicture }}
                style={styles.userImage}
              />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                @{invite.inviterUserName} invites you to
              </Text>
              <Text style={styles.restaurantInfo}>
                {invite.establishmentName} | {invite.city}, {invite.country}
              </Text>
            </View>
            {invite.status === "pending" ? (
              <>
                <TouchableOpacity
                  onPress={() => handleDeclinePress(invite.id)}
                  style={styles.declineButton}
                  activeOpacity={1}
                >
                  <XCircle style={styles.declineIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAcceptPress(invite.id)}
                  style={styles.acceptButton}
                  activeOpacity={1}
                >
                  <CheckCircle style={styles.acceptIcon} />
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={
                  invite.status === "accepted"
                    ? styles.statusContainerAccepted
                    : styles.statusContainerPending
                }
              >
                <Text
                  style={
                    invite.status === "accepted"
                      ? styles.statusTextAccepted
                      : styles.statusTextPending
                  }
                >
                  {invite.status.charAt(0).toUpperCase() +
                    invite.status.slice(1)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigateToRestaurantProfile(invite.establishmentId)}
          >
            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/images/restaurantBackground.png")}
                style={styles.restaurantImage}
              />
            </View>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderSentContent = () => (
    <>
      {sentInvites.map((invite: any, index) => (
        <View style={styles.postCard} key={index}>
          <View style={styles.userContainer}>
            <TouchableOpacity
              onPress={() => navigateToUserProfile(invite.inviteeId)}
            >
              <Image
                source={{ uri: invite.inviteeProfilePicture }}
                style={styles.userImage}
              />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                You invited @{invite.inviteeUserName} to
              </Text>
              <Text style={styles.restaurantInfo}>
                {invite.establishmentName} | {invite.city}, {invite.country}
              </Text>
            </View>
            <View
              style={
                invite.status === "accepted"
                  ? styles.statusContainerAccepted
                  : styles.statusContainerPending
              }
            >
              <Text
                style={
                  invite.status === "accepted"
                    ? styles.statusTextAccepted
                    : styles.statusTextPending
                }
              >
                {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigateToRestaurantProfile(invite.establishmentId)}
          >
            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/images/restaurantBackground.png")}
                style={styles.restaurantImage}
              />
            </View>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backArrowContainer}
          activeOpacity={1}
        >
          <ArrowLeft style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mailbox</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("Sent")}
          style={[styles.tab, activeTab === "Sent" && styles.activeTab]}
          activeOpacity={1}
        >
          <Text
            style={activeTab === "Sent" ? styles.activeTabText : styles.tabText}
          >
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Received")}
          style={[styles.tab, activeTab === "Received" && styles.activeTab]}
          activeOpacity={1}
        >
          <Text
            style={
              activeTab === "Received" ? styles.activeTabText : styles.tabText
            }
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separator} />

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {activeTab === "Received"
          ? renderReceivedContent()
          : renderSentContent()}
      </ScrollView>
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
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  backArrowContainer: {
    position: "absolute",
    left: "7%",
    top: "20%",
  },
  backArrow: {
    width: width * 0.09,
    height: width * 0.09,
  },
  headerTitleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginBottom: height * 0.007,
  },
  separator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: width * 0.9,
    alignSelf: "center",
    opacity: 0.2,
    marginBottom: height * 0.01,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  tab: {
    paddingBottom: height * 0.005,
    paddingLeft: "16.4%",
    paddingRight: "16.4%",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.highlightText,
  },
  activeTabText: {
    fontFamily: Fonts.Medium,
    color: Colors.text,
    fontSize: 18,
  },
  tabText: {
    fontFamily: Fonts.Medium,
    color: Colors.placeholderText,
    fontSize: 18,
  },
  postCard: {
    backgroundColor: Colors.background,
    width: "93%",
    alignSelf: "center",
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
    borderRadius: 10,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: height * 0.012,
  },
  userImage: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 20,
    marginRight: width * 0.03,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Fonts.Regular,
    fontSize: 15,
    color: Colors.highlightText,
  },
  restaurantInfo: {
    fontSize: 15,
    fontFamily: Fonts.Medium,
    color: Colors.text,
  },
  statusContainerAccepted: {
    backgroundColor: "rgba(42, 169, 69, 0.2)",
    borderRadius: 8,
    paddingVertical: width * 0.02,
    paddingHorizontal: width * 0.04,
  },
  statusTextAccepted: {
    color: "rgba(45, 186, 76, 1)",
    fontSize: 16,
    fontFamily: Fonts.Regular,
    opacity: 1,
  },
  statusContainerPending: {
    backgroundColor: "rgba(255, 168, 0, 0.2)",
    borderRadius: 8,
    paddingVertical: width * 0.02,
    paddingHorizontal: width * 0.04,
  },
  statusTextPending: {
    color: "rgba(197, 131, 0, 1)",
    fontSize: 16,
    fontFamily: Fonts.Regular,
    opacity: 1,
  },
  declineButton: {
    paddingHorizontal: width * 0.055,
  },
  acceptButton: {},
  declineIcon: {
    width: width * 0.075,
    height: width * 0.075,
  },
  acceptIcon: {
    width: width * 0.075,
    height: width * 0.075,
  },
  restaurantImage: {
    width: "100%",
    height: height * 0.27,
    borderRadius: 10,
  },
  imageContainer: {
    position: "relative",
  },
});

export default MailboxScreen;
