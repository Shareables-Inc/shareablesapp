import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserService } from "../services/user.service";
import { UserProfile } from "../models/userProfile"; // Assuming you have this model defined

const userService = new UserService();

// Hook to get user by UID with real-time update using Firestore's onSnapshot
export const useUserGetByUid = (uid: string) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    setIsLoading(true);
    const unsubscribe = userService.subscribeToUserByUid(uid, (updatedProfile) => {
      setUserProfile(updatedProfile);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Clean up the subscription when component unmounts
  }, [uid]);

  return { data: userProfile, isLoading };
};

// Hook to get user by username (not using real-time subscription, assuming this is for search)
export const useUserGetByUsername = (username: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["userDetails", username],
    queryFn: () => userService.getUserByUsername(username),
    enabled: !!username,
  });

  return { data, isLoading, refetch };
};

// Hook to update user preferences
export const useUserUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uid,
      preferences,
    }: {
      uid: string;
      preferences: {
        notifications: boolean;
        reviewReminders: boolean;
        newFollowers: boolean;
        likesOnPosts: boolean;
        commentsOnPosts: boolean;
        friendPosts: boolean;
      };
    }) => userService.updateUserPreferences(uid, preferences),
    onSuccess: (_, variables) => {
      // Invalidate userDetails cache so updated preferences can be refetched
      queryClient.invalidateQueries({
        queryKey: ["userDetails", variables.uid],
      });
    },
    onError: (error) => {
      console.error("Error updating preferences", error);
    },
  });
};

// Hook to update user profile details such as name, bio, or profile picture
export const useUserUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uid,
      updatedData,
    }: {
      uid: string;
      updatedData: Partial<{ firstName: string; lastName: string; profilePicture: string; bio: string }>;
    }) => userService.updateUserProfile(uid, updatedData),
    onSuccess: (_, variables) => {
      // Invalidate userDetails cache so updated profile data can be refetched
      queryClient.invalidateQueries({
        queryKey: ["userDetails", variables.uid],
      });
    },
    onError: (error) => {
      console.error("Error updating profile", error);
    },
  });
};
