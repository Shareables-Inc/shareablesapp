// mapView.tsx
import React, { useCallback, forwardRef } from "react";
import Mapbox, { LocationPuck, MapView } from "@rnmapbox/maps";
import { StyleSheet, View, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "");

interface MapViewComponentProps {
  children: React.ReactNode;
  onMapLoaded: () => void;
}

const MapViewComponent = forwardRef<MapView, MapViewComponentProps>(
  ({ children, onMapLoaded }, ref) => {
    const handleMapLoaded = useCallback(() => {
      onMapLoaded?.();
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
          attributionEnabled
          attributionPosition={{ bottom: width * 0.21, right: 0 }}
          compassEnabled={false}
          rotateEnabled
          scaleBarEnabled={false}
          onDidFinishLoadingMap={handleMapLoaded}
        >
          <LocationPuck
            puckBearingEnabled
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
});

export default MapViewComponent;
