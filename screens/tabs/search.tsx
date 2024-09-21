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

import ProfilesView from "../../components/searchScreen/ProfilesView";
import RestaurantsView from "../../components/searchScreen/RestaurantsView";
import { tagsData } from "../../config/constants";
import { Fonts } from "../../utils/fonts";
import TagButton from "../../components/searchScreen/tagButton";
import { useAuth } from "../../context/auth.context";

const SearchScreen = () => {
  const [activeTab, setActiveTab] = useState<"Profiles" | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>();
  const [dropdownLayout, setDropdownLayout] = useState({ width: 0, x: 0 });
  const [showLocationDropdown, setShowLocationDropdown] =
    useState<boolean>(false);
  const locationTabRef = useRef<TouchableOpacity | null>(null);

  const { userProfile } = useAuth();

  // set default location to user's location
  useEffect(() => {
    if (userProfile) {
      setSelectedLocation(userProfile.location);
    }
  }, [userProfile]);

  console.log("selected location", selectedLocation);

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
    console.log("selected location", location);
  };

  const handleTabPress = (tab: "Profiles") => {
    setActiveTab((prevTab) => (prevTab === tab ? null : tab));
  };

  const locations = [
    "Toronto",
    "Mississauga",
    "Brampton",
    "Hamilton",
    "Montreal",
    "Ottawa",
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
        >
          <UserCircle
            size={18}
            color={activeTab === "Profiles" ? "#fff" : "#000"}
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
        >
          <MapPin color="#000" size={18} />
          <Text style={[styles.tabButtonText]}>{selectedLocation}</Text>
          <ChevronDown color="#000" size={18} />
        </TouchableOpacity>
      </View>
      {showLocationDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              width: dropdownLayout.width,
              left: dropdownLayout.x,
            },
          ]}
        >
          {locations.map((location) => (
            <TouchableOpacity
              key={location}
              style={styles.dropdownItem}
              onPress={() => handleLocationSelection(location)}
            >
              <Text>{location}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    padding: 10,
  },
  dropdown: {
    position: "absolute",
    top: 105,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: Colors.tags,
  },
  tabButtonText: {
    marginLeft: 8,
    color: "#000",
  },
  activeTabText: {
    color: "#fff",
  },
});

export default SearchScreen;
