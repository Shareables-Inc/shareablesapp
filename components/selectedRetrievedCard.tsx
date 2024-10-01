import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// use lucide icons
import { X } from "lucide-react-native";
import Colors from "../utils/colors";
import { Fonts } from "../utils/fonts";
import { Establishment } from "../models/establishment";

type SelectedRetrievedCardProps = {
  retrievedSuggestion: Establishment;
  onClear: () => void;
};

const SelectedRetrievedCard = ({
  retrievedSuggestion,
  onClear,
}: SelectedRetrievedCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{retrievedSuggestion.name}</Text>
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={styles.fullAddress}>{retrievedSuggestion.address}, {retrievedSuggestion.city}, {retrievedSuggestion.country}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  address: {
    fontSize: 16,
    fontFamily: Fonts.Regular,
    color: Colors.text,
    marginBottom: 4,
  },
  fullAddress: {
    fontSize: 14,
    fontFamily: Fonts.Regular,
    color: Colors.text,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  category: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: Fonts.Medium,
    color: Colors.text,
  },
});

export default SelectedRetrievedCard;
