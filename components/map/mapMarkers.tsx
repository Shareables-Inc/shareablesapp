import {
  Flame,
  MapPin,
  Bookmark,
  Book,
  User,
  UtensilsCrossed,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Fonts } from "../../utils/fonts";
import Colors from "../../utils/colors";
import { Circle, Path, Svg } from "react-native-svg";
import { MarkerView } from "@rnmapbox/maps";
import FastImage from "react-native-fast-image";

// Add these color pairs at the top of the file
const markerColors = {
  bookmark: { main: Colors.saveBookmarkMarker, textShadow: "#FFD700" }, // Gold
  placesReviewed: { main: Colors.placesReviewedMarker, textShadow: "#FF6B6B" }, // Soft Red
  trending: { main: Colors.trendingMarker, textShadow: "#4ECDC4" }, // Turquoise
  user: { main: Colors.highlightText, textShadow: "#FF9FF3" }, // Soft Pink
  restaurant: { main: Colors.highlightText, textShadow: "#FF6B6B" }, // Soft Red
};

interface MarkerProps {
  coordinate: {
    longitude: number;
    latitude: number;
  };
  id: string;
  title: string;
  onPress: () => void;
}

interface UserMarkerProps extends MarkerProps {
  image: string;
}

export const RestaurantMarker = ({
  coordinate,
  title,
  onPress,
}: MarkerProps) => {
  return (
    <MarkerView coordinate={[coordinate.longitude, coordinate.latitude]}>
      <TouchableOpacity onPress={onPress}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: markerColors.restaurant.main,
              borderColor: markerColors.restaurant.main,
              borderWidth: 2,
            },
          ]}
        >
          <UtensilsCrossed fill={"white"} size={18} color="white" />
        </View>
        <Text
          style={[
            styles.markerText,
            {
              textShadowColor: Colors.highlightText,
              textShadowOffset: { width: -1, height: -1 },
              textShadowRadius: 1,
            },
            {
              textShadowColor: Colors.highlightText,
              textShadowOffset: { width: 1, height: -1 },
              textShadowRadius: 1,
            },
            {
              textShadowColor: Colors.highlightText,
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 1,
            },
            {
              textShadowColor: Colors.highlightText,
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 1,
            },
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </MarkerView>
  );
};

export const BookmarkMarker = ({
  id,
  coordinate,
  title,
  onPress,
}: MarkerProps) => {
  // create a callback function that will be called when the marker is pressed
  const handleMarkerPress = useCallback(() => {
    onPress();
  }, [onPress]);
  return (
    <MarkerView coordinate={[coordinate.longitude, coordinate.latitude]}>
      <TouchableOpacity onPress={handleMarkerPress}>
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: markerColors.bookmark.main,
                borderColor: markerColors.bookmark.main,
                borderWidth: 2,
              },
            ]}
          >
            <Bookmark fill={"white"} size={18} color="white" />
          </View>
          <Text
            style={[
              styles.markerText,
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </MarkerView>
  );
};

export const PlacesReviewedMarker = ({
  coordinate,
  title,
  onPress,
}: MarkerProps) => {
  const handleMarkerPress = useCallback(() => {
    onPress();
  }, [onPress]);
  return (
    <MarkerView coordinate={[coordinate.longitude, coordinate.latitude]}>
      <TouchableOpacity onPress={handleMarkerPress}>
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: markerColors.placesReviewed.main,
                borderColor: markerColors.placesReviewed.main,
                borderWidth: 2,
              },
            ]}
          >
            <Svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
              <Circle cx="12" cy="10" r="4" fill="#22C7B8" />
            </Svg>
          </View>
          <Text
            style={[
              styles.markerText,
              { color: Colors.placesReviewedMarker },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </MarkerView>
  );
};

export const TrendingMarker = ({ coordinate, title, onPress }: MarkerProps) => {
  const handleMarkerPress = useCallback(() => {
    onPress();
  }, [onPress]);
  return (
    <MarkerView coordinate={[coordinate.longitude, coordinate.latitude]}>
      <TouchableOpacity onPress={handleMarkerPress}>
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: markerColors.trending.main,
                borderColor: markerColors.trending.main,
                borderWidth: 2,
              },
            ]}
          >
            <Flame fill={"white"} size={20} color="white" />
          </View>
          <Text
            style={[
              styles.markerText,
              { color: Colors.trendingMarker },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </MarkerView>
  );
};

export const UserMarker = ({
  coordinate,
  image,
  title,
  onPress,
}: UserMarkerProps) => {
  const handleMarkerPress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <MarkerView coordinate={[coordinate.longitude, coordinate.latitude]}>
      <TouchableOpacity onPress={handleMarkerPress}>
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: markerColors.user.main,
                borderColor: markerColors.user.main,
                borderWidth: 2,
              },
            ]}
          >
            <Image
              source={{
                uri: image,
              }}
              style={styles.userImage}
            />
          </View>
          <Text
            style={[
              styles.markerText,
              { color: Colors.highlightText },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: -1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: -1, height: 1 },
                textShadowRadius: 1,
              },
              {
                textShadowColor: Colors.lavender,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </MarkerView>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: Colors.saveBookmarkMarker,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    maxWidth: "80%",
  },
  markerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  markerText: {
    fontSize: 14,
    color: Colors.saveBookmarkMarker,
    fontFamily: Fonts.SemiBold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  userImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.highlightText,
  },
});
