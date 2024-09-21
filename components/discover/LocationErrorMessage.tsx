import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { MapPin } from "lucide-react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";

const LocationErrorMessage = () => {
  const isIOS = Platform.OS === "ios";

  const instructions = isIOS
    ? [
        '1. Go to "Settings" on your device',
        '2. Tap "Privacy & Security"',
        '3. Tap "Location Services"',
        "4. Turn on Location Services",
        "5. Scroll down and find our app",
        '6. Tap on it and select "While Using the App"',
      ]
    : [
        '1. Go to "Settings" on your device',
        '2. Tap "Location"',
        '3. Turn on "Use location"',
        '4. Go back to "Settings"',
        '5. Tap "Apps & notifications"',
        '6. Find our app and tap "Permissions"',
        '7. Tap "Location" and select "Allow only while using the app"',
      ];

  return (
    <View style={styles.container}>
      <MapPin size={64} color={Colors.text} />
      <Text style={styles.title}>Location Access Required</Text>
      <Text style={styles.message}>
        Please enable location services to use the Discover feature.
      </Text>
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to enable:</Text>
        {instructions.map((instruction, index) => (
          <Text key={index} style={styles.instruction}>
            {instruction}
          </Text>
        ))}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openSettings()}
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
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.Bold,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    fontFamily: Fonts.Regular,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
  instructionsContainer: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    fontFamily: Fonts.Regular,
    color: Colors.text,
    marginBottom: 5,
  },
  button: {
    backgroundColor: Colors.highlightText,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontFamily: Fonts.Medium,
  },
});

export default LocationErrorMessage;
