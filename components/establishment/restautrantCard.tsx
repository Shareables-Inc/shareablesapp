import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  FlatList,
  Linking,
  VirtualizedList,
  ScrollView,
} from "react-native";
import {
  Clock,
  MessageCircle,
  Globe,
  MapPin,
  Bookmark,
} from "lucide-react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { EstablishmentCard } from "../../models/establishment";
import {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetVirtualizedList,
} from "@gorhom/bottom-sheet";
import FastImage from "react-native-fast-image";
import { useAuth } from "../../context/auth.context";
import { useCreateUserSave, useGetUserSaves } from "../../hooks/useUserSave";
import { useDeleteUserSave } from "../../hooks/useUserSave";
import { Save } from "../../models/save";
import { Post } from "../../models/post";
const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.06;

interface RestaurantCardProps {
  restaurant: EstablishmentCard;
  userLocation: { latitude: number; longitude: number } | null;
  onOpenReviewPost: (post: Post) => void;
}

const RestaurantCard = ({
  restaurant,
  userLocation,
  onOpenReviewPost,
}: RestaurantCardProps) => {
  const { user } = useAuth();
  const { data: userSaves } = useGetUserSaves(user!.uid);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const { mutate: createSave } = useCreateUserSave();
  const { mutate: removeSave } = useDeleteUserSave();

  useEffect(() => {
    if (userSaves && restaurant.id) {
      setIsSaved(
        userSaves.saves.some((save) => save.establishmentId === restaurant.id)
      );
    }
  }, [userSaves, restaurant.id]);
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

  const distanceText = userLocation
    ? `${calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.latitude,
        restaurant.longitude
      )} km`
    : "Distance Unavailable";

  const renderItem = ({ item, index }: { item: Post; index: number }) => {
    const heights = [150, 200];
    const rowIndex = Math.floor(index / 2); // Assuming 2 columns
    const height =
      rowIndex % 2 === 0 ? heights[index % 2] : heights[(index + 1) % 2];

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => onOpenReviewPost(item)}
      >
        <FastImage
          source={{
            uri: item.imageUrls[0],
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          style={[styles.gridImage, { height: height }]}
        />
        <Text style={styles.gridText}>@{item.username}</Text>
      </TouchableOpacity>
    );
  };

  const handleSaveEstablishment = () => {
    try {
      if (user?.uid && restaurant.id) {
        if (isSaved) {
          removeSave({
            userId: user.uid,
            establishmentId: restaurant.id,
          });
          setIsSaved(false);
        } else {
          const saveInput: Save = {
            establishmentId: restaurant.id,
            establishmentName: restaurant.name,
            longitude: restaurant.longitude,
            latitude: restaurant.latitude,
            createdAt: new Date(),
          };
          createSave({ userId: user.uid, save: saveInput });
          setIsSaved(true);
        }
      } else {
        console.error("Establishment not found");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleOpenMaps = () => {
    const { latitude, longitude } = restaurant;
    const label = restaurant.name;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    if (url) {
      Linking.openURL(url);
    } else {
      console.error("Invalid URL for maps");
    }
  };

  const sections = [
    { type: "header" },
    { type: "gallery" },
    { type: "reviews" },
  ];

  const renderSection = ({ item }) => {
    switch (item.type) {
      case "header":
        return (
          <View style={styles.container}>
            <View style={styles.bookmarkContainer}>
              <Bookmark
                size={20}
                color={isSaved ? Colors.highlightText : Colors.text}
                onPress={handleSaveEstablishment}
              />
            </View>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{restaurant.name}</Text>
                <Text style={styles.location}>
                  {restaurant.city} • {restaurant.priceRange || 0} •{" "}
                  <Text style={styles.distance}>{distanceText}</Text>
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>
                  {restaurant.averageRating || 0}
                </Text>
              </View>
            </View>
            <Text style={styles.tags}>
              {restaurant.tags?.slice(0, 3).join(" • ")}
            </Text>
            <View style={styles.buttonContainer}>
              {restaurant.status && (
                <TouchableOpacity style={styles.button}>
                  <Clock size={20} color={Colors.text} />
                  <Text style={styles.buttonText}>{restaurant.status}</Text>
                </TouchableOpacity>
              )}
              {restaurant.website && (
                <TouchableOpacity style={styles.button}>
                  <Globe size={20} color={Colors.text} />
                  <Text style={styles.buttonText}>{restaurant.website}</Text>
                </TouchableOpacity>
              )}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageCircle size={20} color={Colors.text} />
                  <Text style={styles.actionButtonText}>Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleOpenMaps}
                  activeOpacity={1}
                >
                  <MapPin size={20} color={Colors.text} />
                  <Text style={styles.actionButtonText}>Let's Go</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case "gallery":
        return (
          <>
            <Text style={styles.galleryTitle}>Featured Gallery</Text>
            <BottomSheetScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {restaurant.gallery && restaurant.gallery.length > 0 && (
                <VirtualizedList
                  horizontal
                  getItemCount={(data) => data.length}
                  getItem={(data, index) => data[index]}
                  data={restaurant.gallery}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => onOpenReviewPost(item)}
                      activeOpacity={1}
                    >
                      <View style={styles.galleryItemContainer}>
                        <View style={styles.galleryItem}>
                          <FastImage
                            source={{
                              uri: item.imageUrls[0],
                              priority: FastImage.priority.normal,
                              cache: FastImage.cacheControl.immutable,
                            }}
                            style={styles.galleryImage}
                          />
                        </View>
                        <View style={styles.galleryUserImageContainer}>
                          <FastImage
                            source={{
                              uri: item.profilePicture,
                              priority: FastImage.priority.normal,
                              cache: FastImage.cacheControl.immutable,
                            }}
                            style={styles.galleryUserImage}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                  showsHorizontalScrollIndicator={false}
                  style={styles.galleryContainer}
                />
              )}
            </BottomSheetScrollView>
          </>
        );
      case "reviews":
        return (
          <>
            <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsCount}>
                {restaurant.postCount || 0} Reviews
              </Text>
              <BottomSheetFlatList
                data={restaurant.fewImagePostReview}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.gridContainer}
                numColumns={2}
              />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <BottomSheetVirtualizedList
      data={sections}
      renderItem={renderSection}
      keyExtractor={(item, index) => index.toString()}
      getItemCount={(data) => data.length}
      getItem={(data, index) => data[index]}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: "white",
  },
  bookmarkContainer: {
    position: "relative",
    paddingBottom: 16,
  },
  gridContainer: {
    paddingHorizontal: 16,
  },
  gridItem: {
    flex: 1,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
    overflow: "hidden",
    backgroundColor: "white",
  },
  gridImage: {
    width: "100%",
    borderRadius: 12,
  },
  gridText: {
    padding: 8,
    textAlign: "center",
    color: Colors.highlightText,
    fontFamily: Fonts.Light,
  },
  distance: {
    color: Colors.highlightText,
    fontSize: 14,
    fontFamily: Fonts.SemiBold,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap", // Allow wrapping
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1, // Allow the title container to take up available space
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: Fonts.Bold,
    flexWrap: "wrap", // Allow text to wrap
  },
  ratingContainer: {
    backgroundColor: Colors.rating,
    width: 50,
    height: 50,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rating: {
    color: "white",
    fontWeight: "bold",
    fontFamily: Fonts.Bold,
    fontSize: 18,
  },
  location: {
    color: Colors.text,
    fontSize: 14,
    marginTop: 4,
    fontFamily: Fonts.Light,
  },
  tags: {
    color: Colors.tags,
    marginBottom: 16,
    marginTop: -10,
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "column",
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    textAlign: "center",
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  galleryContainer: {
    marginTop: 10,
    overflow: "visible", // Ensure the container allows overflow
  },
  galleryItemContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  galleryItem: {
    position: "relative",
    width: width * 0.4, // Keep the width of the gallery item the same
    height: width * 0.5, // Keep the height of the gallery item the same
    borderRadius: 12,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryUserImageContainer: {
    bottom: 20, // Adjusted to align with the design
    left: 0,
    right: 0,
    alignItems: "center",
  },
  galleryUserImage: {
    borderWidth: 3,
    borderColor: "white",
    width: 60, // Keep the size of the profile image the same
    height: 60, // Keep the size of the profile image the same
    borderRadius: 30,
  },
  reviewsContainer: {
    marginTop: 16,
  },
  reviewsCount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.highlightText,
  },
});

export default RestaurantCard;
