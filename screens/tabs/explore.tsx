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
  MapPin,
  Search
} from "lucide-react-native";
import Colors from "../../utils/colors";

import ProfilesView from "../../components/explore/ProfilesView";
import RestaurantsView from "../../components/explore/RestaurantsView";
import { Fonts } from "../../utils/fonts";
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
        <Text style={styles.exploreText}>Explore</Text>
        <TouchableOpacity
          style={[
            styles.tabButtonSearch,
            activeTab === "Profiles" && styles.activeTab,
          ]}
          onPress={() => handleTabPress("Profiles")}
          activeOpacity={1}
        >
          <Search
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
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          ref={locationTabRef}
          style={[styles.tabButton]}
          onPress={() => setShowLocationDropdown(!showLocationDropdown)}
        >
          <MapPin color={Colors.background} size={20} style={{marginRight: width * 0.01}} />
          <Text style={[styles.tabButtonText]}>{selectedLocation}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>Try new local favorites</Text>

      {showLocationDropdown && (
        <ScrollView
          showsVerticalScrollIndicator={false}
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
              activeOpacity={1}
            >
              <Text>{location}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.container}>
        {activeTab === null && <RestaurantsView location={selectedLocation!} />}
        {activeTab === "Profiles" && <ProfilesView location={selectedLocation} />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: width * 0.01
  },
  container: {
    flex: 1,
    marginTop: width * 0.01
  },
  exploreText: {
    fontSize: width * 0.09,
    fontFamily: Fonts.SemiBold,
  },
  description: {
    fontSize: width * 0.04,
    fontFamily: Fonts.Regular,
    paddingLeft: width * 0.05,
    marginTop: -(width * 0.01)
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: width * 0.05,
    paddingTop: width * 0.03,
    paddingBottom: width * 0.02,
    justifyContent: "space-between",
    alignItems: "center"
  },
  dropdown: {
    position: "absolute",
    top: height * 0.15,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBackground,
    zIndex: 1000,
    maxHeight: height * 0.2,
    minWidth: width * 0.25,  
  },
  dropdownItem: {
    padding: width * 0.03,
    minWidth: width * 0.25, 
    justifyContent: 'center', 
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputBackground,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.tags,
    padding: width * 0.027,
    borderRadius: 10,
    marginBottom: -(width * 0.09)
  },
  tabButtonSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: width * 0.027,
    borderRadius: 90,
    marginRight: -(width * 0.22),
    marginBottom: -(width * 0.09)
  },
  activeTab: {
    backgroundColor: Colors.tags,
  },
  tabButtonText: {
    fontFamily: Fonts.Regular,
    color: Colors.background,
    fontSize: width * 0.04,
  },
  activeTabText: {
    color: Colors.background,
  },
});


export default SearchScreen;
