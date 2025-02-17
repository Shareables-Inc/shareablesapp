import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { View, StyleSheet, Animated, Button } from "react-native";
import {
  NavigationProp,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { Camera, MapView } from "@rnmapbox/maps";
import { BottomSheetModal, useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useAuth } from "../../context/auth.context";
import { usePostsByUser } from "../../hooks/usePost";
import { useFollowingPosts } from "../../hooks/useUserFollowing";
import { EstablishmentService } from "../../services/establishment.service";
import { uniqBy } from "lodash";
import { RootStackParamList } from "../../types/stackParams.types";
import { Post } from "../../models/post";
import { PersistentBottomSheetModal } from "../../components/establishment/persistentBottomSheetModal";
import Colors from "../../utils/colors";
import RestaurantList from "../../components/establishment/restaurantList";
import CustomBottomSheetModalContent from "../../components/discover/CustomBottomSheetModalContent";
import MapViewWithMarkers, {
  MarkerType,
  MarkerTypeWithImage,
} from "../../components/discover/MapViewWithMarkers";
import { useLocationStore } from "../../store/useLocationStore";
import { Fonts } from "../../utils/fonts";
import LocationErrorMessage from "../../components/discover/LocationErrorMessage";
import { useGetUserSaves } from "../../hooks/useUserSave";
import {
  useEstablishmentProfileData,
  useGetEstablishments,
} from "../../hooks/useEstablishment";
import { EstablishmentCard } from "../../models/establishment";

function DiscoverScreen() {
  const { user } = useAuth();
  const { location, fetchLocation, error } = useLocationStore();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedFilter, setSelectedFilter] = useState<"save" | "post" | "following" | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const restaurantListRef = useRef<BottomSheetModal>(null);
  const establishmentService = new EstablishmentService();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<EstablishmentCard | null>(null);
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const { dismiss } = useBottomSheetModal();
  const { data: userSaves } = useGetUserSaves(user?.uid!);
  const { data: saveEstablishments } = useGetEstablishments(
    userSaves?.saves.map((save) => save.establishmentId) || []
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const { data: posts } = usePostsByUser(user?.uid!);
  const { data: followingPosts } = useFollowingPosts(user?.uid!);
  const [previousFilter, setPreviousFilter] = useState<"save" | "post" | "following" | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const setReturnToCurrentLocation = useLocationStore((state) => state.setReturnToCurrentLocation);
  const isFocused = useIsFocused();
  const { refetch, data: establishmentProfileData } = useEstablishmentProfileData(selectedRestaurantId!);

  useEffect(() => {
    if (isFocused) {
      fetchLocation();
    }
  }, [isFocused, fetchLocation]);

  useEffect(() => {
    setReturnToCurrentLocation(() => {
      if (cameraRef.current && location) {
        cameraRef.current.setCamera({
          centerCoordinate: [location.coords.longitude, location.coords.latitude],
          zoomLevel: 14,
        });
      }
    });
    return () => setReturnToCurrentLocation(() => {});
  }, [setReturnToCurrentLocation, location]);

  // Memoize query results
  const memoizedSaveEstablishments = useMemo(() => saveEstablishments || [], [saveEstablishments]);
  const memoizedPosts = useMemo(() => posts ? posts.pages.flatMap((page) => page.posts) : [], [posts]);
  const memoizedFollowingPosts = useMemo(() => followingPosts ? followingPosts.pages.flatMap((page) => page.posts) : [], [followingPosts]);

  // Update restaurants state based on selected filter
  useEffect(() => {
    if (selectedFilter === previousFilter) {
      setRestaurants([
        ...memoizedSaveEstablishments,
        ...memoizedPosts,
        ...memoizedFollowingPosts,
      ]);
      setPreviousFilter(null);
    } else {
      switch (selectedFilter) {
        case "save":
          setRestaurants(memoizedSaveEstablishments);
          break;
        case "post":
          setRestaurants(memoizedPosts);
          break;
        case "following":
          setRestaurants(memoizedFollowingPosts);
          break;
        default:
          setRestaurants([
            ...memoizedSaveEstablishments,
            ...memoizedPosts,
            ...memoizedFollowingPosts,
          ]);
      }
      setPreviousFilter(selectedFilter);
    }
  }, [selectedFilter, memoizedSaveEstablishments, memoizedPosts, memoizedFollowingPosts]);

  const handleOpenReviewPost = (post: Post) => {
    dismiss();
    setSelectedRestaurant(null);
    navigation.navigate("ExpandedPost", { postId: post.id });
  };

  const focusCamera = useCallback((latitude: number, longitude: number) => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 15,
        animationDuration: 1000,
        padding: { paddingBottom: 200, paddingLeft: 0, paddingRight: 0, paddingTop: 0 },
      });
    }
  }, []);

  // Combine markers without region filtering.
  const getPrioritizedMarkers = useCallback((): MarkerTypeWithImage[] => {
    const allMarkers: MarkerTypeWithImage[] = [
      ...memoizedSaveEstablishments.map((save) => ({
        id: save.id,
        establishmentId: save.id,
        latitude: save.latitude,
        longitude: save.longitude,
        establishmentName: save.name,
        city: save.city,
        country: save.country,
        priceRange: save.priceRange || 0,
        tags: save.tags,
        averageRating: save.averageRating,
        userProfilePicture: "", // default value for saves
        type: "save" as const,
      })),
      ...memoizedFollowingPosts.map((post) => ({
        id: post.establishmentDetails.id,
        userProfilePicture: post.profilePicture,
        establishmentId: post.establishmentDetails.id,
        latitude: post.establishmentDetails.latitude,
        longitude: post.establishmentDetails.longitude,
        establishmentName: post.establishmentDetails.name,
        city: post.establishmentDetails.city,
        country: post.establishmentDetails.country,
        priceRange: post.establishmentDetails.priceRange || 0,
        tags: post.tags,
        averageRating: post.establishmentDetails.averageRating.toString(),
        type: "following" as const,
      })),
      ...memoizedPosts.map((post) => ({
        id: post.id,
        establishmentId: post.establishmentDetails.id,
        latitude: post.establishmentDetails.latitude,
        longitude: post.establishmentDetails.longitude,
        establishmentName: post.establishmentDetails.name,
        city: post.establishmentDetails.city,
        country: post.establishmentDetails.country,
        priceRange: post.establishmentDetails.priceRange || 0,
        userProfilePicture: post.profilePicture,
        tags: post.tags,
        averageRating: post.establishmentDetails.averageRating.toString(),
        type: "post" as const,
      })),
    ];

    console.log("Total markers before filtering:", allMarkers.length);
    // No region filtering now.
    console.log("Markers after filtering:", allMarkers.length);
    return uniqBy(allMarkers, "establishmentId") as MarkerTypeWithImage[];
  }, [memoizedSaveEstablishments, memoizedFollowingPosts, memoizedPosts]);

  useEffect(() => {
    if (restaurantListRef.current) {
      restaurantListRef.current.expand();
    }
  }, []);

  const handleMapLoaded = useCallback(() => {
    setIsMapLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const [shouldPresentBottomSheet, setShouldPresentBottomSheet] = useState(false);

  const handleMarkerPress = useCallback(
    async (marker) => {
      try {
        const establishment = await establishmentService.getEstablishmentCardData(marker.establishmentId);
        if (establishment) {
          setSelectedRestaurant(establishment);
          bottomSheetRef.current?.present();
          focusCamera(marker.latitude, marker.longitude);
        }
      } catch (error) {
        console.error("Error in handleMarkerPress", error);
      }
    },
    [focusCamera, establishmentService]
  );

  useEffect(() => {
    if (selectedRestaurantId && !establishmentProfileData) {
      refetch();
    }
  }, [selectedRestaurantId, refetch, establishmentProfileData]);

  useEffect(() => {
    if (shouldPresentBottomSheet && selectedRestaurant) {
      bottomSheetRef.current?.present();
      setShouldPresentBottomSheet(false);
    }
  }, [shouldPresentBottomSheet, selectedRestaurant]);

  const handleItemSelect = useCallback(
    (marker: MarkerType) => {
      if (restaurantListRef.current?.present) {
        restaurantListRef.current?.collapse();
      }
      handleMarkerPress(marker);
    },
    [handleMarkerPress]
  );

  // Remove region-related code (handleRegionChange, search button, etc.)

  if (error) {
    return <LocationErrorMessage />;
  }

  return (
    <View style={styles.container}>
      <MapViewWithMarkers
        mapRef={mapRef}
        cameraRef={cameraRef}
        markers={getPrioritizedMarkers()}
        onMarkerPress={handleMarkerPress}
        markerFilter={selectedFilter}
        onMapLoaded={handleMapLoaded}
        // Remove onRegionDidChange prop since region filtering is removed.
      />
      {selectedRestaurant && (
        <CustomBottomSheetModalContent
          bottomSheetRef={bottomSheetRef}
          selectedRestaurant={selectedRestaurant}
          userLocation={location}
          onOpenReviewPost={handleOpenReviewPost}
        />
      )}
      <PersistentBottomSheetModal ref={restaurantListRef}>
        <RestaurantList
          restaurants={getPrioritizedMarkers()}
          userLocation={
            location
              ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }
              : null
          }
          onFilterChange={setSelectedFilter}
          selectedFilter={selectedFilter}
          onItemSelect={handleItemSelect}
        />
      </PersistentBottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: Fonts.Medium,
    color: Colors.text,
  },
});

export default React.memo(DiscoverScreen);
