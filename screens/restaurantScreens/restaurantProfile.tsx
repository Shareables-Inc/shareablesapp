import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
  Dimensions,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import {
  NavigationProp,
  useNavigation,
  RouteProp,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../../utils/colors";
import { StatusBar } from "expo-status-bar";
import { Fonts } from "../../utils/fonts";
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Bookmark,
} from "lucide-react-native";
import { useEstablishmentProfileData } from "../../hooks/useEstablishment";
import { RootStackParamList } from "../../types/stackParams.types";
import FastImage from "react-native-fast-image";
import { useCreateUserSave } from "../../hooks/useUserSave";
import { useDeleteUserSave } from "../../hooks/useUserSave";
import { useAuth } from "../../context/auth.context";
import { useGetUserSaves } from "../../hooks/useUserSave";
import { Save } from "../../models/save";
import { useLocationStore } from "../../store/useLocationStore";
import { SkeletonRestaurantProfile } from "../../components/skeleton/skeletonRestaurantProfile";
import { Post } from "../../models/post";

const { width, height } = Dimensions.get("window");

const HEADER_HEIGHT = height * 0.12;

type RestaurantProfileScreenRouteProp = RouteProp<
  RootStackParamList,
  "RestaurantProfile"
>;

type RestaurantProfileScreenProps = {
  route: RestaurantProfileScreenRouteProp;
};

const RestaurantProfileScreen = ({ route }: RestaurantProfileScreenProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { establishmentId } = route.params;

  const [isHeaderVisible, setHeaderVisible] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Closed");
  const scrollY = useRef(new Animated.Value(0)).current;
  const { mutate: createSave } = useCreateUserSave();
  const { mutate: removeSave } = useDeleteUserSave();
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const userSaves = useGetUserSaves(user!.uid);
  const location = useLocationStore();
  const {
    data: establishmentData,
    refetch,
    isLoading,
  } = useEstablishmentProfileData(establishmentId);

  useEffect(() => {
    if (userSaves.data) {
      // check if the establishmentId is in the userSaves.data
      const isSaved = userSaves.data.saves.some(
        (save) => save.establishmentId === establishmentId
      );
      setIsSaved(isSaved);
    }
  }, [userSaves.data]);



  const handleSaveEstablishment = () => {
    try {
      if (user?.uid && establishmentId) {
        if (isSaved) {
          removeSave({
            userId: user.uid,
            establishmentId: establishmentId,
          });
          setIsSaved(false);
        } else {
          const saveInput: Save = {
            establishmentId: establishmentId,
            establishmentName: establishmentData!.name,
            longitude: establishmentData!.longitude,
            latitude: establishmentData!.latitude,
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

  const checkOpenStatus = () => {
    const currentTime = new Date();
    const day = currentTime.getDay();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    if (!establishmentData?.hours) {
      setCurrentStatus("Closed");
      return;
    }

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayHours = establishmentData!.hours?.[daysOfWeek[day]];

    if (todayHours) {
      if (todayHours.toLowerCase().includes("24 hours")) {
        setCurrentStatus("Open");
        return;
      }

      const [dayLabel, times] = todayHours.split(": ");
      const timeRanges = times.split(", ");

      let isOpen = false;
      timeRanges.forEach((timeRange) => {
        const [openTime, closeTime] = timeRange
          .split("–")
          .map((time) => time.trim());
        const [openHour, openMinute] = parseTime(openTime);
        const [closeHour, closeMinute] = parseTime(closeTime);

        if (
          (currentHours > openHour ||
            (currentHours === openHour && currentMinutes >= openMinute)) &&
          (currentHours < closeHour ||
            (currentHours === closeHour && currentMinutes < closeMinute))
        ) {
          isOpen = true;
        }
      });

      setCurrentStatus(isOpen ? "Open" : "Closed");
    } else {
      setCurrentStatus("Closed");
    }
  };

  const parseTime = (time: string): [number, number] => {
    const periodMatch = time.match(/([ap]\.m\.)/i);
    const [hourMinute, period] = periodMatch
      ? [time.split(" ")[0], periodMatch[0].toLowerCase()]
      : [time, ""];
    let [hour, minute] = hourMinute.split(":").map(Number);

    if (period === "p.m." && hour !== 12) hour += 12;
    if (period === "a.m." && hour === 12) hour = 0;
    return [hour, minute];
  };

  useEffect(() => {
    checkOpenStatus();
  }, [establishmentData?.hours]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setHeaderVisible(offsetY > HEADER_HEIGHT);
      },
    }
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleWebsitePress = () => {
    if (establishmentData?.website) {
      Linking.openURL(establishmentData.website).catch((err) => {
        console.error("An error occurred", err);
      });
    }
  };

  const handleLetsGoPress = async () => {
    const address = `${establishmentData!.name}, ${establishmentData!.city}, ${
      establishmentData!.country
    }`;
    const encodedAddress = encodeURIComponent(address);
    const appleMapsURL = `http://maps.apple.com/?daddr=${encodedAddress}`;
    const googleMapsAppURL = `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`;
    const wazeURL = `waze://?q=${encodedAddress}&navigate=yes`;
    const googleMapsWebURL = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

    const canOpenAppleMaps = await Linking.canOpenURL(appleMapsURL);
    if (canOpenAppleMaps) {
      await Linking.openURL(appleMapsURL);
      return;
    }

    await Linking.openURL(googleMapsWebURL).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const renderPriceRange = () => {
    return "$".repeat(establishmentData!.priceRange || 0);
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

  if (!location.location?.coords) {
    return null;
  }
  const distanceText = `${calculateDistance(
    location.location.coords.latitude,
    location.location.coords.longitude,
    establishmentData?.latitude || 0,
    establishmentData?.longitude || 0
  )} km`;

  const handleReviewPress = (postId: string) => {
    navigation.navigate("ExpandedPost", {
      postId,
    });
  };

  const handleInvite = () => {
    const restaurantName = establishmentData?.name;
        
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

  useEffect(() => {
    console.log("Establishment ID from route:", establishmentId);
  }, [establishmentId]);
  
  useEffect(() => {
    console.log("Fetched establishment data:", establishmentData);
  }, [establishmentData]);
  
  
  
  

  const posts = (establishmentData?.fewImagePostReview || []).filter(
    (post) => post.imageUrls && post.imageUrls.length > 0
  );

  const columnCount = 2; // Number of columns in the grid
  const columnWidth = (width * 0.89) / columnCount; // Width of each column
  const columnItems = Array.from({ length: columnCount }, () => []); // Array to store column data
  posts.forEach((post, index) => {
    columnItems[index % columnCount].push(post as never); // Distribute posts across columns
  });

  const renderColumn = (items: Post[], columnIndex: number) => {
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
              onPress={() => handleReviewPress(post.id)}
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
                  style={styles.restaurantNameReview}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  @{post.username}
                </Text>
                <Text style={styles.dash}> - </Text>
                <Text style={styles.scoreReview}>{post.ratings?.overall}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return <SkeletonRestaurantProfile />;
  }

  return (
    <>
      {isHeaderVisible && (
        <View style={styles.stickyHeader}>
          <Text style={styles.stickyHeaderText}>{establishmentData?.name}</Text>
        </View>
      )}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <StatusBar style="auto" />
        <ImageBackground
          source={require("../../assets/images/restaurantBackground.png")}
          style={styles.imageBackground}
          blurRadius={2.5}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent"]}
            style={styles.gradient}
          >
            <View style={styles.topIconContainer}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.iconWrapper}
                activeOpacity={1}
              >
                <ArrowLeft color={Colors.text} style={styles.icon} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.restaurantHeaderContainer}>
          <View style={styles.bookmarkContainer}>
            <Bookmark
              size={25}
              color={isSaved ? Colors.highlightText : Colors.text}
              onPress={handleSaveEstablishment}
            />
          </View>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{establishmentData?.name}</Text>
              <Text style={styles.location}>
                {establishmentData?.city}{" "}–{" "}<Text style={styles.distance}>{distanceText} away</Text>
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>
                {establishmentData?.averageRating || 0}
              </Text>
            </View>
          </View>
          <Text style={styles.tags}>
            {establishmentData?.tags.slice(0, 3).join(" • ")}
          </Text>
          <View style={styles.buttonContainer}>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleInvite}
                activeOpacity={1}
              >
                <MessageCircle size={20} color={Colors.text} />
                <Text style={styles.actionButtonText}>Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLetsGoPress}
                activeOpacity={1}
              >
                <MapPin size={20} color={Colors.text} />
                <Text style={styles.actionButtonText}>Let's Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.featuredGalleryContainer}>
          <Text style={styles.featuredGalleryText}>Featured Gallery</Text>
          {establishmentData?.gallery &&
            establishmentData?.gallery.length > 0 && (
              <FlatList
                horizontal
                data={establishmentData?.gallery}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleReviewPress(item.id)}
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
        </View>

        <View style={styles.separator}></View>

        <View style={styles.remainingReviewsContainer}>
          <Text style={styles.remainingReviewsText}>
            {establishmentData?.postCount || 0} Reviews
          </Text>

          <View style={styles.gridGallery}>
            {columnItems.map((items, index) => (
              <View key={index} style={styles.gridColumn}>
                {renderColumn(items, index)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: HEADER_HEIGHT,
    backgroundColor: Colors.header,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  stickyHeaderText: {
    fontFamily: Fonts.SemiBold,
    fontSize: width * 0.05,
    position: "absolute",
    bottom: 12,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageBackground: {
    width: "100%",
    height: height * 0.17,
  },
  gradient: {
    width: "100%",
    height: height * 0.2,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topIconContainer: {
    position: "absolute",
    left: width * 0.08,
    top: height * 0.09,
    zIndex: 10,
  },
  iconWrapper: {
    backgroundColor: Colors.background,
    borderRadius: 90,
    width: width * 0.08,
    height: width * 0.08,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: width * 0.07,
    height: width * 0.07,
  },
  restaurantHeaderContainer: {
    padding: width * 0.05,
    marginTop: height * 0.01,
  },
  bookmarkContainer: {
    position: "relative",
    paddingBottom: height * 0.01,
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
  },
  title: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Bold,
    flexWrap: "wrap",
  },
  location: {
    color: Colors.text,
    fontSize: width * 0.04,
    marginTop: height * 0.005,
    fontFamily: Fonts.Regular,
  },
  distance: {
    color: Colors.text,
    fontSize: width * 0.04,
    fontFamily: Fonts.Regular,
  },
  ratingContainer: {
    backgroundColor: Colors.rating,
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rating: {
    color: "white",
    fontFamily: Fonts.Bold,
    fontSize: width * 0.045,
  },
  tags: {
    color: Colors.tags,
    marginBottom: height * 0.03,
    marginTop: -height * 0.015,
    fontSize: width * 0.035,
  },
  buttonContainer: {
    flexDirection: "column",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: -(width * 0.02),
    marginRight: -(width * 0.02),
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
  featuredGalleryContainer: {
    paddingHorizontal: width * 0.05,
  },
  featuredGalleryText: {
    color: Colors.text,
    fontSize: width * 0.055,
    fontFamily: Fonts.SemiBold,
    marginTop: "1%",
  },
  galleryContainer: {
    marginTop: height * 0.01,
    overflow: "visible",
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
  separator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: "40%",
    alignSelf: "center",
    opacity: 0.2,
    marginTop: -height * 0.01,
  },
  remainingReviewsContainer: {
    marginTop: "4%",
    backgroundColor: Colors.background,
    width: "100%",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 10,
  },
  remainingReviewsText: {
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
});

export default RestaurantProfileScreen;
