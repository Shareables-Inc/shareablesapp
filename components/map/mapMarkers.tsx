import {
  Flame,
  MapPin,
  Bookmark,
  Book,
  User,
  UtensilsCrossed,
  MapPinCheckInside,
  CircleUserRound,
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
  bookmark: { main: Colors.saveBookmarkMarker, textShadow: "#000000" },
  placesReviewed: { main: Colors.placesReviewedMarker, textShadow: "#000000" }, 
  trending: { main: Colors.trendingMarker, textShadow: "#000000" }, 
  user: { main: Colors.followingMarker, textShadow: "#000000" }, 
  restaurant: { main: Colors.tags, textShadow: "#000000" }, 
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

const restaurant = {
  id: 'wPMUrAhXuc7vy6uA2ljG',
  name: 'The Craft Brasserie & Grille',
  coordinate: {
    latitude: 43.639533,
    longitude: -79.420785,
  },
};

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
              borderColor: Colors.background,
              borderWidth: 2,
            },
          ]}
        >
          <UtensilsCrossed size={18} color="white" strokeWidth={2.5}/>
        </View>
        <Text
          style={[
            styles.markerText,
            {
              textShadowColor: Colors.tags,
              textShadowOffset: { width: -1, height: -1 },
              textShadowRadius: 1,
            },
            {
              textShadowColor: Colors.tags,
              textShadowOffset: { width: 1, height: -1 },
              textShadowRadius: 1,
            },
            {
              textShadowColor: Colors.tags,
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 1,
            },
            {
              textShadowColor: Colors.tags,
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 1,
            },
          ]}
        >
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
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
            <Bookmark size={22} color="white" strokeWidth={2.5}/>
          </View>
          <View
            style={[
              styles.iconContainerSmall,
              {
                backgroundColor: markerColors.bookmark.main,
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
          </View>
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
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
            <MapPinCheckInside size={22} color="white" strokeWidth={2.5}/>
          </View>
          <View
            style={[
              styles.iconContainerSmall,
              {
                backgroundColor: markerColors.placesReviewed.main,
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
          </View>
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
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
            <CircleUserRound size={20} color="white" strokeWidth={2.5}/>
          </View>
          <View
            style={[
              styles.iconContainerSmall,
              {
                backgroundColor: markerColors.user.main,
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
          </View>
        </View>
      </TouchableOpacity>
    </MarkerView>
  );
};

export const CraftBrasserieMarker = ({
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
              styles.iconContainerFeature,
              {
                backgroundColor: Colors.tags,
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
            <Svg
              width="27"
              height="31"
              viewBox="0 0 16 21"
              fill="none"
            >
            <Path 
              d="M2.04157 3.30155C1.74049 3.35924 1.54355 3.64986 1.60116 3.95029L4.42934 18.7006C4.48695 19.0011 4.77742 19.1983 5.07851 19.1406L13.9584 17.4393C14.2595 17.3816 14.4564 17.091 14.3988 16.7905L11.5707 2.04021C11.5131 1.73977 11.2226 1.54254 10.9215 1.60022L2.04157 3.30155ZM0.345185 4.19093C0.154505 3.19644 0.806435 2.23612 1.80076 2.04561L10.6807 0.344285C11.675 0.15378 12.6359 0.805089 12.8266 1.79958L15.6548 16.5499C15.8455 17.5444 15.1936 18.5047 14.1992 18.6952L5.31932 20.3966C4.32499 20.5871 3.36405 19.9357 3.17337 18.9413L0.345185 4.19093Z" fill="white"/>

            <Path 
              d="M4.3491 15.3129C4.21348 14.6204 4.66718 13.95 5.36252 13.8162L10.998 12.7271C10.998 12.7271 11.3604 12.6842 11.3949 12.4361C11.3949 12.4361 11.4036 12.3011 11.316 12.2188C11.316 12.2188 10.7871 11.7682 9.92906 11.6577C9.07098 11.5472 8.42742 11.7154 8.42742 11.7154C8.42742 11.7154 7.83935 11.7989 7.14524 12.2667C7.14524 12.2667 6.92209 12.4018 6.71374 12.5921C6.52634 12.764 6.29826 12.8855 6.04799 12.9297L5.19608 13.0795C4.50814 13.1998 3.85102 12.7505 3.71664 12.0678L2.23473 4.51545C2.23473 4.51545 2.16076 4.08816 2.62925 3.93469L10.3618 2.43797C10.3618 2.43797 10.9388 2.2538 11.0707 2.83333L11.729 6.19265C11.8647 6.88392 11.411 7.55431 10.7169 7.68937L8.59633 8.10192C8.59633 8.10192 8.41016 8.1142 8.33989 8.32661C8.33989 8.32661 8.3251 8.40765 8.16359 8.42115L7.75674 8.49974C7.75674 8.49974 7.66058 8.51938 7.61866 8.41502C7.61866 8.41502 7.55455 8.12402 7.23154 8.02088C7.23154 8.02088 7.05648 7.94844 6.75072 8.03562L4.58704 8.45553C4.58704 8.45553 4.24677 8.5157 4.33184 8.93193L6.74826 8.4629C6.74826 8.4629 6.84565 8.44203 6.88387 8.60533C6.88387 8.60533 6.91223 8.75021 6.81237 8.78827L4.51307 9.2352C4.51307 9.2352 4.40088 9.25485 4.41814 9.37517L4.4317 9.4427C4.4317 9.4427 4.45882 9.55935 4.57225 9.53725L6.87154 9.09032C6.87154 9.09032 6.96401 9.06699 7.00716 9.23274C7.00716 9.23274 7.03798 9.37886 6.93566 9.41569L4.51923 9.88472L4.54266 10.0038C4.54266 10.0038 4.57225 10.2985 4.93471 10.2285L7.25127 9.7779C7.25127 9.7779 7.50154 9.74106 7.62359 9.58881C7.74565 9.43656 7.78387 9.31255 7.76044 9.0805C7.76044 9.0805 7.75674 8.96753 7.85661 8.94912L8.33866 8.8558C8.33866 8.8558 8.39044 8.83984 8.45085 8.89387C8.45085 8.89387 8.57414 9.04489 8.77386 9.0056L10.9055 8.59182C11.5996 8.45676 12.2727 8.9086 12.4084 9.59986L13.7004 16.2142C13.7004 16.2142 13.7448 16.4069 13.6301 16.5739C13.6301 16.5739 13.5303 16.7875 13.2147 16.8293L5.51416 18.326C5.51416 18.326 5.29224 18.3886 5.09622 18.2609C5.09622 18.2609 4.90266 18.1627 4.85211 17.8828L4.3491 15.3154V15.3129Z" 
              fill="white"
            />
            </Svg>
          </View>
          <View
            style={[
              styles.iconContainerSmall,
              {
                backgroundColor: Colors.tags,
                borderColor: Colors.background,
                borderWidth: 2,
              },
            ]}
          >
        </View>
        </View>
      </TouchableOpacity>
    </MarkerView>
  );
};


const styles = StyleSheet.create({
  iconContainer: {
    width: 31,
    height: 31,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerSmall: {
    width: 8,
    height: 8,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerFeature: {
    width: 42,
    height: 42,
    borderRadius: 90,
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
    flexDirection: "column",
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
    borderColor: Colors.tags,
  },
});
