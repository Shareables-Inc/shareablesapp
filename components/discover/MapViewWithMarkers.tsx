// MapViewWithMarkers.tsx
import React, { useCallback, useMemo } from "react";
import { Camera, MapView } from "@rnmapbox/maps";
import MapViewComponent from "../map/mapView";
import {
  BookmarkMarker,
  CraftBrasserieMarker,
  PlacesReviewedMarker,
  RestaurantMarker,
  UserMarker,
} from "../map/mapMarkers";
import { useLocationStore } from "../../store/useLocationStore";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const CRAFT_BRASSERIE_ID = "wPMUrAhXuc7vy6uA2ljG";

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
  priceRange: number;
};

export type MarkerTypeWithImage = MarkerType & {
  userProfilePicture: string;
};

interface MapViewWithMarkersProps {
  mapRef: React.RefObject<MapView>;
  cameraRef: React.RefObject<Camera>;
  markers: MarkerTypeWithImage[];
  markerFilter: "save" | "following" | "post" | null;
  onMarkerPress: (marker: any) => void;
  onMapLoaded: () => void;
  onRegionDidChange?: (region: { ne: [number, number]; sw: [number, number] }) => void;
}

const MapViewWithMarkers: React.FC<MapViewWithMarkersProps> = ({
  mapRef,
  markers,
  cameraRef,
  onMarkerPress,
  markerFilter,
  onMapLoaded,
  onRegionDidChange,
}) => {
  const { location, fetchLocation } = useLocationStore();

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
      title: marker.establishmentName ?? "",
    };

    if (marker.establishmentId === CRAFT_BRASSERIE_ID) {
      return <CraftBrasserieMarker {...props} />;
    }

    switch (marker.type) {
      case "save":
        return <BookmarkMarker {...props} />;
      case "following":
        return <UserMarker {...props} image={marker.userProfilePicture} />;
      case "post":
        return <PlacesReviewedMarker {...props} />;
      default:
        return <RestaurantMarker {...props} />;
    }
  };

  return (
    <MapViewComponent
      ref={mapRef}
      onMapLoaded={onMapLoaded}
    >
      {location && (
        <Camera
          ref={cameraRef}
          centerCoordinate={[
            location.coords.longitude,
            location.coords.latitude,
          ]}
          zoomLevel={12}
        />
      )}

      {filteredMarkers.map((marker) => {
        console.log("Rendering marker:", marker.establishmentId, marker.type);
        return renderMarker(marker);
      })}
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
});

export default MapViewWithMarkers;
