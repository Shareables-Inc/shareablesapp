import React, { useCallback, useMemo, useState } from "react";
import { Camera, MapView, Viewport } from "@rnmapbox/maps";
import MapViewComponent from "../map/mapView";
import {
  BookmarkMarker,
  PlacesReviewedMarker,
  RestaurantMarker,
  UserMarker,
} from "../map/mapMarkers";
import { useLocationStore } from "../../store/useLocationStore";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Navigation } from "lucide-react-native";
import { Colors } from "../../utils/colors";
interface MapViewWithMarkersProps {
  mapRef: React.RefObject<MapView>;
  cameraRef: React.RefObject<Camera>;

  markers: MarkerTypeWithImage[];
  markerFilter: "save" | "following" | "post" | null;
  onMarkerPress: (marker: any) => void;
  onMapLoaded: () => void;
}

export type MarkerType = {
  type: "save" | "following" | "post" | null;
  id: string;
  establishmentId: string;
  latitude: number;
  longitude: number;
  establishmentName: string;
  city: string;
  country: string;
  username?: string;
  averageRating: string;
  tags: string[];
  priceRange: string;
};

export type MarkerTypeWithImage = MarkerType & {
  userProfilePicture: string;
};

const MapViewWithMarkers: React.FC<MapViewWithMarkersProps> = ({
  mapRef,
  markers,
  cameraRef,
  onMarkerPress,
  markerFilter,
  onMapLoaded,
}) => {
  const { location, fetchLocation, isLoading } = useLocationStore();

  const filteredMarkers = useMemo(
    () =>
      markerFilter
        ? markers.filter((marker) => marker.type === markerFilter)
        : markers,
    [markers, markerFilter]
  );

  useFocusEffect(
    useCallback(() => {
      if (!location) {
        fetchLocation();
      }
    }, [location, fetchLocation])
  );

  const renderMarker = (marker: MarkerTypeWithImage) => {
    const props = {
      key: marker.establishmentId,
      id: marker.establishmentId,
      coordinate: { longitude: marker.longitude, latitude: marker.latitude },
      onPress: () => onMarkerPress(marker),
    };

    switch (marker.type) {
      case "save":
        return <BookmarkMarker title={marker.establishmentName} {...props} />;
      case "following":
        return (
          <UserMarker
            {...props}
            image={marker.userProfilePicture}
            title={marker.establishmentName}
          />
        );
      case "post":
        return (
          <PlacesReviewedMarker
            {...props}
            title={marker.establishmentName ?? ""}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MapViewComponent ref={mapRef} onMapLoaded={onMapLoaded}>
      {location && (
        <Camera
          ref={cameraRef}
          centerCoordinate={[
            location.coords.longitude,
            location.coords.latitude,
          ]}
          zoomLevel={10}
        />
      )}

      {filteredMarkers.map(renderMarker)}
    </MapViewComponent>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: "absolute",
    borderRadius: 12,
    top: 70,
    right: 20,
    zIndex: 10,
    opacity: 0.8,
    backgroundColor: "#484545B2",
  },
  iconButton: {
    borderRadius: 20,
    padding: 8,
  },
});

export default MapViewWithMarkers;
