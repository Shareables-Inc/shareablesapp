import React, { useState, useEffect } from "react";
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
  FlatList,
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

const ProfilesView = ({ location }: { location?: string }) => {
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(false); // Loading state for fetching users
  const [error, setError] = useState<string | undefined>();
  const [topFollowedUsers, setTopFollowedUsers] = useState<UserProfile[]>([]); // Store top followed users

  const navigation = useNavigation<any>();
  const userService = new UserService();

  // Hook to handle follow state for search result
  const { isFollowing, isToggling, toggleFollow } = useFollowingActions(
    searchResults?.id,
    user!.uid
  );

  useEffect(() => {
    setIsLoading(true); // Start loading when location is switched
    fetchTopFollowedUsers(location); // Fetch top followed users on mount or location change
  }, [location]);

  const fetchTopFollowedUsers = async (location?: string) => {
    try {
      const users = await userService.getTopFollowedUsers(location);
      setTopFollowedUsers(users);
    } catch (error) {
      console.error("Error fetching top followed users:", error);
    } finally {
      setIsLoading(false); // Stop loading after fetch is done
    }
  };

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

  const handleOpeningUserProfile = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  // Render the search result profile
  const renderSearchResult = () => (
    <View style={styles.profileItem}>
      <TouchableOpacity onPress={() => handleOpeningUserProfile(searchResults!.id)}>
        <Image
          source={{
            uri:
              searchResults?.profilePicture || "https://example.com/default-profile.jpg",
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>@{searchResults?.username}</Text>
        <Text style={styles.profileReviews}>
          {searchResults?.firstName} {searchResults?.lastName} • {searchResults?.location}
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
  );

  // Render top followed users in a FlatList
  const renderTopFollowedUser = ({ item }: { item: UserProfile & { followerCount: number } }) => (
    <View style={styles.profileItem}>
      <TouchableOpacity 
        onPress={() => handleOpeningUserProfile(item.id)}
        activeOpacity={1}
        >
        <Image
          source={{
            uri: item.profilePicture || "https://example.com/default-profile.jpg",
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>@{item.username}</Text>
        <Text style={styles.profileReviews}>
          {item.followerCount} followers
        </Text>
      </View>
      <TouchableOpacity
        style={styles.followButton} 
        onPress={() => handleOpeningUserProfile(item.id)} 
        activeOpacity={1}
      >
        <Text style={styles.followButtonText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <TouchableWithoutFeedback 
      onPress={Keyboard.dismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Search bar */}
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

        {/* Search results */}
        {isLoading && searchQuery ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.tags} />
          </View>
        ) : error ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>{error}</Text>
          </View>
        ) : searchResults ? (
          renderSearchResult()
        ) : null}

        {/* Always display the section title */}
        <Text style={styles.sectionTitle}>Notable Foodies in {location} </Text>

        {/* Show loading spinner with "finding locals" */}
        {isLoading && !searchQuery && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.tags} />
            <Text style={styles.loadingText}>Finding locals...</Text>
          </View>
        )}

        {/* Show no foodies message if no users found */}
        {!isLoading && topFollowedUsers.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No foodies in the area yet</Text>
          </View>
        )}

        {/* Render top followed users */}
        {!isLoading && topFollowedUsers.length > 0 && (
          <FlatList
            data={topFollowedUsers}
            renderItem={renderTopFollowedUser}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.03,
    marginTop: width * 0.07
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
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: {
    fontSize: width * 0.04,
    color: Colors.tags,
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
    paddingHorizontal: width * 0.035,
    paddingVertical: width * 0.02,
    borderRadius: 10,
  },
  followButtonText: {
    color: Colors.text,
    fontSize: width * 0.035,
    fontFamily: Fonts.Regular,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
    marginTop: 20,
    marginBottom: 10,
  },
});

export default ProfilesView;
