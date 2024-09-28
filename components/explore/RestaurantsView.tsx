import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
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

const { width, height } = Dimensions.get("window");

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
        if (topThree.length === 4) break;
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
        activeOpacity={1}
      >
        <View style={styles.restaurantItem}>
          <View>
            <Text style={styles.restaurantName}>{establishment.name}</Text>
            <Text style={styles.restaurantInfo}>{establishment.address}</Text>
            <Text style={styles.restaurantTags}>
              {establishment.tags?.slice(0,3).join(" • ")}
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
          activeOpacity={1}
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
                {/* <MapPin size={16} color= {Colors.background} /> */}
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
      <TouchableOpacity 
        onPress={() => handleTopPosters(item.userId)}
        activeOpacity={1}
        >
        <LinearGradient
          colors={[Colors.profileBorder, Colors.profileBorder]}
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
      <Text 
        style={styles.topPosterUsername} 
        numberOfLines={1} 
        ellipsizeMode="tail"
      >
        @{item.username}
      </Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitleFoodies}>Top Foodies</Text>
      <FlatList
        data={topPosters}
        renderItem={renderTopPoster}
        keyExtractor={(item) => item.userId}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
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

      <Text style={styles.sectionTitleFeatured}>Featured Restaurants</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View style={{paddingRight: width * 0.03, flexDirection: "row"}}>
        {topThreePosts.map((item) => (
          renderFeaturedRestaurants({ item })
        ))}
        </View>
      </ScrollView>
    <View style={{ marginTop: width * 0.08}}>
      {renderDiscoverSection()}
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
  },
  categories: {
    marginBottom: width * 0.03,
    paddingLeft: width * 0.03
  },
  sectionTitleFoodies: {
    fontSize: width * 0.05,
    fontFamily: Fonts.Medium,
    paddingVertical: width * 0.03,
    marginLeft: width * 0.03
  },
  sectionTitleFeatured: {
    fontSize: width * 0.05,
    fontFamily: Fonts.Medium,
    paddingBottom: width * 0.04,
    marginTop: -(width * 0.02),
    marginLeft: width * 0.03
  },
  justifyContentSpaceBetween: {
    marginLeft: width * 0.03
  },
  topPostersContainer: {
    marginBottom: width * 0.05,
    width: width
  },
  topPosterItem: {
    width: width / 5,
  },
  gradientBorder: {
    width: width / 5,
    height: width / 5,
    borderRadius: 90,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 90,
    overflow: "hidden",
    backgroundColor: "white",
  },
  topPosterImage: {
    width: "100%",
    height: "100%",
  },
  topPosterUsername: {
    marginTop: 5,
    fontSize: width * 0.03, 
    color: Colors.charcoal,
    textAlign: "center", 
    fontFamily: Fonts.Regular,
  },
  itemSeparator: {
    width: width / 5 / 5,
  },
  featuredRestaurantImageContainer: {
    borderRadius: 10,
    width: "100%",
    height: "100%",
  },
  featuredRestaurantCard: {
    width: width * 0.48,
    height: width * 0.48 * 1.25, 
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: width * 0.03,
    marginRight: -(width * 0.01)
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
  restaurantItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: width * 0.035, 
    borderTopColor: Colors.inputBackground,
    borderTopWidth: 1,
    maxWidth: width * 0.94,
    marginLeft: width * 0.03
  },
  restaurantName: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    fontFamily: Fonts.Bold,
  },
  restaurantInfo: {
    color: Colors.placeholderText,
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
    width: width * 0.1,
    height: width * 0.1,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center"
  },
  ratingText: {
    color: Colors.background,
    fontFamily: Fonts.Bold,
    fontSize: width * 0.04,
  },
  noResultsContainer: {
    padding: width * 0.05,
    alignItems: "center",
  },
  noResultsText: {
    fontFamily: Fonts.Medium,
    fontSize: width * 0.04,
    color: Colors.highlightText,
  },
});

export default RestaurantsView;
