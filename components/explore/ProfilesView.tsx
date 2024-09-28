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
} from "react-native";
import { Search } from "lucide-react-native";
import Colors from "../../utils/colors";
import { useUserGetByUsername } from "../../hooks/useUser";
import { UserProfile } from "../../models/userProfile";
import { UserService } from "../../services/user.service";
import { useAuth } from "../../context/auth.context";
import { useFollowingActions } from "../../hooks/useUserFollowing";
import { useNavigation } from "@react-navigation/native";
import { Fonts } from "../../utils/fonts";

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
      // Reset to default state
      setSearchResults(undefined);
      setError(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    const lowercaseQuery = searchQuery.toLowerCase();

    // Check if the search query matches the current user's username
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.searchContainer}>
        <Search size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="search username..."
          placeholderTextColor="#888"
          selectionColor={Colors.tags}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
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
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#000",
    fontFamily: Fonts.Light,
  },
  searchTip: {
    color: "#468309",
    marginBottom: 16,
    paddingHorizontal: 10,
    fontFamily: Fonts.Light,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: Fonts.Light,
  },
  profileReviews: {
    color: "#888",
  },
  followButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: "#000",
  },
});

export default ProfilesView;
