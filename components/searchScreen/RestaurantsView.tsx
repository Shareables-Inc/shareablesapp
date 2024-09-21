import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MapPin } from "lucide-react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { useTopPosters } from "../../hooks/usePost";
import type { EstablishmentDetails, Post } from "../../models/post";
import FastImage from "react-native-fast-image";
import { BlurView } from "expo-blur";
import { tagsData } from "../../config/constants";
import { PostService, TopPoster } from "../../services/post.service";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type {
  Establishment,
  FeaturedEstablishment,
} from "../../models/establishment";
import { FlatList } from "react-native-gesture-handler";
import TagButton from "./tagButton";
import { LinearGradient } from "expo-linear-gradient";
import { useGetFeaturedEstablishments } from "../../hooks/useEstablishment";
import { useAuth } from "../../context/auth.context";

interface RestaurantsViewProps {
  location: string;
}

const RestaurantsView: React.FC<RestaurantsViewProps> = ({ location }) => {
  const navigation = useNavigation<any>();
  const [selectedTag, setSelectedTag] = useState<string>("");
  const { userProfile } = useAuth();
  const {
    data: featuredEstablishments,
    isLoading: isFeaturedEstablishmentsLoading,
    refetch: refetchFeaturedEstablishments,
  } = useGetFeaturedEstablishments(location, selectedTag);
  const {
    data: topPosters,
    isLoading: isTopPostersLoading,
    isError: isTopPostersError,
  } = useTopPosters();
  const handleNavigateToRestaurantProfile = (
    establishmentData: FeaturedEstablishment
  ) => {
    navigation.navigate("RestaurantProfile", {
      establishmentId: establishmentData.id,
    });
  };

  const handleTagSelection = (tag: string) => {
    console.log("tag", tag);
    setSelectedTag(tag === selectedTag ? "" : tag);
    refetchFeaturedEstablishments();
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

  const topThreePosts = getTopThreePosts();

  // Discover posts without duplication

  console.log("topThreePosts", topThreePosts);

  const handleTopPosters = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const renderDiscoverSection = () => {
    if (isFeaturedEstablishmentsLoading) {
      return <ActivityIndicator size="small" color={Colors.highlightText} />;
    }

    // remove the top three posts from the featured establishments
    const initialDiscoverPosts = featuredEstablishments?.filter(
      (establishment) => !topThreePosts.includes(establishment)
    );

    if (initialDiscoverPosts?.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No results found {selectedTag ? `for "${selectedTag}"` : ""}
          </Text>
        </View>
      );
    }

    return initialDiscoverPosts?.map((establishment, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => handleNavigateToRestaurantProfile(establishment)}
      >
        <View style={styles.restaurantItem}>
          <View>
            <Text style={styles.restaurantName}>{establishment.name}</Text>
            <Text style={styles.restaurantInfo}>{establishment.address}</Text>
            <Text style={styles.restaurantTags}>
              {establishment.tags?.join(" • ")}
            </Text>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{establishment.averageRating}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  const allTags = tagsData.cuisines
    .concat(tagsData.foodOccasions)
    .concat(tagsData.restaurantVibes);

  const renderFeaturedRestaurants = ({
    item,
  }: {
    item: FeaturedEstablishment;
  }) => {
    return (
      <View key={item.id} style={styles.featuredRestaurantCard}>
        <TouchableOpacity
          onPress={() => handleNavigateToRestaurantProfile(item)}
        >
          <View style={styles.featuredRestaurantImageContainer}>
            <FastImage
              source={{
                uri:
                  item.images && item.images.length > 0 ? item.images[0] : "",
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
                <MapPin size={16} color="#fff" />
                <Text style={styles.featuredRestaurantName}>{item.name}</Text>
              </BlurView>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTopPoster = ({ item }: { item: TopPoster }) => (
    <View style={styles.topPosterItem}>
      <TouchableOpacity onPress={() => handleTopPosters(item.userId)}>
        <LinearGradient
          colors={["#FF1E35", "#FF7E0E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.imageContainer}>
            <FastImage
              source={{
                uri: item.profilePicture,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.topPosterImage}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.topPosterUsername}>@{item.username}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <Text style={styles.sectionTitle}>Top Foodies</Text>
      <FlatList
        data={topPosters}
        renderItem={renderTopPoster}
        keyExtractor={(item) => item.userId}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topPostersContainer}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        contentContainerStyle={[styles.justifyContentSpaceBetween]}
        alwaysBounceHorizontal={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
      >
        {allTags.map((tag) => (
          <TagButton
            key={tag}
            tag={tag}
            isSelected={selectedTag === tag}
            onPress={() => handleTagSelection(tag)}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Featured Restaurants</Text>
      <FlatList
        data={topThreePosts}
        renderItem={renderFeaturedRestaurants}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <Text style={styles.sectionTitle}>Discover</Text>
      {renderDiscoverSection()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 8,
  },
  categories: {
    paddingHorizontal: 10,
    marginBottom: 12, // Reduced from 16
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.Medium,
    marginHorizontal: 8,
    marginVertical: 8,
  },

  justifyContentSpaceBetween: {
    justifyContent: "space-between",
    alignContent: "center",
  },
  topPostersContainer: {
    paddingHorizontal: 8,
  },

  topPosterItem: {
    alignItems: "center",
    width: 80, // Set a fixed width for each item
  },
  gradientBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 37,
    overflow: "hidden",
    backgroundColor: "white",
  },
  topPosterImage: {
    width: "100%",
    height: "100%",
  },
  topPosterUsername: {
    marginTop: 8,
    fontSize: 12, // Reduced font size
    color: Colors.highlightText,
    textAlign: "center", // Center the username text
    fontFamily: Fonts.Medium,
  },
  itemSeparator: {
    width: 16, // Adjust this value to increase/decrease space between items
  },
  featuredRestaurantImageContainer: {
    borderRadius: 16,
    width: "100%",
    height: "100%",
  },
  featuredRestaurants: {
    paddingHorizontal: 10,
  },
  featuredRestaurantCard: {
    width: 300,
    height: 180, // Reduced from 200
    marginRight: 12, // Reduced from 16
    borderRadius: 20,
    overflow: "hidden",
  },
  featuredRestaurantImage: {
    width: "100%",
    height: "100%",
  },
  featuredRestaurantOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 100,
    bottom: 0,

    padding: 16,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
  featuredRestaurantName: {
    color: Colors.background,
    marginLeft: 2,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.Bold,
  },
  restaurantItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced from 12
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Fonts.Bold,
  },
  restaurantInfo: {
    color: "#888",
    marginTop: 4,
  },
  restaurantTags: {
    color: Colors.tags,
    fontFamily: Fonts.Light,
    marginTop: 4,
  },
  ratingBadge: {
    backgroundColor: Colors.tags,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  ratingText: {
    color: Colors.background,
    fontFamily: Fonts.Bold,
    fontSize: 16,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: "center",
  },
  noResultsText: {
    fontFamily: Fonts.Medium,
    fontSize: 16,
    color: Colors.highlightText,
  },
});

export default RestaurantsView;
