// will be used to notications that a user has received and will be persisted

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NotificationStoreProps {
  id: string;
  title: string;
  screen: string;
  message: string;
  data: {
    userId?: string;
    postId?: string;
    profilePicture?: string;
  };
  createdAt: Date;
}

interface NotificationStore {
  notifications: NotificationStoreProps[];
  addNotification: (notification: NotificationStoreProps) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const useNotificationStore = create(
  persist<NotificationStore>(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== id
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useNotificationStore;
