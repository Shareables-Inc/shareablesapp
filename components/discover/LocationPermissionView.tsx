import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Colors from "../../utils/colors";

interface LocationPermissionViewProps {
  onEnableLocation: () => void;
}

const LocationPermissionView: React.FC<LocationPermissionViewProps> = ({
  onEnableLocation,
}) => (
  <View style={styles.container}>
    <Text style={styles.messageText}>
      Location access is required to use this feature.
    </Text>
    <TouchableOpacity style={styles.button} onPress={onEnableLocation}>
      <Text style={styles.buttonText}>Enable Location</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.highlightText,
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default LocationPermissionView;
