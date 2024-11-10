import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList
} from "react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { UserService } from "../../services/user.service";
import type { EstablishmentDetails, FeaturedEstablishment } from "../../models/establishment";
import FastImage from "react-native-fast-image";
import { BlurView } from "expo-blur";
import { tagsData } from "../../config/constants";
import { useNavigation } from "@react-navigation/native";
import { useGetFeaturedEstablishments } from "../../hooks/useEstablishment";
import { useAuth } from "../../context/auth.context";

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
  } = useGetFeaturedEstablishments(location);

  const [topFollowedUsers, setTopFollowedUsers] = useState([]);
  const [isTopFollowedLoading, setIsTopFollowedLoading] = useState(false);

  useEffect(() => {
    const fetchTopFollowedUsers = async () => {
      setIsTopFollowedLoading(true);
      try {
        const users = await userService.getTopFollowedUsers(location);
        setTopFollowedUsers(users);
      } catch (error) {
        console.error("Error fetching top followed users:", error);
      } finally {
        setIsTopFollowedLoading(false);
      }
    };
    fetchTopFollowedUsers();
  }, [location]);

  const handleNavigateToRestaurantProfile = (establishmentData: FeaturedEstablishment) => {
    navigation.navigate("RestaurantProfile", {
      establishmentId: establishmentData.id,
    });
  };

  const handleTopFollowedUser = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const getTopThreePosts = (): FeaturedEstablishment[] => {
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
        if (topThree.length === 3) break;
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
  }) => (
    <View key={item.id} style={styles.featuredRestaurantCard}>
      <TouchableOpacity
        onPress={() => handleNavigateToRestaurantProfile(item)}
        activeOpacity={1}
      >
        <View style={styles.featuredRestaurantImageContainer}>
          <FastImage
            source={{
              uri: item.images && item.images.length > 0 ? item.images[0] : "",
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.featuredRestaurantImage}
          />
          <View style={styles.featuredRestaurantOverlay}>
            <BlurView
              style={styles.locationBadge}
              intensity={100}
              tint="default"
            >
              <Text style={styles.featuredRestaurantName}>{item.name}</Text>
            </BlurView>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.scrollViewContent}>
      <Text style={styles.sectionTitleFeatured}>Top Restaurants</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingRight: width * 0.03, flexDirection: "row" }}>
          {getTopThreePosts().map((item) => renderFeaturedRestaurants({ item }))}
        </View>
      </ScrollView>

      {/* Second row of restaurants */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingRight: width * 0.03, flexDirection: "row" }}>
          {getTopThreePosts().map((item) => renderFeaturedRestaurants({ item }))}
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
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {},
  sectionTitleFoodies: {
    fontSize: width * 0.055,
    fontFamily: Fonts.Medium,
    paddingVertical: width * 0.03,
    marginLeft: width * 0.05,
  },
  sectionTitleFeatured: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Medium,
    paddingBottom: width * 0.05,
    marginTop: width * 0.07,
    marginLeft: width * 0.05,
  },
  justifyContentSpaceBetween: {
    marginLeft: width * 0.05,
  },
  topPostersContainer: {
    marginBottom: width * 0.05,
    width: width,
  },
  topPosterItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 15,
    paddingHorizontal: width * 0.02,
    paddingVertical: width * 0.022,
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
    borderColor: Colors.inputBackground,
    borderWidth: 2,
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
  featuredRestaurantImageContainer: {
    borderRadius: 10,
    width: "100%",
    height: "100%",
  },
  featuredRestaurantCard: {
    width: width * 0.4,
    height: width * 0.4 * 1.15,
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: width * 0.04,
    marginBottom: width * 0.07,
  },
  featuredRestaurantImage: {
    width: "100%",
    height: "100%",
  },
  featuredRestaurantOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: "7%",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    overflow: "hidden",
  },
  featuredRestaurantName: {
    color: Colors.background,
    marginLeft: 2,
    fontSize: width * 0.04,
    fontFamily: Fonts.Regular,
  },
});

export default RestaurantsView;
