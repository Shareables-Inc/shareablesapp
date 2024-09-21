import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MapPin, Bookmark, User } from "lucide-react-native"; // Use the Flame icon instead of User for trending
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { EstablishmentCard } from "../../models/establishment";
import { MarkerType } from "../discover/MapViewWithMarkers";

interface RestaurantListProps {
  restaurants: MarkerType[];
  userLocation: { latitude: number; longitude: number } | null;
  onFilterChange: (filterType: "save" | "post" | "following" | null) => void;
  selectedFilter: "save" | "post" | "following" | null;
  onItemSelect: (restaurant: MarkerType) => void;
}

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
              <Text style={styles.title}>
                {restaurant.establishmentName || "Unknown Name"}
              </Text>
              <Text style={styles.location}>
                {restaurant.establishmentName || "Unknown City"} •{" "}
                {restaurant.priceRange || "No Price Range"} •{" "}
                <Text style={styles.distance}>{distanceText}</Text>
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>{restaurant.averageRating || 0}</Text>
            </View>
          </View>
          <Text style={styles.tags}>
            {restaurant.tags && restaurant.tags.length > 0
              ? restaurant.tags.join(" • ")
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Fonts.Bold,
  },
  ratingContainer: {
    backgroundColor: Colors.rating,
    width: 40,
    height: 40,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  location: {
    color: Colors.text,
    fontSize: 12,
    marginTop: 4,
  },
  distance: {
    color: Colors.highlightText,
    fontSize: 12,
    fontWeight: "bold",
  },
  tags: {
    color: Colors.tags,
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
  },
  filterSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Align items horizontally
    paddingHorizontal: 20,
    marginBottom: 5,
    marginTop: 10,
  },
  filterContainer: {
    flexDirection: "row",
  },
  filterIcon: {
    padding: 8,
    borderRadius: 90,
    marginHorizontal: 7,
    backgroundColor: Colors.inputBackground,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilter: {
    borderWidth: 3,
    borderColor: Colors.placeholderText,
  },
  filterLabelText: {
    fontSize: 18,
    fontFamily: Fonts.Medium,
    color: Colors.text,
    paddingLeft: 3,
  },
});

export default RestaurantList;
