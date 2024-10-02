import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Linking,
  VirtualizedList,
  ScrollView,
  Alert,
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

  const handleInvite = () => {
    const restaurantName = restaurant.name;
        
    // Fallback URL if the user doesn't have the app installed
    const fallbackUrl = `https://shareablesapp.com/discover.html`; 
    
    const message = `I just found this restaurant called ${restaurantName} on Shareables. We should go check it out! ${fallbackUrl}`;
    
    const url = `sms:?body=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Messaging app is not available.");
        }
      })
      .catch((err) => {
        console.error("Failed to open messaging app:", err);
        Alert.alert("Error", "Failed to open messaging app.");
      });
  };

  const renderSection = ({ item }) => {
    switch (item.type) {
      case "header":
        return (
          <View style={styles.container}>
            <View style={styles.bookmarkContainer}>
              <Bookmark
                size={25}
                color={isSaved ? Colors.highlightText : Colors.text}
                onPress={handleSaveEstablishment}
              />
            </View>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{restaurant.name}</Text>
                <Text style={styles.location}>
                  {restaurant.city} {" "}–{" "} <Text style={styles.distance}>{distanceText}</Text>
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
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  activeOpacity={1}
                  onPress={handleInvite}
                  >
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {restaurant.gallery && restaurant.gallery.length > 0 && (
                <VirtualizedList
                  horizontal
                  getItemCount={(data) => data.length}
                  getItem={(data, index) => data[index]}
                  data={restaurant.gallery.filter((item) => item.imageUrls && item.imageUrls.length > 0)}
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
            </ScrollView>

            <View style={styles.separator} />
          </>
        );
      case "reviews":
        const columnCount = 2;
        const columnWidth = (width * 0.89) / columnCount;
        const columnItems: Post[][] = Array.from({ length: columnCount }, () => []);

        restaurant.fewImagePostReview
        .filter((post) => post.imageUrls && post.imageUrls.length > 0)
        .forEach((post, index) => {
          columnItems[index % columnCount].push(post);
        });
      

        const renderColumn = (items, columnIndex) => {
          return (
            <View style={{ flex: 1, marginHorizontal: 5 }}>
              {items.map((post, index) => {
                const isOddColumn = columnIndex % 2 !== 0;
                const imageHeight = isOddColumn
                  ? index % 3 === 0
                    ? 150
                    : index % 3 === 1
                    ? 200
                    : 250
                  : index % 3 === 0
                  ? 250
                  : index % 3 === 1
                  ? 200
                  : 150;

                return (
                  <TouchableOpacity
                    key={index}
                    style={{ marginBottom: 10 }}
                    onPress={() => onOpenReviewPost(post)}
                    activeOpacity={1}
                  >
                    <FastImage
                      source={{ uri: post.imageUrls[0] }}
                      style={{
                        width: columnWidth,
                        height: imageHeight,
                        borderRadius: 10,
                        marginTop: 5,
                      }}
                    />
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text
                        style={[styles.restaurantNameReview]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        @{post.username}
                      </Text>
                      <Text style={styles.dash}> - </Text>
                      <Text style={styles.scoreReview}>{post.ratings!.overall}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        };

        return (
          <>
            <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsCount}>
                {restaurant.postCount || 0} Reviews
              </Text>
              <View style={styles.gridGallery}>
                {columnItems.map((items, index) => (
                  <View key={index} style={styles.gridColumn}>
                    {renderColumn(items, index)}
                  </View>
                ))}
              </View>
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
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  bookmarkContainer: {
    position: "relative",
    paddingBottom: height * 0.01,
    paddingLeft: width * 0.05
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
    flexWrap: "wrap",
    marginBottom: height * 0.02,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Bold,
    flexWrap: "wrap",
  },
  ratingContainer: {
    backgroundColor: Colors.rating,
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: width * 0.05,
  },
  rating: {
    color: "white",
    fontFamily: Fonts.Bold,
    fontSize: width * 0.045,
  },
  location: {
    color: Colors.text,
    fontSize: width * 0.04,
    marginTop: height * 0.005,
    fontFamily: Fonts.Regular,
  },
  tags: {
    color: Colors.tags,
    marginBottom: height * 0.03,
    marginTop: -height * 0.015,
    fontSize: width * 0.035,
    paddingLeft: width * 0.05,
  },
  buttonContainer: {
    flexDirection: "column",
    paddingHorizontal: width * 0.03,
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
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: width * 0.02,
  },
  actionButtonText: {
    marginTop: width * 0.01,
    fontSize: width * 0.035,
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    textAlign: "center",
  },
  galleryTitle: {
    color: Colors.text,
    fontSize: width * 0.055,
    fontFamily: Fonts.SemiBold,
    marginTop: "5%",
    marginLeft: "5%",
  },
  galleryContainer: {
    marginTop: height * 0.01,
    overflow: "visible",
    paddingLeft: "3%",
  },
  galleryItemContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginRight: width * 0.02,
  },
  galleryItem: {
    position: "relative",
    width: width * 0.4,
    height: width * 0.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryUserImageContainer: {
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  galleryUserImage: {
    borderWidth: 3,
    borderColor: "white",
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: 90,
  },
  reviewsContainer: {
    marginTop: "4%",
    backgroundColor: Colors.background,
    width: "100%",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 10,
  },
  reviewsCount: {
    color: Colors.highlightText,
    fontSize: width * 0.055,
    fontFamily: Fonts.SemiBold,
    marginTop: "1%",
    marginLeft: "5%",
  },
  gridGallery: {
    flexDirection: "row",
    marginHorizontal: "2.5%",
    marginTop: "3%",
  },
  gridColumn: {
    flex: 1,
  },
  restaurantNameReview: {
    fontSize: width * 0.037,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
    maxWidth: "70%",
  },
  dash: {
    fontSize: width * 0.037,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
  },
  scoreReview: {
    fontSize: width * 0.037,
    fontFamily: Fonts.Medium,
    color: Colors.highlightText,
  },
  separator: {
  borderBottomColor: Colors.placeholderText,
  borderBottomWidth: 1,
  width: "40%",
  alignSelf: "center",
  opacity: 0.2,
  marginTop: -height * 0.01,
  }
});

export default RestaurantCard;
