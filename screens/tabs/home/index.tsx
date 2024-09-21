import HomeLayout from "../../../components/layout/home.layout";
import React, { useState, useEffect, useCallback, useRef } from "react";
import FeedScreen from "../feed";
import DiscoverScreen from "../discover";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { HomeStackParamList } from "../../../navigation/homeStack";
import type { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../types/stackParams.types";
import { Camera } from "@rnmapbox/maps";
import { CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { useLocationStore } from "../../../store/useLocationStore";

type HomeScreenRouteProp = RouteProp<RootStackParamList, "HomePage">;

type TabType = "Feed" | "Discover";

const HomePage: React.FC = () => {
  const route = useRoute<HomeScreenRouteProp>();
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const [currentTab, setCurrentTab] = useState<TabType>(
    route.params?.activeTab || "Feed"
  );

  useEffect(() => {
    if (route.params?.activeTab) {
      setCurrentTab(route.params.activeTab);
      // Clear the activeTab param after setting the state
      navigation.setParams({ activeTab: undefined });
    }
  }, [route.params, navigation]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setCurrentTab(tab);
      navigation.setParams({ activeTab: tab });
    },
    [navigation]
  );

  return (
    <HomeLayout activeTab={currentTab} onTabChange={handleTabChange}>
      {currentTab === "Feed" ? <FeedScreen /> : <DiscoverScreen />}
    </HomeLayout>
  );
};

export default HomePage;
