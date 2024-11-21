import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
} from "react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { UserService } from "../../services/user.service";
import type { FeaturedEstablishment } from "../../models/establishment";
import FastImage from "react-native-fast-image";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { useGetFeaturedEstablishments } from "../../hooks/useEstablishment";
import { useAuth } from "../../context/auth.context";
import { UserProfile } from "../../models/userProfile";
import {Bookmark} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface RestaurantsViewProps {
  location: string;
}

const RestaurantsView: React.FC<RestaurantsViewProps> = ({ location }) => {
  const navigation = useNavigation<any>();
  const userService = new UserService();
  const { userProfile } = useAuth();

  const {
    data: featuredEstablishments,
    isLoading: isFeaturedEstablishmentsLoading,
    refetch: refetchFeaturedEstablishments,
  } = useGetFeaturedEstablishments(location);

  const [topFollowedUsers, setTopFollowedUsers] = useState([]);
  const [isTopFollowedLoading, setIsTopFollowedLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTopFollowedUsers = useCallback(async () => {
    setIsTopFollowedLoading(true);
    try {
      const users = await userService.getTopFollowedUsers(location);
      setTopFollowedUsers(users);
    } catch (error) {
      console.error("Error fetching top followed users:", error);
    } finally {
      setIsTopFollowedLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchTopFollowedUsers();
  }, [fetchTopFollowedUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchFeaturedEstablishments(), fetchTopFollowedUsers()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigateToRestaurantProfile = (establishmentData: FeaturedEstablishment) => {
    navigation.navigate("RestaurantProfile", {
      establishmentId: establishmentData.id,
    });
  };

  const handleTopFollowedUser = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const getTopTenEstablishments = (): FeaturedEstablishment[] => {
    if (!featuredEstablishments) return [];
    const sortedEstablishments = [...featuredEstablishments].sort(
      (a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating)
    );
    const uniqueEstablishments = new Set();
    const topThree: FeaturedEstablishment[] = [];

    for (const establishment of sortedEstablishments) {
      if (!uniqueEstablishments.has(establishment.id)) {
        uniqueEstablishments.add(establishment.id);
        topThree.push(establishment);
        if (topThree.length === 10) break;
      }
    }

    return topThree;
  };

  const renderTopFollowedUser = ({ item }: { item: UserProfile & { followerCount: number } }) => (
    <TouchableOpacity
      style={styles.topPosterItem}
      onPress={() => handleTopFollowedUser(item.id)}
      activeOpacity={1}
    >
      <View style={styles.posterContent}>
        <FastImage
          source={{
            uri: item.profilePicture,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.topPosterImage}
        />
        <View style={styles.posterTextContainer}>
          <Text style={styles.topPosterUsername} numberOfLines={1} ellipsizeMode="tail">
            @{item.username}
          </Text>
          <Text style={styles.topPosterFollowers}>{item.followerCount} followers</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedRestaurants = ({
    item,
  }: {
    item: FeaturedEstablishment;
  }) => {
    if (!item) return null;
  
    return (
    <View style={styles.featuredRestaurantCardContainer}>
      <TouchableOpacity
        onPress={() => handleNavigateToRestaurantProfile(item)}
        activeOpacity={1}
      >
        <View style={styles.featuredRestaurantCard}>
          {/* Image */}
          <FastImage
            source={{
              uri: item.images?.[0] || "placeholder_image_url",
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.featuredRestaurantImage}
          />
          {/* Overlay */}
          <View style={styles.featuredRestaurantOverlay}>
            <BlurView style={styles.locationBadge} intensity={100} tint="default">
              <Bookmark size={20} color={Colors.background} />
            </BlurView>
          </View>
        </View>
      </TouchableOpacity>
      {/* Restaurant Name */}
      <Text style={styles.restaurantNameText} numberOfLines={1} ellipsizeMode="tail">
        {item.name || "Unknown Restaurant"}
      </Text>
      <Text style={styles.averageRatingText} numberOfLines={1} ellipsizeMode="tail">
        {item.averageRating || "Unknown Restaurant"}
      </Text>
    </View>
    );
  };
  
  
  return (
    <ScrollView
      style={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.tags} />
      }
    >
      <Text style={styles.sectionTitleFeatured}>Top Restaurants</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingRight: width * 0.03, flexDirection: "row" }}>
          {getTopTenEstablishments().slice(0,5).map((item) => (
            <View key={item.id}>
              {renderFeaturedRestaurants({ item })}
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingRight: width * 0.03, flexDirection: "row" }}>
          {getTopTenEstablishments().slice(5,10).map((item) => (
            <View key={item.id}>
              {renderFeaturedRestaurants({ item })}
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.sectionTitleFoodies}>Local Foodies</Text>
      {isTopFollowedLoading ? (
        <ActivityIndicator size="small" color={Colors.tags} />
      ) : (
        <FlatList
          data={topFollowedUsers}
          renderItem={renderTopFollowedUser}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.topPostersContainer}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          contentContainerStyle={styles.justifyContentSpaceBetween}
        />
      )}
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {},
  sectionTitleFoodies: {
    fontSize: width * 0.055,
    fontFamily: Fonts.Medium,
    paddingTop: width * 0.01,
    paddingBottom: width * 0.03,
    marginLeft: width * 0.05,
  },
  sectionTitleFeatured: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Medium,
    paddingBottom: width * 0.03,
    marginTop: width * 0.07,
    marginLeft: width * 0.05,
  },
  justifyContentSpaceBetween: {
    marginLeft: width * 0.05,
  },
  topPostersContainer: {
    marginBottom: width * 0.05,
    marginTop: width * 0.01
  },
  topPosterItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 15,
    paddingHorizontal: width * 0.02,
    paddingVertical: width * 0.015,
    minWidth: width * 0.2,
    borderColor: Colors.inputBackground,
    borderWidth: 2,
  },
  posterContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  topPosterImage: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 90,
    marginRight: width * 0.02,
  },
  posterTextContainer: {
    flex: 1,
  },
  topPosterUsername: {
    fontSize: width * 0.035,
    fontFamily: Fonts.Regular,
    color: Colors.charcoal,
  },
  topPosterFollowers: {
    fontSize: width * 0.035,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginTop: 2,
  },
  itemSeparator: {
    width: width / 6 / 5,
  },
  featuredRestaurantCardContainer: {
    width: "100%", 
    marginBottom: width * 0.03, 
    paddingLeft: width * 0.05,
    marginRight: -(width * 0.02),
    marginTop: width * 0.01
  },
  featuredRestaurantCard: {
    width: width * 0.4,
    height: width * 0.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  featuredRestaurantImage: {
    width: "100%",
    height: "100%", 
    resizeMode: "cover", 
  },
  restaurantNameText: {
    marginTop: width * 0.02,
    fontSize: width * 0.035, 
    fontFamily: Fonts.SemiBold,
    color: Colors.charcoal,
    textAlign: "left", 
    width: width * 0.35,
    marginBottom: width * 0.01
  },
  averageRatingText: {
    fontSize: width * 0.035, 
    fontFamily: Fonts.Regular,
    color: Colors.charcoal,
    textAlign: "left", 
    width: width * 0.35,
    marginBottom: width * 0.01
  },
  featuredRestaurantOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    padding: "7%", 
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 7,
    borderRadius: 90, 
    overflow: "hidden",
  },
});

export default RestaurantsView;
