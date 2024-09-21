import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { ArrowLeft } from "lucide-react-native";

const TAGS_DATA = [
  "Date Night",
  "Coffee Shop",
  "Sports",
  "Vegan",
  "Family Friendly",
  "Brunch",
  "Vegetarian",
  "Live Music",
  "Buffet",
  "Deli",
  "Business",
  "Late Night Eats",
  "Craft Beer",
  "Lunch Spots",
  "Healthy",
  "Patio",
  "Dessert",
  "Bakery",
  "Pizza",
  "Burgers",
  "Sushi",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Indian",
  "Vietnamese",
  "Middle Eastern",
  "Greek",
  "Mediterranean",
  "African",
  "Caribbean",
  "Latin American",
  "European",
  "North American",
  "South American",
  "Central American",
  "Australian",
  "New Zealand",
  "Seafood",
  "Steakhouse",
  "BBQ",
  "Fast Food",
  "Food Truck",
  "Food Court",
  "Fine Dining",
  "Casual Dining",
];

const MAX_TAGS = 4;

const TagsSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedTags, setSelectedTags] = useState([]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTags((prevSelectedTags) => {
      if (prevSelectedTags.includes(tag)) {
        // Deselect if the tag is already selected
        return prevSelectedTags.filter((t) => t !== tag);
      } else {
        // Select a new tag only if less than MAX_TAGS are selected
        if (prevSelectedTags.length < MAX_TAGS) {
          return [...prevSelectedTags, tag];
        } else {
          return prevSelectedTags;
        }
      }
    });
  };

  const isTagSelected = (tag: string) => {
    return selectedTags.includes(tag);
  };

  const renderTags = () => {
    return TAGS_DATA.map((item, index) => (
      <TouchableOpacity
        key={index}
        style={[styles.tag, isTagSelected(item) ? styles.tagSelected : {}]}
        onPress={() => handleSelectTag(item)}
        activeOpacity={1}
      >
        <Text
          style={[
            styles.tagText,
            isTagSelected(item) ? styles.tagTextSelected : {},
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backArrowContainer}
        >
          <ArrowLeft style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Up to 4 Tags</Text>
      </View>

      <View style={styles.separator} />

      <ScrollView
        contentContainerStyle={styles.tagsContainer}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        {renderTags()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBox: {
    backgroundColor: Colors.background,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrowContainer: {
    position: "absolute",
    left: "7%",
    top: "20%",
  },
  backArrow: {
    width: 35,
    height: 35,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.SemiBold,
    color: Colors.text,
    marginBottom: 5,
  },
  separator: {
    borderBottomColor: Colors.placeholderText,
    borderBottomWidth: 1,
    width: "90%",
    alignSelf: "center",
    opacity: 0.2,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  tag: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    margin: 5,
  },
  tagSelected: {
    backgroundColor: Colors.highlightText,
  },
  tagText: {
    color: Colors.text,
    fontFamily: Fonts.SemiBold,
    textAlign: "center",
    fontSize: 18,
  },
  tagTextSelected: {
    color: Colors.background,
    fontFamily: Fonts.SemiBold,
    textAlign: "center",
    fontSize: 18,
  },
});

export default TagsSelectionScreen;
