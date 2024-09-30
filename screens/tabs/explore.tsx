import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronDown,
  MapPin,
  UserCircle,
  UtensilsCrossed,
} from "lucide-react-native";
import Colors from "../../utils/colors";

import ProfilesView from "../../components/explore/ProfilesView";
import RestaurantsView from "../../components/explore/RestaurantsView";
import { tagsData } from "../../config/constants";
import { Fonts } from "../../utils/fonts";
import TagButton from "../../components/explore/tagButton";
import { useAuth } from "../../context/auth.context";

const { width, height } = Dimensions.get("window");

const SearchScreen = () => {
  const [activeTab, setActiveTab] = useState<"Profiles" | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>();
  const [dropdownLayout, setDropdownLayout] = useState({ width: 0, x: 0 });
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const locationTabRef = useRef<TouchableOpacity | null>(null);

  const { userProfile } = useAuth();

  // set default location to user's location
  useEffect(() => {
    if (userProfile) {
      setSelectedLocation(userProfile.location);
    }
  }, [userProfile]);

  // Measure the layout of the location button when the component mounts
  useEffect(() => {
    if (locationTabRef.current) {
      locationTabRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownLayout({ width, x: pageX });
      });
    }
  }, []);

  const handleLocationSelection = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  
  };

  const handleTabPress = (tab: "Profiles") => {
    setActiveTab((prevTab) => (prevTab === tab ? null : tab));
  };

  const locations = [
    "Brampton",
    "Burlington",
    "Guelph",
    "Hamilton",
    "Laval",
    "London",
    "Markham",
    "Mississauga",
    "Montreal",
    "Oakville",
    "Ottawa",
    "Scarborough",
    "Toronto",
    "Windsor",
    "York",
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "Profiles" && styles.activeTab,
          ]}
          onPress={() => handleTabPress("Profiles")}
          activeOpacity={1}
        >
          <UserCircle
            size={20}
            color={
              activeTab === "Profiles" ? Colors.background : Colors.placeholderText
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "Profiles" && styles.activeTabText,
            ]}
          >
            Profiles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          ref={locationTabRef}
          style={[styles.tabButton]}
          onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          onLayout={(event) => {
            const { width, x } = event.nativeEvent.layout;
            setDropdownLayout({ width, x });
          }}
          activeOpacity={1}
        >
          <MapPin color={Colors.placeholderText} size={20} />
          <Text style={[styles.tabButtonText]}>{selectedLocation}</Text>
          <ChevronDown color={Colors.placeholderText} size={20} />
        </TouchableOpacity>
      </View>
      {showLocationDropdown && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[
            styles.dropdown,
            {
              width: dropdownLayout.width, // Use dynamic width from layout
              left: dropdownLayout.x, // Align dropdown with the tab button
            },
          ]}
        >
          {locations.map((location) => (
            <TouchableOpacity
              key={location}
              style={styles.dropdownItem}
              onPress={() => handleLocationSelection(location)}
              activeOpacity={1}
            >
              <Text>{location}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={styles.container}>
        {activeTab === null && <RestaurantsView location={selectedLocation!} />}
        {activeTab === "Profiles" && <ProfilesView />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: width * 0.03,
    paddingTop: width * 0.03,
    paddingBottom: width * 0.02,
  },
  dropdown: {
    position: "absolute",
    top: height * 0.13,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBackground,
    zIndex: 1000,
    maxHeight: height * 0.2,
    minWidth: width * 0.1,
  },
  dropdownItem: {
    padding: width * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputBackground,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: width * 0.03,
    borderRadius: 10,
    marginRight: width * 0.03,
  },
  activeTab: {
    backgroundColor: Colors.tags,
  },
  tabButtonText: {
    fontFamily: Fonts.Regular,
    color: Colors.placeholderText,
    paddingHorizontal: width * 0.02,
    fontSize: width * 0.04,
  },
  activeTabText: {
    color: Colors.background,
  },
});

export default SearchScreen;
