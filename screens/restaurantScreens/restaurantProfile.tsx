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
  TouchableWithoutFeedback,
  TextInput,
  Keyboard,
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
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
} from "firebase/firestore";

import { Post } from "../../models/post";
import {
  ArrowLeft,
  Clock,
  Earth,
  MapPin,
  Search,
  MessageCircle,
  Bookmark,
  Globe,
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

const { width, height } = Dimensions.get("window");

const HEADER_HEIGHT = height * 0.11;

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
  const [isModalVisible, setModalVisible] = useState(false);
  const modalHeight = useRef(new Animated.Value(0)).current;
  const { mutate: createSave } = useCreateUserSave();
  const { mutate: removeSave } = useDeleteUserSave();
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const userSaves = useGetUserSaves(user!.uid);
  const location = useLocationStore();

  const [searchText, setSearchText] = useState<string>("");
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

  console.log("establishmentData", establishmentData);

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

  const toggleModal = () => {
    if (!isModalVisible) {
      setModalVisible(true);
      Animated.timing(modalHeight, {
        toValue: Dimensions.get("window").height * 0.55,
        duration: 350,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePressOutside = () => {
    Keyboard.dismiss();
    if (isModalVisible) {
      Animated.timing(modalHeight, {
        toValue: 0,
        duration: 350,
        useNativeDriver: false,
      }).start(() => {
        setModalVisible(false);
      });
    }
  };

  const handleInvitePress = () => {
    toggleModal();
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
    return "$".repeat(parseInt(establishmentData!.priceRange) || 0);
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

  const handleSendInvite = async (inviteeId) => {
    const inviterId = auth.currentUser?.uid;
    if (!inviterId) {
      console.error("User ID is undefined");
      return;
    }

    // Check if there is already a pending invite
    const pendingInviteQuery = query(
      collection(db, "invites"),
      where("inviterId", "==", inviterId),
      where("inviteeId", "==", inviteeId),
      where("status", "==", "pending")
    );

    const pendingInviteSnapshot = await getDocs(pendingInviteQuery);

    if (!pendingInviteSnapshot.empty) {
      Alert.alert("Error", "You have already sent an invite to this user.");
      return;
    }

    try {
      await addDoc(collection(db, "invites"), {
        inviterId,
        inviteeId,
        status: "pending",
        establishmentId,
      });
      Alert.alert("Success", "Invite sent successfully");
    } catch (error) {
      console.error("Error sending invite:", error);
      Alert.alert("Error", "There was an error sending the invite");
    }
  };

  const renderItem = ({ item, index }: { item: Post; index: number }) => {
    const heights = [150, 200];
    const rowIndex = Math.floor(index / 2); // Assuming 2 columns
    const height =
      rowIndex % 2 === 0 ? heights[index % 2] : heights[(index + 1) % 2];

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleReviewPress(item.id)}
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
            colors={["rgba(0,0,0,0.3)", "transparent"]}
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
              size={20}
              color={isSaved ? Colors.highlightText : Colors.text}
              onPress={handleSaveEstablishment}
            />
          </View>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{establishmentData?.name}</Text>
              <Text style={styles.location}>
                {establishmentData?.city} •{" "}
                {establishmentData?.priceRange || "No Price Range"} •{" "}
                <Text style={styles.distance}>{distanceText}</Text>
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>
                {establishmentData?.averageRating || 0}
              </Text>
            </View>
          </View>
          <Text style={styles.tags}>{establishmentData?.tags.join(" • ")}</Text>
          <View style={styles.buttonContainer}>
            {/* {currentStatus && (
              <TouchableOpacity style={styles.button}>
                <Clock size={20} color={Colors.text} />
                <Text style={styles.buttonText}>{currentStatus}</Text>
              </TouchableOpacity>
            )} */}
            {establishmentData?.website && (
              <TouchableOpacity style={styles.button}>
                <Globe size={20} color={Colors.text} />
                <Text style={styles.buttonText}>
                  {establishmentData?.website}
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButton}>
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

          <FlatList
            data={establishmentData?.fewImagePostReview}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gridContainer}
            numColumns={2}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {isModalVisible && (
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handlePressOutside}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.modal, { height: modalHeight }]}>
            <View style={styles.modalIndicator} />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Find a friend..."
                placeholderTextColor={Colors.charcoal}
                value={searchText}
                onChangeText={setSearchText}
              />
              <Search style={styles.searchIcon} />
            </View>
          </Animated.View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  restaurantHeaderContainer: {
    padding: 16,
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
  bookmarkContainer: {
    position: "relative",
    paddingBottom: 16,
  },
  imageBackground: {
    width: width * 1,
    height: height * 0.2,
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
  gradient: {
    width: width * 1,
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
  restaurantLocation: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.Medium,
  },
  restaurantName: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: Fonts.SemiBold,
  },
  infoBoxesContainer: {
    flexDirection: "row",
    marginLeft: width * 0.05,
  },
  infoBox: {
    backgroundColor: Colors.charcoal,
    padding: width * 0.01,
    borderRadius: 5,
    marginRight: width * 0.04,
    justifyContent: "center",
  },
  infoBoxStatus: {
    backgroundColor: Colors.charcoal,
    padding: width * 0.02,
    borderRadius: 5,
    marginRight: width * 0.04,
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "center",
  },
  scoreContainer: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: 90,
    backgroundColor: Colors.highlightText,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontFamily: Fonts.Bold,
    fontSize: 16,
    color: Colors.background,
  },
  clockIcon: {
    width: width * 0.05,
    height: width * 0.05,
    justifyContent: "center",
    alignSelf: "center",
  },
  infoBoxText: {
    fontSize: 18,
    color: Colors.background,
    fontFamily: Fonts.Regular,
    marginHorizontal: width * 0.015,
  },
  restaurantTagsContainer: {
    marginLeft: width * 0.05,
    marginTop: height * 0.015,
  },
  restaurantTags: {
    color: Colors.highlightText,
    fontSize: 18,
    fontFamily: Fonts.Medium,
  },
  dotStyle: {
    color: Colors.highlightText,
    fontSize: 18,
    fontFamily: Fonts.Medium,
  },
  linksContainer: {
    marginTop: height * 0.02,
    backgroundColor: Colors.profileActivity,
    padding: 10,
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 10,
    flexDirection: "row",
    marginLeft: width * 0.05,
  },
  linkItem: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginHorizontal: width * 0.02,
  },
  linkIcon: {
    width: width * 0.05,
    height: width * 0.05,
    marginRight: width * 0.015,
  },
  linkIconLetsGo: {
    width: width * 0.06,
    height: width * 0.06,
    marginRight: width * 0.007,
  },
  pipeStyle: {
    marginHorizontal: width * 0.025,
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.Light,
    alignSelf: "center",
  },
  pipeStyle2: {
    marginLeft: width * 0.025,
    marginRight: width * 0.015,
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.Light,
    alignSelf: "center",
  },
  linksText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.Medium,
    textAlign: "center",
  },
  featuredGalleryContainer: {
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.025,
  },
  featuredGalleryText: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.SemiBold,
    marginLeft: width * 0.05,
    marginBottom: height * 0.015,
  },
  separator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: width * 0.5,
    alignSelf: "center",
    opacity: 0.2,
    marginTop: height * 0.03,
    marginBottom: height * 0.005,
  },
  galleryScrollView: {
    paddingLeft: width * 0.05,
  },
  remainingReviewsContainer: {
    marginTop: height * 0.02,
    backgroundColor: Colors.background,
    width: width * 1,
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 10,
  },
  remainingReviewsText: {
    color: Colors.highlightText,
    fontSize: 22,
    fontFamily: Fonts.SemiBold,
    marginLeft: width * 0.05,
    marginBottom: height * 0.015,
  },
  imageGalleryContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: height * 0.01,
    width: width * 0.37,
  },
  profileImage: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: 90,
    marginRight: width * 0.015,
  },
  profileUserName: {
    color: Colors.highlightText,
    fontSize: 14,
    fontFamily: Fonts.Medium,
  },
  gridGallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: width * 0.03,
  },
  gridColumn: {
    flexDirection: "column",
    position: "relative",
    width: "48.5%",
  },

  stickyHeader: {
    position: "absolute",
    top: height * 0,
    width: width * 1,
    height: HEADER_HEIGHT,
    backgroundColor: Colors.header,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  stickyHeaderText: {
    fontFamily: Fonts.SemiBold,
    fontSize: 22,
    position: "absolute",
    bottom: 10,
  },
  profileUserNameReview: {
    color: Colors.charcoal,
    fontSize: 15,
    fontFamily: Fonts.Medium,
    marginTop: -(height * 0.015),
    marginBottom: height * 0.02,
  },
  profileUserNameReviewScore: {
    color: Colors.highlightText,
    fontSize: 15,
    fontFamily: Fonts.Medium,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  modal: {
    backgroundColor: "white",
    paddingTop: height * 0.02,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: width * 1,
  },
  modalIndicator: {
    alignSelf: "center",
    width: width * 0.11,
    height: 5,
    backgroundColor: Colors.placeholderText,
    borderRadius: 90,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    alignSelf: "center",
    padding: width * 0.03,
  },
  searchInput: {
    height: height * 0.045,
    paddingLeft: width * 0.11,
    paddingRight: width * 0.05,
    backgroundColor: Colors.inputBackground,
    fontSize: 16,
    borderRadius: 18,
    width: "95%",
    alignSelf: "center",
    color: Colors.text,
    fontFamily: Fonts.Medium,
  },
  searchIcon: {
    position: "absolute",
    left: width * 0.07,
    width: width * 0.05,
    height: width * 0.05,
  },
  friendsContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.06,
    paddingBottom: height * 0.03,
  },
  profileDetailsInvite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: height * 0.015,
    width: "100%",
  },
  userInfo: {
    flex: 1,
    marginLeft: width * 0.025,
  },
  userName: {
    fontFamily: Fonts.Medium,
    fontSize: 20,
    color: Colors.text,
  },
  restaurantInfo: {
    fontSize: 16,
    fontFamily: Fonts.Regular,
    color: Colors.text,
  },
  inviteButton: {
    backgroundColor: Colors.highlightText,
    paddingVertical: width * 0.023,
    paddingHorizontal: width * 0.055,
    borderRadius: 10,
  },
  inviteText: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: Fonts.Medium,
  },
  scoreContainerGallery: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: 20,
    backgroundColor: Colors.highlightText,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: width * 0.013,
    right: width * 0.045,
    opacity: 0.95,
  },
  scoreTextGallery: {
    fontFamily: Fonts.Bold,
    fontSize: 15,
    color: Colors.background,
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
});

export default RestaurantProfileScreen;
