import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Search } from "lucide-react-native";
import Colors from "../../utils/colors";
import { UserProfile } from "../../models/userProfile";
import { UserService } from "../../services/user.service";
import { useAuth } from "../../context/auth.context";
import { useFollowingActions } from "../../hooks/useUserFollowing";
import { useNavigation } from "@react-navigation/native";
import { Fonts } from "../../utils/fonts";

const { width, height } = Dimensions.get("window");

const ProfilesView = () => {
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { isFollowing, isToggling, toggleFollow } = useFollowingActions(
    searchResults?.id,
    user!.uid
  );
  const navigation = useNavigation<any>();

  const userService = new UserService();
  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      setSearchResults(undefined);
      setError(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    const lowercaseQuery = searchQuery.toLowerCase();

    if (lowercaseQuery === userProfile?.username.toLowerCase()) {
      setError("You cannot search for your own profile.");
      setSearchResults(undefined);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await userService.getUserByUsername(lowercaseQuery);

      if (userData && userData.length > 0) {
        setSearchResults(userData[0]);
      } else {
        setSearchResults(undefined);
        setError("No results found.");
      }
    } catch (err) {
      console.error("Error searching for user:", err);
      setError("An error occurred while searching.");
      setSearchResults(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpeningUserProfile = () => {
    if (searchResults) {
      navigation.navigate("UserProfile", { userId: searchResults.id });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.placeholderText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="search username..."
            placeholderTextColor={Colors.placeholderText}
            selectionColor={Colors.tags}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text.trim())}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />
        </View>
        <Text style={styles.searchTip}>
          Spell the username correctly for accurate results.
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.tags} />
          </View>
        ) : error ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>{error}</Text>
          </View>
        ) : searchResults ? (
          <View style={styles.profileItem}>
            <TouchableOpacity onPress={handleOpeningUserProfile}>
              <Image
                source={{
                  uri:
                    searchResults.profilePicture ||
                    "https://example.com/default-profile.jpg",
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>@{searchResults.username}</Text>
              <Text style={styles.profileReviews}>
                {searchResults.firstName} {searchResults.lastName} • {searchResults.location}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButton]}
              onPress={toggleFollow}
              disabled={isToggling}
            >
              {isToggling ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.followButtonText}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: Colors.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: width * 0.03,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 0.9,
    height: width * 0.1,
    color: Colors.text,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.04,
  },
  searchTip: {
    color: Colors.circleCheck,
    marginBottom: width * 0.05,
    paddingLeft: width * 0.03,
    fontFamily: Fonts.Regular,
    fontSize: width * 0.035,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#888",
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
  profileReviews: {
    color: Colors.text,
    fontSize: width * 0.035,
    fontFamily: Fonts.Light,
  },
  followButton: {
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.025,
    borderRadius: 10,
  },
  followButtonText: {
    color: Colors.text,
    fontSize: width * 0.035,
    fontFamily: Fonts.Regular,
  },
});

export default ProfilesView;
