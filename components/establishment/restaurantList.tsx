import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MapPin, Bookmark, User } from "lucide-react-native"; // Use the Flame icon instead of User for trending
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { MarkerType } from "../discover/MapViewWithMarkers";

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

  const filteredRestaurants = React.useMemo(() => {
    if (!selectedFilter) return restaurants;
    return restaurants.filter(
      (restaurant) => restaurant.type === selectedFilter
    );
  }, [restaurants, selectedFilter]);

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
                {restaurant.city || "Unknown City"} •{" "}
                {restaurant.priceRange || 0} •{" "}
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
      return "Saved Restaurants";
    } else if (selectedFilter === "post") {
      return "Your Restaurants";
    } else if (selectedFilter === "following") {
      return "Friends Restaurants";
    } else {
      return "All Restaurants";
    }
  };

  return (
    <View>
      {/* Filter Section with label and icons */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabelText}>{getFilterLabel()}</Text>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.filterIcon,
              selectedFilter === "save" && styles.activeFilter,
              { backgroundColor: Colors.saveBookmarkMarker }, // Bookmark icon background color
            ]}
            onPress={() => handleFilterPress("save")}
          >
            <Bookmark fill={"white"} size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.filterIcon,
              selectedFilter === "post" && styles.activeFilter,
              { backgroundColor: Colors.placesReviewedMarker }, // Pin icon background color
            ]}
            onPress={() => handleFilterPress("post")}
          >
            <MapPin fill={"white"} size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.filterIcon,
              selectedFilter === "following" && styles.activeFilter,
              { backgroundColor: Colors.highlightText }, // Fire icon background color
            ]}
            onPress={() => handleFilterPress("following")}
          >
            <User fill={"white"} size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Restaurant List */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.establishmentId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    backgroundColor: Colors.inputBackground,
    width: width * 0.09,
    height: width * 0.09,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilter: {
    borderWidth: 3,
    borderColor: Colors.placeholderText,
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
