import { create } from "zustand";
import * as Location from "expo-location";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LocationState {
  location: Location.LocationObject | null;
  isLoading: boolean;
  error: string | null;
  fetchLocation: () => Promise<void>;
  returnToCurrentLocation: () => void;
  setReturnToCurrentLocation: (callback: () => void) => void;
}

export const useLocationStore = create(
  persist<LocationState>(
    (set) => ({
      location: null,
      isLoading: false,
      error: null,
      fetchLocation: async () => {
        set({ isLoading: true, error: null });
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            set({
              error: "Permission to access location was denied",
              isLoading: false,
            });
            return;
          }
          const location = await Location.getCurrentPositionAsync({});
          set({ location, isLoading: false });
        } catch (error) {
          set({ error: error as string, isLoading: false });
        }
      },
      returnToCurrentLocation: () => {},
      setReturnToCurrentLocation: (callback) =>
        set({ returnToCurrentLocation: callback }),
    }),
    {
      name: "location-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
