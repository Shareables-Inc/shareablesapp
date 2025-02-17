import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  Modal,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { UserService } from "../../services/user.service";
import type { FeaturedEstablishment } from "../../models/establishment";
import FastImage from "react-native-fast-image";
import { useNavigation } from "@react-navigation/native";
import { useGetFeaturedEstablishments } from "../../hooks/useEstablishment";
import { useAuth } from "../../context/auth.context";
import { UserProfile } from "../../models/userProfile";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

interface RestaurantsViewProps {
  location: string;
}

// New interface for discount details
interface DiscountDetail {
  image: any;
  contactType: "eml" | "website";
  contactValue: string;
}

const RestaurantsView: React.FC<RestaurantsViewProps> = ({ location }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const userService = new UserService();
  const { userProfile } = useAuth();

  const {
    data: featuredEstablishments,
    isLoading: isFeaturedEstablishmentsLoading,
    refetch: refetchFeaturedEstablishments,
  } = useGetFeaturedEstablishments(location, {
    staleTime: 0, // Always fetch fresh data
  });

  const [topFollowedUsers, setTopFollowedUsers] = useState([]);
  const [isTopFollowedLoading, setIsTopFollowedLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ====== DISCOUNT CAROUSEL & MODAL STATE ======
  // Replace discountImages with discountDetails and update file paths and contact info as needed.
  const discountDetails: DiscountDetail[] = [
    {
      image: require("../../assets/images/discounts/discountBaro.png"),
      contactType: "website",
      contactValue: "https://sipandsavour.beehiiv.com/p/free-margarita-baro-petty-cash", // Update to your actual URL
    },
    {
      image: require("../../assets/images/discounts/discountCubana.png"),
      contactType: "website",
      contactValue: "https://sipandsavour.beehiiv.com/p/la-cubana",
    },
    {
      image: require("../../assets/images/discounts/discountMilky.png"),
      contactType: "website",
      contactValue: "https://sipandsavour.beehiiv.com/p/milkys-25-off?utm_campaign=25-off-milky-s-cafes&utm_medium=newsletter&utm_source=sipandsavour.beehiiv.com",
    },
  ];
  const [activeSlide, setActiveSlide] = useState(0);
  const discountScrollRef = useRef<ScrollView>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountDetail | null>(null);

  // Update active slide based on scroll position
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / (width * 0.9));
    setActiveSlide(currentIndex);
  };

  // Auto-swipe every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      let nextSlide = activeSlide + 1;
      if (nextSlide >= discountDetails.length) {
        nextSlide = 0;
      }
      discountScrollRef.current?.scrollTo({
        x: nextSlide * (width * 0.9),
        animated: true,
      });
      setActiveSlide(nextSlide);
    }, 4500);

    return () => clearInterval(interval);
  }, [activeSlide, discountDetails.length]);

  // Open modal when a discount is pressed
  const handleDiscountPress = (discount: DiscountDetail) => {
    setSelectedDiscount(discount);
    setModalVisible(true);
  };

  const fetchTopFollowedUsers = useCallback(async () => {
    setIsTopFollowedLoading(true);
    try {
      const users = await userService.getTopFollowedUsers(location);
      setTopFollowedUsers(users);
    } catch (error) {
      console.error("Error fetching top followed users:", error);
    } finally {
      setIsTopFollowedLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchTopFollowedUsers();
  }, [fetchTopFollowedUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchFeaturedEstablishments(),
        fetchTopFollowedUsers(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigateToRestaurantProfile = (
    establishmentData: FeaturedEstablishment
  ) => {
    navigation.navigate("RestaurantProfile", {
      establishmentId: establishmentData.id,
    });
  };

  const handleTopFollowedUser = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const getTopTenEstablishments = (): FeaturedEstablishment[] => {
    if (!featuredEstablishments || featuredEstablishments.length === 0)
      return [];

    const sortedEstablishments = [...featuredEstablishments].sort(
      (a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating)
    );
    const uniqueEstablishments = Array.from(
      new Map(sortedEstablishments.map((est) => [est.id, est])).values()
    );
    return uniqueEstablishments.slice(0, 10);
  };

  const renderTopFollowedUser = ({
    item,
  }: {
    item: UserProfile & { followerCount: number };
  }) => (
    <TouchableOpacity
      style={styles.topPosterItem}
      onPress={() => handleTopFollowedUser(item.id)}
      activeOpacity={1}
    >
      <View style={styles.posterContent}>
        <FastImage
          source={{
            uri: item.profilePicture,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.topPosterImage}
        />
        <View style={styles.posterTextContainer}>
          <Text style={styles.topPosterUsername} numberOfLines={1} ellipsizeMode="tail">
            @{item.username}
          </Text>
          <Text style={styles.topPosterFollowers}>
            {item.followerCount} {t("explore.followersExplore")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedRestaurants = ({
    item,
  }: {
    item: FeaturedEstablishment;
  }) => {
    if (!item || !item.images || item.images.length === 0) return null;

    return (
      <View style={styles.featuredRestaurantCardContainer}>
        <TouchableOpacity
          onPress={() => handleNavigateToRestaurantProfile(item)}
          activeOpacity={1}
        >
          <View style={styles.featuredRestaurantCard}>
            <FastImage
              source={{
                uri: item.images[0] || "placeholder_image_url",
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.featuredRestaurantImage}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.restaurantNameText} numberOfLines={1} ellipsizeMode="tail">
          {item.name || "Unknown Restaurant"}
        </Text>
        <Text style={styles.averageRatingText} numberOfLines={1} ellipsizeMode="tail">
          {item.averageRating || "N/A"}
        </Text>
      </View>
    );
  };

  // For website links, open URL using Linking.
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  return (
    <ScrollView
      style={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.tags} />
      }
    >
      <Text style={styles.sectionTitleDiscount}>{t("explore.weeklyDiscount")}</Text>

      {/* Discount Carousel with Auto Swipe */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.discountCarousel}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ref={discountScrollRef}
      >
        {discountDetails.map((discount, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => handleDiscountPress(discount)}
          >
            <View style={styles.discountCard}>
              <FastImage source={discount.image} style={styles.discountImage} resizeMode="cover" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {discountDetails.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeSlide ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Modal for discount content */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedDiscount && (
              <>
                {selectedDiscount.contactType === "eml" ||
                selectedDiscount.contactType === "website" ? (
                  // Display the website (or EML file) using a WebView
                  <View style={{ width: "100%", height: width * 1.5 }}>
                    <WebView
                      source={{ uri: selectedDiscount.contactValue }}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitleFeatured}>{t("explore.topRestaurants")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingRight: width * 0.03, flexDirection: "row" }}>
          {getTopTenEstablishments().slice(0, 5).map((item) => (
            <View key={item.id}>{renderFeaturedRestaurants({ item })}</View>
          ))}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingRight: width * 0.03, flexDirection: "row" }}>
          {getTopTenEstablishments().slice(5, 10).map((item) => (
            <View key={item.id}>{renderFeaturedRestaurants({ item })}</View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.sectionTitleFoodies}>{t("explore.localFoodies")}</Text>
      {isTopFollowedLoading ? (
        <ActivityIndicator size="small" color={Colors.tags} />
      ) : (
        <FlatList
          data={topFollowedUsers}
          renderItem={renderTopFollowedUser}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.topPostersContainer}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          contentContainerStyle={styles.justifyContentSpaceBetween}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {},
  sectionTitleFoodies: {
    fontSize: width * 0.055,
    fontFamily: Fonts.Medium,
    paddingTop: width * 0.07,
    paddingBottom: width * 0.03,
    marginLeft: width * 0.05,
  },
  sectionTitleFeatured: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Medium,
    paddingBottom: width * 0.03,
    marginTop: width * 0.07,
    marginLeft: width * 0.05,
  },
  sectionTitleDiscount: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Medium,
    paddingBottom: width * 0.03,
    marginTop: width * 0.07,
    marginLeft: width * 0.05,
  },
  discountCarousel: {
    width: width * 0.9,
    alignSelf: "center",
  },
  discountCard: {
    width: width * 0.9,
    height: width * 0.4,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  discountImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#000",
  },
  inactiveDot: {
    backgroundColor: "#ccc",
  },
  sectionTitleChef: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Medium,
    paddingBottom: width * 0.03,
    marginTop: width * 0.07,
    marginLeft: width * 0.05,
  },
  discountOffer: {
    fontSize: width * 0.055,
    color: Colors.background,
    fontFamily: Fonts.SemiBold,
  },
  discountRestaurant: {
    marginTop: width * 0.02,
    fontSize: width * 0.04,
    fontFamily: Fonts.SemiBold,
    color: Colors.charcoal,
    textAlign: "left",
    width: width * 0.5,
    marginBottom: width * 0.01,
    marginLeft: width * 0.05,
  },
  justifyContentSpaceBetween: {
    marginLeft: width * 0.05,
  },
  topPostersContainer: {
    marginBottom: width * 0.05,
    marginTop: width * 0.01,
  },
  topPosterItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 15,
    paddingHorizontal: width * 0.02,
    paddingVertical: width * 0.015,
    minWidth: width * 0.2,
    borderColor: Colors.inputBackground,
    borderWidth: 2,
  },
  posterContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  topPosterImage: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 90,
    marginRight: width * 0.02,
  },
  posterTextContainer: {
    flex: 1,
  },
  topPosterUsername: {
    fontSize: width * 0.035,
    fontFamily: Fonts.Regular,
    color: Colors.charcoal,
  },
  topPosterFollowers: {
    fontSize: width * 0.035,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginTop: 2,
  },
  itemSeparator: {
    width: width / 6 / 5,
  },
  featuredRestaurantCardContainer: {
    width: "100%",
    paddingLeft: width * 0.05,
    marginRight: -(width * 0.02),
    marginTop: width * 0.01,
  },
  featuredRestaurantCard: {
    width: width * 0.55,
    height: width * 0.33,
    borderRadius: 12,
    overflow: "hidden",
  },
  featuredRestaurantImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  restaurantNameText: {
    marginTop: width * 0.02,
    fontSize: width * 0.04,
    fontFamily: Fonts.SemiBold,
    color: Colors.charcoal,
    textAlign: "left",
    width: width * 0.5,
    marginBottom: width * 0.01,
  },
  averageRatingText: {
    fontSize: width * 0.035,
    fontFamily: Fonts.Regular,
    color: Colors.charcoal,
    textAlign: "left",
    width: width * 0.35,
    marginBottom: width * 0.01,
  },
  featuredRestaurantOverlay: {
    position: "absolute",
    top: -10,
    right: -10,
    padding: "7%",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 90,
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.95,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: Colors.text,
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 10
  },
  closeButtonText: {
    color: Colors.background,
    fontFamily: Fonts.Medium,
    fontSize: width * 0.05,
  },
});

export default RestaurantsView;
