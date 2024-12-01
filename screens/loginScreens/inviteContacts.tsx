import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation.types";
import * as Contacts from "expo-contacts";
import { db, auth } from "./../../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { PhoneNumber } from "expo-contacts";
import { CircleArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/auth.context";

const { width, height } = Dimensions.get("window");

interface Contact {
  firstName?: string;
  lastName?: string;
  phoneNumbers?: { label: string; number: string }[];
}

interface EnhancedContact extends Contact {
  phoneNumbers?: { label: string; number: string }[];
}

const InviteContactsScreen = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const sendInvite = async (phoneNumber: string) => {
    const message = `Hi! Join me on this amazing app and discover great places to eat. Here's the link to download the app: [app link]`;
    // Encoding the message to ensure that spaces and special characters are handled correctly
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;

    // Using Linking to open the default messaging app with the pre-filled message
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open messaging app");
    }
  };

  const navigateToFollowFriends = () => {
    // Extract phone numbers and filter out undefined values
    const phoneNumbers = contacts
      .map((contact) => contact.phoneNumbers?.[0]?.number)
      .filter(Boolean) as string[];

    // Now phoneNumbers is strictly an array of strings (string[])
    navigation.navigate("FollowFriends", { userContacts: phoneNumbers });
  };

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      const userId = user!.uid;

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.FirstName,
            Contacts.Fields.LastName,
            Contacts.Fields.PhoneNumbers,
          ],
        });

        if (data.length > 0) {
          let filteredContacts = data
            .filter((contact) => {
              return (
                !!contact.firstName &&
                !!contact.phoneNumbers &&
                contact.phoneNumbers.some((pn) => !!pn.number)
              );
            })
            .map((contact) => ({
              firstName: contact.firstName,
              lastName: contact.lastName || "", // Ensure lastName is an empty string if undefined
              phoneNumbers: contact.phoneNumbers?.map((pn) => ({
                label: pn.label || "mobile",
                number: pn.number || "N/A",
              })),
            }));

          // Sort contacts
          filteredContacts.sort((a, b) => {
            let nameA = `${a.lastName}${a.firstName}`;
            let nameB = `${b.lastName}${b.firstName}`;
            return nameA.localeCompare(nameB);
          });

          setContacts(filteredContacts);
        }

        if (userId) {
          await updateDoc(doc(db, "users", userId), {
            contactsPermission: true,
          });
        }
      } else {
        if (userId) {
          await updateDoc(doc(db, "users", userId), {
            contactsPermission: false,
            onboardingComplete: true,
          });
          await refreshUserProfile();
        }
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabNavigator" }],
        });
      }
    };

    getPermissions();
  }, [navigation, user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="auto" />
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backArrowContainer}>
          <CircleArrowLeft color={Colors.text} size={30} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>
        Research tells us that{" "}
        <Text style={{ color: Colors.highlightText, fontWeight: "bold" }}>
          85% of people
        </Text>{" "}
        enjoy sharing restaurants to family and friends.
      </Text>
      <Text style={styles.description}>
        Invite 3 friends so they don't feel left out.
      </Text>
      <ScrollView
        style={styles.contactsContainer}
        showsVerticalScrollIndicator={false}
      >
        {contacts.map((contact, index) => (
          <View key={index} style={styles.contactCard}>
            <View style={styles.contactInitials}>
              <Text style={styles.contactInitialsText}>
                {contact.firstName && contact.firstName[0]}
                {contact.lastName && contact.lastName[0]}
              </Text>
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>
                {contact.firstName} {contact.lastName}
              </Text>
              {contact.phoneNumbers && contact.phoneNumbers[0] && (
                <Text style={styles.contactNumber}>
                  {contact.phoneNumbers[0].number}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() =>
                sendInvite(contact.phoneNumbers?.[0]?.number ?? "")
              }
              activeOpacity={1}
            >
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <View style={styles.nextButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={navigateToFollowFriends}
        >
          <Text style={styles.nextButtonText}>Next Step</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBox: {
    width: width * 1,
    position: "absolute",
    top: height * 0,
    backgroundColor: Colors.background,
    height: height * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrowContainer: {
    position: "absolute",
    left: "8%",
    top: "100%",
  },
  title: {
    fontSize: width * 0.075,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    width: width * 0.9,
    justifyContent: "center",
    textAlign: "left",
    marginLeft: width * 0.07,
    marginTop: height * 0.095,
    marginBottom: width * 0.05
  },
  nameText: {
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
  },
  description: {
    fontSize: width * 0.05,
    textAlign: "left",
    width: width * 0.85,
    fontFamily: Fonts.Medium,
    paddingLeft: width * 0.07,
    color: Colors.tags,
  },
  nextButtonContainer: {
    width: width * 1,
    marginTop: height * 0.04,
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
    fontSize: width * 0.055,
    fontFamily: Fonts.Bold,
  },
  contactsContainer: {
    backgroundColor: Colors.background,
    maxHeight: height * 0.45,
    width: width * 0.95,
    alignSelf: "center",
    marginTop: height * 0.03,
    flex: 1,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: width * 0.035,
    marginVertical: height * 0.004,
  },
  contactInitials: {
    backgroundColor: Colors.placeholderText,
    borderRadius: 90,
    width: width * 0.11,
    height: width * 0.11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: width * 0.01,
  },
  contactInitialsText: {
    color: Colors.background,
    fontSize: width * 0.05,
    fontFamily: Fonts.Bold,
  },
  contactDetails: {
    marginLeft: width * 0.03,
    flex: 1,
  },
  contactName: {
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
  },
  contactNumber: {
    fontSize: width * 0.04,
    color: Colors.placeholderText,
  },
  inviteButton: {
    backgroundColor: Colors.tags,
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.05,
    borderRadius: 10,
  },
  inviteButtonText: {
    color: Colors.background,
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
  },
});

export default InviteContactsScreen;
