import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import {
  Bookmark,
  MapPinCheckInside,
  CircleUserRound,
} from "lucide-react-native"; // Use the Flame icon instead of User for trending
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { MarkerType } from "../discover/MapViewWithMarkers";
import { useTranslation } from "react-i18next";

interface RestaurantListProps {
  restaurants: MarkerType[];
  userLocation: { latitude: number; longitude: number } | null;
  onFilterChange: (filterType: "save" | "post" | "following" | null) => void;
  selectedFilter: "save" | "post" | "following" | null;
  onItemSelect: (restaurant: MarkerType) => void;
}

const { width, height } = Dimensions.get("window");

const RestaurantList = ({
  restaurants,
  userLocation,
  onFilterChange,
  selectedFilter,
  onItemSelect,
}: RestaurantListProps) => {
  const { t } = useTranslation();

  const handleFilterPress = (filterType: "save" | "post" | "following") => {
    if (selectedFilter === filterType) {
      onFilterChange(null); // Unselect the filter
    } else {
      onFilterChange(filterType);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.round(d * 10) / 10; // Round to 1 decimal place
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const calculateDistanceText = (
    restaurant: MarkerType,
    userLocation: { latitude: number; longitude: number } | null
  ) => {
    if (!userLocation || !restaurant.latitude || !restaurant.longitude) {
      return "Distance Unavailable";
    }

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      restaurant.latitude,
      restaurant.longitude
    );

    return `${distance} km`;
  };

  /**
   * Filter by selected type (if any), then sort by distance (ascending).
   */
  const filteredAndSortedRestaurants = React.useMemo(() => {
    // First filter
    let result = selectedFilter
      ? restaurants.filter((r) => r.type === selectedFilter)
      : restaurants;

    // Then sort by distance if userLocation is available
    if (userLocation) {
      result = [...result].sort((a, b) => {
        const distanceA =
          a.latitude && a.longitude
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                a.latitude,
                a.longitude
              )
            : Infinity;
        const distanceB =
          b.latitude && b.longitude
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                b.latitude,
                b.longitude
              )
            : Infinity;
        return distanceA - distanceB;
      });
    }

    return result;
  }, [restaurants, selectedFilter, userLocation]);

  const renderItem = ({ item: restaurant }: { item: MarkerType }) => {
    const distanceText = calculateDistanceText(restaurant, userLocation);

    return (
      <View style={styles.container}>

        <TouchableOpacity onPress={() => onItemSelect(restaurant)}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {restaurant.establishmentName || "Unknown Name"}
              </Text>
              <Text style={styles.location}>
                {restaurant.city || "Unknown City"} –{" "}
                <Text style={styles.distance}>{distanceText}</Text>
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>{restaurant.averageRating || 0}</Text>
            </View>
          </View>
          <Text style={styles.tags}>
            {restaurant.tags && restaurant.tags.length > 0
              ? restaurant.tags.slice(0, 3).join(" • ")
              : "No Tags Available"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Label for the filters
  const getFilterLabel = () => {
    if (selectedFilter === "save") {
      return t("feed.restaurantList.saved");
    } else if (selectedFilter === "post") {
      return t("feed.restaurantList.your");
    } else if (selectedFilter === "following") {
      return t("feed.restaurantList.friend");
    } else {
      return t("feed.restaurantList.all");
    }
  };

  return (
    <View>
      {/* Filter Section with label and icons */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabelText}>{getFilterLabel()}</Text>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.filterIcon,
              selectedFilter === "save" && styles.activeFilter,
              { backgroundColor: Colors.saveBookmarkMarker }, // Bookmark icon background color
            ]}
            onPress={() => handleFilterPress("save")}
          >
            <Bookmark size={25} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.filterIcon,
              selectedFilter === "post" && styles.activeFilter,
              { backgroundColor: Colors.placesReviewedMarker }, // Pin icon background color
            ]}
            onPress={() => handleFilterPress("post")}
          >
            <MapPinCheckInside size={25} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.filterIcon,
              selectedFilter === "following" && styles.activeFilter,
              { backgroundColor: Colors.followingMarker }, // Fire icon background color
            ]}
            onPress={() => handleFilterPress("following")}
          >
            <CircleUserRound size={25} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Restaurant List */}
      {/* <FlatList
        data={filteredAndSortedRestaurants}
        keyExtractor={(item) => item.establishmentId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    marginBottom: height * 0.01,
    borderRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topPostsContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  topPostImage: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    fontFamily: Fonts.Bold,
    width: width * 0.75,
  },
  ratingContainer: {
    backgroundColor: Colors.rating,
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.015,
  },
  rating: {
    color: Colors.background,
    fontFamily: Fonts.Bold,
    fontSize: width * 0.045,
  },
  location: {
    color: Colors.text,
    fontSize: width * 0.04,
    fontFamily: Fonts.Regular,
    marginTop: height * 0.001,
  },
  distance: {
    color: Colors.highlightText,
    fontSize: width * 0.04,
    fontFamily: Fonts.Regular,
  },
  tags: {
    color: Colors.tags,
    fontSize: width * 0.035,
    fontFamily: Fonts.Regular,
    marginTop: -height * 0.007,
  },
  listContainer: {
    padding: width * 0.035,
  },
  filterSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.01,
  },
  filterContainer: {
    flexDirection: "row",
  },
  filterIcon: {
    borderRadius: 90,
    marginHorizontal: width * 0.01,
    width: width * 0.09,
    height: width * 0.09,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilter: {
    borderWidth: 3,
    borderColor: Colors.filterBox,
  },
  filterLabelText: {
    fontSize: width * 0.045,
    fontFamily: Fonts.Medium,
    color: Colors.text,
    paddingLeft: width * 0.01,
  },
  separator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    marginBottom: height * 0.015,
    marginTop: height * 0.01,
    width: "100%",
    alignSelf: "center",
    opacity: 0.2,
  },
});

export default RestaurantList;
