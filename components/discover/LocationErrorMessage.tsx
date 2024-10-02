import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { MapPin } from "lucide-react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";

const { width, height} = Dimensions.get("window");

const LocationErrorMessage = () => {
  const isIOS = Platform.OS === "ios";

  return (
    <View style={styles.container}>
      <MapPin size={64} color={Colors.text} />
      <Text style={styles.title}>Location Access Required</Text>
      <Text style={styles.message}>
        Please enable location services to use the Discover map.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openSettings()}
        activeOpacity={1}
      >
        <Text style={styles.buttonText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: width * 0.1,
  },
  title: {
    fontSize: width * 0.06,
    fontFamily: Fonts.Bold,
    color: Colors.text,
    marginTop: width * 0.05,
    marginBottom: width * 0.05,
  },
  message: {
    fontSize: width * 0.045,
    fontFamily: Fonts.Regular,
    color: Colors.text,
    textAlign: "center",
    marginBottom: width * 0.05,
  },
  button: {
    backgroundColor: Colors.tags,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.buttonText,
    fontSize: width * 0.045,
    fontFamily: Fonts.SemiBold,
  },
});

export default LocationErrorMessage;
