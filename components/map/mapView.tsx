import React, { useState, forwardRef, useCallback } from "react";
import Mapbox, { LocationPuck, MapView, Viewport } from "@rnmapbox/maps";
import { StyleSheet, View, ActivityIndicator, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "");

interface MapViewComponentProps {
  children: React.ReactNode;
  onMapLoaded: () => void;
}

const MapViewComponent = forwardRef<MapView, MapViewComponentProps>(
  ({ children, onMapLoaded }, ref) => {
    const handleMapLoaded = useCallback(() => {
      
      onMapLoaded?.(); // Call the onMapLoaded prop if provided
    }, [onMapLoaded]);
    return (
      <View style={styles.container}>
        <MapView
          ref={ref}
          projection="mercator"
          style={styles.map}
          styleURL="mapbox://styles/dpatelshareables/cm1cpsc6000p001qk98k1848a"
          logoEnabled={false}
          pitchEnabled={false}
          attributionEnabled={true}
          attributionPosition={{ bottom: width * 0.21, right: 0 }}
          compassEnabled={false}
          rotateEnabled={true}
          scaleBarEnabled={false}
          onDidFinishLoadingMap={handleMapLoaded}
        >
          <LocationPuck
            puckBearingEnabled={true}
            puckBearing="heading"
            pulsing={{ isEnabled: true }}
          />
          {children}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});

export default MapViewComponent;
